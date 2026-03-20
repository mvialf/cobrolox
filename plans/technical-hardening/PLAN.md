# Hardening Técnico: BD, Cálculos, UX/UI

> **Estado**: `draft`

## Contexto

Endurecer la implementación existente de cobrolox basándose en patrones probados de cobralon. Sin features nuevas — solo correcciones de integridad, consistencia y calidad de UX. Ver `CONTEXT.md`.

## Scope

**Incluye**: Constraints de BD, transacción atómica en pagos, búsqueda sin acentos, unificación de constantes, debounce, SSR, ConfirmDeleteDialog unificado, DataTable card.

**Excluye**: Features nuevas (créditos, exportación Excel, calendario), cambios de modelo de datos, nuevos endpoints API.

## Decisiones de diseño

- **Transacción atómica en POST payments**: Envolver create + updateInvoicesBalance dentro de `$transaction`. El recálculo de customer balance se deja fuera como eventual consistency (tiene retry y cron de respaldo). Alternativa descartada: todo en $transaction — demasiado scope, el customer balance tolera lag.

- **ConfirmDeleteDialog controlado**: Migrar a API con `open/onOpenChange/title/description/isDeleting`. Alternativa descartada: mantener pattern trigger-based actual — no soporta estado de loading ni texto contextual.

- **SSR con HydrationBoundary**: Separar `page.tsx` (Server Component que prefetcha) de `page-client.tsx` (Client Component). Alternativa descartada: usar `loading.tsx` con skeleton — no elimina el problema, solo lo disfraza.

- **`unaccent` en PostgreSQL**: Crear extensión y función `normalize_text()` para búsquedas. Si Neon no soporta `unaccent`, fallback a búsqueda con `mode: insensitive` (statu quo). Alternativa descartada: normalización en JS — no escala con paginación server-side.

## Estrategia de tests

| Fase | Tipo de cambio | Verificación |
|------|---------------|--------------|
| Fase 1 | Schema constraints + transacción | Tests existentes de business-logic deben pasar sin cambios. Verificar migration con `db:push` |
| Fase 2 | Constantes y formateo | Tests existentes de `format.test.ts` e `invoice-validations.test.ts` deben pasar |
| Fase 3 | Componentes UI | Compilador + lint. Sin tests directos de componentes actualmente |
| Fase 4 | SSR + DataTable | Compilador + verificación manual en browser |

## Fases

### Fase 1: Integridad de base de datos y transacción atómica (Prioridad ALTA)

Constraints que previenen corrupción de datos y transacción atómica en el flujo más crítico.

#### Paso 1.1: Constraints en schema

- [ ] Agregar `@@unique([paymentId, invoiceId])` en `PaymentAllocation`
- [ ] Agregar `onDelete: Restrict` en `InvoiceStatus.color` → `BadgeColor`
- [ ] Agregar `onDelete: Restrict` en `PaymentInvoiceStatus.color` → `BadgeColor`
- [ ] Agregar `@@index([customerId, date(sort: Desc)])` en `Payment`
- [ ] Verificar que no hay duplicados existentes en BD antes de aplicar unique constraint
- [ ] Ejecutar `npm run db:push` y verificar que no hay errores
- [ ] `npm run typecheck && npm run lint`
- **Commit**: `fix(schema): agregar unique constraint en PaymentAllocation y restrict en status colors`

#### Paso 1.2: Transacción atómica en POST /api/payments

- [ ] Refactorizar `POST /api/payments` para que `payment.create` + `updateInvoicesBalance` estén dentro de `prisma.$transaction`
- [ ] Pasar `tx` como parámetro a `updateInvoiceBalance` (requiere overload o parámetro opcional de tx)
- [ ] Mantener `recalculateCustomerBalancesWithRetry` fuera de la transacción (eventual consistency)
- [ ] Verificar que `DELETE /api/payments/[id]` tiene el mismo patrón y aplicar si corresponde
- [ ] Tests existentes: `npm run test`
- [ ] `npm run typecheck && npm run lint`
- **Commit**: `fix(payments): envolver create + balance update en transacción atómica`

#### Al completar la fase

