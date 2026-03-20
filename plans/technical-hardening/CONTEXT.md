# Contexto: Hardening Técnico (Diagnóstico Cobrolox vs Cobralon)

Análisis comparativo entre cobrolox y cobralon (proyecto hermano más maduro, mismo stack). Se identificaron mejoras en BD, cálculos, y UX/UI que no agregan features nuevas sino que endurecen la implementación existente.

## Problema

Cobrolox tiene gaps técnicos en 3 ejes:

1. **Base de datos**: Falta de constraints que previenen corrupción, transacciones no atómicas en flujo crítico de pagos, y búsqueda sin normalización de acentos.
2. **Cálculos**: Tolerancia hardcodeada en validaciones, mapa de monedas duplicado.
3. **UX/UI**: Rendering 100% client-side (spinner en primera visita), sin debounce en búsqueda, 3 patrones distintos de confirmación de delete, DataTable sin card unificada.

## Estado actual del código

### Base de datos

| Archivo | Líneas | Rol | Verificado |
|---------|--------|-----|------------|
| `prisma/schema.prisma` | 298 | Schema completo | sí |
| `app/api/payments/route.ts` | 589 | CRUD pagos — flujo más crítico | sí |
| `lib/business-logic/invoice-balance.ts` | 125 | Recálculo de balance post-pago | sí |
| `lib/business-logic/customer-balance-retry.ts` | ~60 | Retry de recálculo de cliente | sí |

**PaymentAllocation (schema:286-298)**: No tiene `@@unique([paymentId, invoiceId])`. La validación de duplicados es solo en JS (route.ts:313-319 con Set). Un race condition podría crear allocations duplicadas.

**InvoiceStatus/PaymentInvoiceStatus (schema:219-251)**: Relación `color BadgeColor` sin `onDelete: Restrict`. Si se borra un BadgeColor, los status quedan con FK rota.

**Payment (schema:176-199)**: Falta `@@index([customerId, date(sort: Desc)])` para query "pagos recientes de un cliente".

**POST /api/payments (route.ts:458-558)**: Crea el pago con `prisma.payment.create` (atómico solo para el create). Luego llama `updateInvoicesBalance` y `recalculateCustomerBalancesWithRetry` **fuera de transacción** (route.ts:575-582). Si fallan, el pago existe pero los balances quedan desincronizados.

Cobralon resuelve esto con `prisma.$transaction` que engloba create + recálculo de balances.

### Cálculos

| Archivo | Líneas | Rol | Verificado |
|---------|--------|-----|------------|
| `lib/validations/invoice-validations.ts` | 161 | Schemas Zod para facturas | sí |
| `lib/format.ts` | 111 | Formateo de moneda/fecha/número | sí |
| `lib/constants/financial-constants.ts` | ~30 | Constantes financieras | sí |

**invoice-validations.ts:65**: Hardcodea `0.01` en lugar de usar `FINANCIAL.TOLERANCE`. El resto del codebase sí usa la constante.

**format.ts:24-30**: Define su propio `currencyConfig` que duplica `CURRENCY_CONFIG` de `financial-constants.ts`. Si se agrega una moneda en uno y no en el otro, habrá inconsistencia.

### UX/UI

| Archivo | Líneas | Rol | Verificado |
|---------|--------|-----|------------|
| `components/data-table/data-table.tsx` | 232 | DataTable principal | sí |
| `components/dialogs/confirm-delete-dialog.tsx` | 41 | Dialog de confirmación | sí |
| `app/customer/columns.tsx` | 297 | Columnas de clientes — usa ConfirmDeleteDialog | sí |
| `app/payments/columns.tsx` | 265 | Columnas de pagos — usa window.confirm() | sí |

**DataTable (data-table.tsx:160-231)**: Toolbar y tabla en `space-y-4` separados. No soporta `manualSorting` ni `manualFiltering` server-side. No tiene debounce.

**Delete inconsistente**:
- `customer/columns.tsx:121-139`: Usa `<ConfirmDeleteDialog>` wrapping un `DropdownMenuItem`
- `payments/columns.tsx:216-224`: Usa `window.confirm()` nativo
- `app/invoice/` (verificar): Probablemente un tercer patrón

**ConfirmDeleteDialog (confirm-delete-dialog.tsx)**: No acepta `title`, `description`, `isDeleting` ni estado controlado (`open/onOpenChange`). Texto fijo hardcodeado.

## Consumidores

| Capa | Archivo | Qué importa | Impacto |
|------|---------|-------------|---------|
| api | `app/api/payments/route.ts` | `updateInvoicesBalance`, `recalculateCustomerBalancesWithRetry` | Rompe — se envuelve en $transaction |
| api | `app/api/payments/[id]/route.ts` | Mismos helpers | Rompe — mismo cambio |
| api | `app/api/invoices/route.ts` | `getDerivedBalances` | Indirecto — sin cambios |
| schema | `prisma/schema.prisma` | Todos los API routes | Indirecto — agregar constraints no rompe queries |
| ui | `app/customer/columns.tsx` | `ConfirmDeleteDialog` | Rompe — nueva API del componente |
| ui | `app/payments/columns.tsx` | `window.confirm` | Rompe — migrar a ConfirmDeleteDialog |
| ui | `app/invoice/columns.tsx` | Verificar patrón actual | Incierto |
| ui | `components/data-table/data-table.tsx` | Todas las páginas con tabla | Indirecto — agregar props opcionales |
| lib | `lib/format.ts` | Múltiples componentes | Indirecto — solo cambia implementación interna |
| lib | `lib/validations/invoice-validations.ts` | Forms de invoice | Indirecto — solo cambia constante |

## Cobertura de tests

| Archivo afectado | Test directo | Cobertura |
|-----------------|-------------|-----------|
| `lib/business-logic/invoice-balance.ts` | `__tests__/invoice-balance.test.ts` | Completa |
| `lib/business-logic/customer-balance.ts` | `__tests__/customer-balance.test.ts` | Completa |
| `lib/validations/invoice-validations.ts` | `__tests__/invoice-validations.test.ts` | Completa |
| `lib/format.ts` | `__tests__/format.test.ts` | Completa |
| `app/api/payments/route.ts` | -- | Sin cobertura |
| `components/data-table/data-table.tsx` | -- | Sin cobertura |
| `components/dialogs/confirm-delete-dialog.tsx` | -- | Sin cobertura |
| `prisma/schema.prisma` | -- | N/A (declarativo) |

## Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| `@@unique` en PaymentAllocation puede fallar si ya hay duplicados en BD | Verificar con query SQL antes de migrar |
| Envolver POST payments en $transaction cambia el flujo de errores | Los tests de business-logic validan la lógica; el route no tiene tests directos |
| `unaccent` requiere extensión PostgreSQL en Neon | Verificar que Neon soporta `CREATE EXTENSION unaccent` |
| Cambiar API de ConfirmDeleteDialog rompe todos los usos actuales | Solo 2 consumidores directos (customer, payments) |
| SSR con HydrationBoundary requiere refactor de páginas | Cambio contenido pero aditivo — las páginas existentes siguen funcionando durante migración |
