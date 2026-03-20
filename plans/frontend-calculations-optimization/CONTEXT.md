# CONTEXT — Optimización de cálculos frontend/backend

## Problema

Hay 6 problemas identificados donde el frontend calcula datos incorrectamente (sobre página parcial), duplica lógica del backend, o usa formateo inconsistente.

El más crítico: las stats de installments (total, pendientes, vencidas, pagadas, montos) se calculan sobre los 50 registros de la página visible, no sobre el total real. Si hay 200 cuotas en el sistema, las cards muestran números de la página actual.

## Estado actual del código

| Archivo | Lineas | Rol | Verificado |
|---------|--------|-----|------------|
| `app/api/installments/route.ts` | ~139 | GET installments con paginación | si |
| `app/payments/installments/page.tsx` | ~211 | Página de cuotas con cards de stats | si |
| `app/payments/installments/columns.tsx` | ~237 | Columnas DataTable con calculo isOverdue local | si |
| `hooks/queries/use-installments.ts` | ~258 | Hook React Query para installments | si |
| `app/api/invoices/route.ts` | ~378 | GET invoices con paginación y estados | si |
| `app/invoice/page.tsx` | ~120 | Página de facturas con filtros derivados de página | si |
| `components/forms/payments/payment-to-customer-form.tsx` | ~559 | Form pago a cliente con FIFO | si |
| `lib/format.ts` | ~112 | formatCurrency, formatDate, formatNumber | si |
| `components/dialogs/invoice/new-invoice-dialog.tsx` | ~N | Dialog nueva factura recibe lastInvoiceNumber | si |

## Consumidores

| Capa | Archivo | Que importa | Impacto |
|------|---------|-------------|---------|
| page | `installments/page.tsx` | `useInstallments` | Rompe — cambia shape de response |
| page | `installments/columns.tsx` | tipos Installment | Indirecto — no cambia |
| hook | `use-installments.ts` | tipos InstallmentsResponse | Rompe — nuevo campo stats |
| page | `invoice/page.tsx` | `useInvoices` | Rompe — cambia shape de response |
| hook | `use-invoices.ts` | tipos InvoicesResponse | Rompe — nuevo campo filters |
| form | `payment-to-customer-form.tsx` | `calculateFIFO`, `formatCurrency` | Indirecto — solo UI nueva |
| dialog | `new-invoice-dialog.tsx` | prop lastInvoiceNumber | Rompe — prop se elimina |

## Cobertura de tests

| Archivo afectado | Test directo | Cobertura |
|-----------------|-------------|-----------|
| `app/api/installments/route.ts` | No hay | Sin cobertura |
| `app/payments/installments/page.tsx` | No hay | Sin cobertura |
| `app/api/invoices/route.ts` | No hay | Sin cobertura |
| `app/invoice/page.tsx` | No hay | Sin cobertura |
| `lib/format.ts` | `lib/__tests__/format.test.ts` | Completa |
| `payment-to-customer-form.tsx` | No hay | Sin cobertura |

## Riesgos identificados

| Riesgo | Mitigacion |
|--------|------------|
| Stats de installments agregan query extra a DB | Una sola query agregada con groupBy es barata |
| Cambio de shape en API rompe tipos en frontend | Actualizar tipos en hooks al mismo tiempo |
| Filtros globales de invoices agregan latencia | Query separada liviana, solo DISTINCT de 3 campos |
| lastInvoiceNumber MAX() puede ser lento | Indice en invoiceNumber ya existe |