- [ ] Marcar checkboxes completados, anotar hashes de commits
- [ ] Registrar decisiones que cambiaron vs lo planeado
- [ ] Detallar los pasos de la fase siguiente
- [ ] Actualizar "Estado actual" al fondo del archivo
- **Commit**: `docs: actualizar plan technical-hardening con fase 1 completada`

---

### Fase 2: Consistencia de cálculos (Prioridad MEDIA)

**Objetivo**: Eliminar duplicación de constantes y hardcodeos en validaciones financieras.
**Scope**: `lib/format.ts`, `lib/validations/invoice-validations.ts`, `lib/constants/financial-constants.ts`.
**Criterio de éxito**: Tests existentes pasan. `formatCurrency` usa `getCurrencyConfig()`. Invoice validations usa `FINANCIAL.TOLERANCE`.
**Depende de**: Ninguna fase (independiente).

---

### Fase 3: Unificación de UX de eliminación (Prioridad MEDIA)

**Objetivo**: Un solo patrón de confirmación de delete en todo el proyecto.
**Scope**: `components/dialogs/confirm-delete-dialog.tsx`, `app/customer/columns.tsx`, `app/payments/columns.tsx`, `app/invoice/columns.tsx` (verificar).
**Criterio de éxito**: Todos los deletes usan `ConfirmDeleteDialog` controlado con `open/onOpenChange/title/description/isDeleting`. Cero usos de `window.confirm()`.
**Depende de**: Ninguna fase (independiente).

---

### Fase 4: Búsqueda sin acentos (Prioridad MEDIA)

**Objetivo**: Buscar "garcia" encuentra "García" en clientes, facturas y pagos.
**Scope**: Extensión PostgreSQL `unaccent`, función `normalize_text()`, queries de búsqueda en API routes.
**Criterio de éxito**: Búsqueda insensible a acentos funciona en customers, invoices y payments.
**Depende de**: Verificar soporte de `unaccent` en Neon.

---

### Fase 5: Debounce y prefetch en DataTable (Prioridad MEDIA)

**Objetivo**: Búsqueda con debounce (300-500ms) y prefetch de página siguiente.
**Scope**: `components/data-table/data-table.tsx`, `hooks/queries/use-*.ts`.
**Criterio de éxito**: Búsqueda no dispara re-render en cada keystroke. Al estar en página N, página N+1 se prefetcha.
**Depende de**: Ninguna fase (independiente).

---

### Fase 6: SSR con HydrationBoundary (Prioridad BAJA)

**Objetivo**: Eliminar el spinner de primera visita en páginas principales.
**Scope**: `app/customer/page.tsx`, `app/invoice/page.tsx`, `app/payments/page.tsx` — cada una se separa en `page.tsx` (Server) + `page-client.tsx` (Client).
**Criterio de éxito**: Primera visita a cada página muestra datos sin estado de carga intermedio.
**Depende de**: Fase 5 (el DataTable debe soportar las props necesarias para server-side).

---

### Fase 7: DataTable card unificada y sorting server-side (Prioridad BAJA)

**Objetivo**: Envolver toolbar + tabla + paginación en card visual unificada. Agregar soporte para `manualSorting` y `manualFiltering`.
**Scope**: `components/data-table/data-table.tsx`, `components/data-table/data-table-toolbar.tsx`.
**Criterio de éxito**: DataTable renderiza como card cohesiva. Props opcionales `manualSorting`/`onSortingChange` disponibles.
**Depende de**: Fase 5 (debounce integrado en toolbar).

---

### Fase 8: Paginación obligatoria en todos los endpoints (Prioridad BAJA)

**Objetivo**: Estandarizar paginación con máximo 100 registros en todos los endpoints (customers, invoices actualmente permiten `limit=0` → todos los registros hasta 10000).
**Scope**: `app/api/customers/route.ts`, `app/api/invoices/route.ts`.
**Criterio de éxito**: Todos los endpoints respetan `limit` máximo 100. Ningún endpoint devuelve datasets sin paginar.
**Depende de**: Fase 6 (las páginas deben manejar paginación server-side antes de forzarla en el backend).

---

## Estado actual

**Paso en curso**: --
**Último completado**: --
**Siguiente acción concreta**: Aprobar plan, verificar duplicados en PaymentAllocation en BD, iniciar Fase 1 Paso 1.1
**Bloqueadores**: Pendiente verificar soporte de `unaccent` en Neon (afecta Fase 4)
