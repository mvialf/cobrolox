# Contexto: Aumento de Cobertura de Tests

## Problema

El proyecto tiene 373 tests pasando (2 rotos) en 20 suites, pero módulos críticos como importación de datos, varias validaciones y lógica de retry no tienen cobertura. Un bug en el parser de Excel o en las validaciones de importación corrompe datos masivamente sin que los tests lo detecten.

Los 2 tests rotos en `app/api/cron/recalculate-balances/__tests__/route.test.ts` se deben a strings de log desactualizados tras un refactor reciente (commit `8e92ac8`).

## Estado actual del código

### Tier 1 — Archivos sin tests (lógica crítica)

| Archivo | Líneas | Rol | Exports principales | Pura? | Verificado |
|---------|--------|-----|---------------------|-------|------------|
| `lib/import/excel-parser.ts` | ~201 | Parser de Excel genérico | `parseExcel()`, `parseDecimal()`, `parseDate()`, `isNotEmpty()` | Parcial (parseExcel usa File API) | sí |
| `lib/import/invoice-import.ts` | ~338 | Validación de filas de factura importadas | `validateInvoiceRow()`, `validateInvoiceBatch()`, `INVOICE_TEMPLATE_DATA` | sí | sí |
| `lib/import/customer-import.ts` | ~258 | Validación de filas de cliente importadas | `validateCustomerRow()`, `validateCustomerBatch()`, `CUSTOMER_TEMPLATE_DATA` | sí | sí |
| `lib/validations/installment-validations.ts` | ~122 | Schema Zod + helpers de cuotas | `installmentSchema`, `formValuesToPayload()`, `installmentToFormValues()` | sí | sí |
| `lib/validations/invitation-validations.ts` | ~68 | Schemas de invitación + derivación de estado | `createInvitationSchema`, `acceptInvitationSchema`, `getInvitationStatus()` | sí | sí |
| `lib/business-logic/customer-balance-retry.ts` | ~111 | Retry con backoff exponencial | `recalculateCustomerBalancesWithRetry()` | no (DB, logger, timers) | sí |

### Tier 2 — Archivos sin tests (validaciones y utilidades)

| Archivo | Líneas | Rol | Exports principales | Pura? | Verificado |
|---------|--------|-----|---------------------|-------|------------|
| `lib/validations/customer-validations.ts` | ~58 | Schema Zod de cliente (RUT, email) | `customerSchema` | sí | sí |
| `lib/validations/badge-color-validations.ts` | ~127 | Schema + helpers de colores de badge | `badgeColorSchema`, `formValuesToPayload()`, `badgeColorToFormValues()` | sí | sí |
| `lib/validations/invoice-status-validations.ts` | ~136 | Schema + helpers de estados de factura | `invoiceStatusSchema`, `formValuesToPayload()`, `invoiceStatusToFormValues()` | sí | sí |
| `lib/validations/payment-method-validations.ts` | ~114 | Schema + helpers de métodos de pago | `paymentMethodSchema`, `formValuesToPayload()`, `methodToFormValues()` | sí | sí |
| `lib/validations/payment-invoice-status-validations.ts` | ~143 | Schema + helpers de estados de pago-factura | `paymentInvoiceStatusSchema`, helpers | sí | sí |
| `lib/regiones-chile.ts` | ~83 | Lookups de regiones/comunas de Chile | `getRegiones()`, `getComunasByRegion()`, `getRegionByComuna()`, etc. (7 funciones) | sí | sí |
| `hooks/use-rut-input.ts` | ~170 | Hook de formateo dinámico de RUT | `useRutInput()` | no (useState, useCallback) | sí |

### Tests rotos

| Archivo | Tests | Problema | Verificado |
|---------|-------|----------|------------|
| `app/api/cron/recalculate-balances/__tests__/route.test.ts` | 2 de 15 | String cambió de `"Customer balance recalculation completed successfully"` a `"Customer balanceTotal recalculation completed"` + falta match de `durationMs`/`durationSeconds` | sí |

## Consumidores

### Tier 1 — Impacto de cambios

| Capa | Archivo | Qué importa | Impacto |
|------|---------|-------------|---------|
| import | `invoice-import.ts` | `parseDate`, `parseDecimal`, `isNotEmpty` de `excel-parser.ts` | Indirecto — no se modifican, solo se testean |
| import | `customer-import.ts` | `isNotEmpty` de `excel-parser.ts`, `customerSchema` | Indirecto |
| components | Dialogs de importación | `validateInvoiceBatch`, `validateCustomerBatch` | Indirecto |
| api/cron | `recalculate-balances/route.ts` | `recalculateCustomerBalancesWithRetry()` | Indirecto |

No hay impacto de "Rompe" porque el plan es solo agregar tests, no modificar código fuente.

## Cobertura de tests actual

| Archivo afectado | Test directo | Cobertura |
|-----------------|-------------|-----------|
| `lib/import/excel-parser.ts` | — | Sin cobertura |
| `lib/import/invoice-import.ts` | — | Sin cobertura |
| `lib/import/customer-import.ts` | — | Sin cobertura |
| `lib/validations/installment-validations.ts` | — | Sin cobertura |
| `lib/validations/invitation-validations.ts` | — | Sin cobertura |
| `lib/business-logic/customer-balance-retry.ts` | — | Sin cobertura |
| `lib/validations/customer-validations.ts` | `rut-validations.test.ts` (51 tests) | Indirecta (solo la parte de RUT) |
| `lib/validations/badge-color-validations.ts` | — | Sin cobertura |
| `lib/validations/invoice-status-validations.ts` | — | Sin cobertura |
| `lib/validations/payment-method-validations.ts` | — | Sin cobertura |
| `lib/validations/payment-invoice-status-validations.ts` | — | Sin cobertura |
| `lib/regiones-chile.ts` | — | Sin cobertura |
| `hooks/use-rut-input.ts` | — | Sin cobertura |
| `app/api/cron/recalculate-balances/route.ts` | `route.test.ts` (15 tests, 2 rotos) | Completa (con fix pendiente) |

## Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| `parseExcel()` requiere mock de File API / ArrayBuffer | Testear helpers puros (`parseDecimal`, `parseDate`, `isNotEmpty`) por separado; `parseExcel` con fixture de File mock |
| `customer-balance-retry.ts` tiene side effects (DB, timers, alertas) | Mock de dependencias + `vi.useFakeTimers()` para backoff |
| `useRutInput` hook requiere `@testing-library/react` + `renderHook` | Verificar que `@testing-library/react` ya está instalada |
| Schemas Zod triviales (enums) tienen bajo ROI por test | Limitar a ~3-5 tests por schema trivial, focalizando en refines y edge cases |
