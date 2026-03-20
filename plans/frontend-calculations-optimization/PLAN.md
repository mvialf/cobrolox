# Optimización de cálculos frontend/backend

> **Estado**: `draft`

## Contexto

Mover cálculos que el frontend hace incorrectamente (sobre datos parciales) o inconsistentemente al backend, y mejorar UX del formulario de pagos FIFO. Ver `CONTEXT.md`.

## Scope

**Incluye**: Stats de installments desde API, isOverdue desde backend, filtros globales de facturas, preview post-FIFO, formatCurrency consistente, lastInvoiceNumber desde API
**Excluye**: Cambios al algoritmo FIFO, cambios al cálculo de balances, nuevos endpoints de preview de pagos

## Decisiones de diseno

- **Stats como campo adicional en respuesta existente, no endpoint separado**: Evita un roundtrip extra. La query agregada de Prisma es barata y se ejecuta en paralelo con findMany. Alternativa descartada: endpoint `/api/installments/stats` — requiere query duplicada de filtros.

- **isOverdue como campo virtual en respuesta, no columna en DB**: No requiere migración. Se calcula en el map del API con la misma comparación `dueDate < now && status === 'pending'`. Alternativa descartada: columna en DB con cron — agrega complejidad de sincronización.

- **Filtros globales en la misma respuesta de invoices**: Un DISTINCT en Prisma sobre los 3 campos es liviano. Alternativa descartada: endpoint separado — agrega complejidad sin beneficio real.

- **Preview de balances post-FIFO en el form, sin API**: El frontend ya tiene `balance` e `allocatedAmount` de cada factura. Restar es trivial. Alternativa descartada: endpoint POST /api/payments/preview — overengineering.

## Estrategia de tests

| Fase | Tipo de cambio | Verificacion |
|------|---------------|--------------|
| Fase 1 | Agregar stats a API existente + refactor page | Compilador + verificación manual |
| Fase 2 | Agregar campo a respuesta API + refactor page | Compilador + verificación manual |
| Fase 3 | Agregar filtros a API + refactor page | Compilador + verificación manual |
| Fase 4 | Agregar UI en form existente | Compilador + verificación manual |
| Fase 5 | Reemplazar Intl por formatCurrency | Compilador + tests existentes de format.ts |
| Fase 6 | Cambiar origen de lastInvoiceNumber | Compilador |

## Fases

### Fase 1: Stats globales de installments desde API (Prioridad ALTA)

Problema: las cards de stats muestran conteos/montos de la página visible (50 registros), no del total.

#### Paso 1.1: Agregar stats a GET /api/installments

- [ ] En `app/api/installments/route.ts`: agregar query agregada de Prisma en paralelo con findMany y count:
  ```
  prisma.installment.groupBy({
    by: ['status'],
    where,
    _count: true,
    _sum: { amount: true }
  })
  ```
- [ ] Calcular `overdue` count separado: `prisma.installment.count({ where: { ...where, status: 'pending', dueDate: { lt: today } } })`
- [ ] Calcular `overdueAmount`: `prisma.installment.aggregate({ where: { ...where, status: 'pending', dueDate: { lt: today } }, _sum: { amount: true } })`
- [ ] Agregar campo `stats` a la respuesta JSON:
  ```json
  {
    "installments": [...],
    "pagination": {...},
    "stats": {
      "total": N,
      "pending": N,
      "paid": N,
      "overdue": N,
      "totalPending": N,
      "totalPaid": N,
      "totalOverdue": N
    }
  }
  ```
- **Commit**: `feat(api): agregar stats agregadas a GET /api/installments`

#### Paso 1.2: Actualizar hook y pagina

- [x] En `hooks/queries/use-installments.ts`: agregar tipo `InstallmentsStats` y campo `stats` a `InstallmentsResponse`
- [x] En `app/payments/installments/page.tsx`: reemplazar `useMemo` de stats por `data?.stats`
- [x] Card de "Vencidas" ahora muestra monto con `stats.totalOverdue`
- [x] Reemplazar `new Intl.NumberFormat` hardcodeado por `formatCurrency()` (adelantado de Fase 5)
- **Commit**: `feat(installments): usar stats del API en lugar de calcular sobre pagina`

#### Al completar la fase

- [x] Implementado en un solo paso (1.1 + 1.2 juntos)
- [x] Decision: se combinaron ambos pasos porque no hay beneficio en commitear solo el backend sin el frontend
- [x] Fase 2 detallada abajo

### Fase 2: isOverdue desde backend (Prioridad MEDIA)

**Objetivo**: Que el API devuelva `isOverdue: boolean` en cada installment, eliminando el calculo duplicado en columns.tsx y page.tsx.
**Scope**: `app/api/installments/route.ts`, `app/payments/installments/columns.tsx`
**Criterio de exito**: Columna de vencimiento usa `row.original.isOverdue` en vez de calcular con Date.
**Depende de**: Fase 1 (misma API route).

### Fase 3: Filtros globales de facturas (Prioridad MEDIA)

**Objetivo**: Que GET /api/invoices devuelva las opciones de filtro (clientes, estados, payment statuses) con valores globales, no solo los de la pagina visible.
**Scope**: `app/api/invoices/route.ts`, `app/invoice/page.tsx`, `hooks/queries/use-invoices.ts`
**Criterio de exito**: Dropdown de clientes muestra TODOS los clientes con facturas, no solo los de la pagina 1.
**Depende de**: Ninguna.

### Fase 4: Preview de balances post-FIFO (Prioridad MEDIA)

**Objetivo**: Mostrar en la tabla de allocations del form de pago a cliente como quedara el balance de cada factura despues de aplicar el pago.
**Scope**: `components/forms/payments/payment-to-customer-form.tsx`
**Criterio de exito**: Cada fila de factura muestra "Balance actual: $X -> Nuevo: $Y" o similar.
**Depende de**: Ninguna.

### Fase 5: Usar formatCurrency en installments (Prioridad BAJA)

**Objetivo**: Reemplazar `new Intl.NumberFormat("es-CL", ...)` hardcodeado en page.tsx y columns.tsx por `formatCurrency()` de `lib/format.ts`.
**Scope**: `app/payments/installments/page.tsx`, `app/payments/installments/columns.tsx`
**Criterio de exito**: Cero instancias de `new Intl.NumberFormat` en archivos de installments.
**Depende de**: Ninguna.

### Fase 6: lastInvoiceNumber desde API (Prioridad BAJA)

**Objetivo**: Que GET /api/invoices devuelva `meta.lastInvoiceNumber` con el MAX real, en vez de depender de que invoices[0] sea el mas reciente.
**Scope**: `app/api/invoices/route.ts`, `app/invoice/page.tsx`, `hooks/queries/use-invoices.ts`
**Criterio de exito**: lastInvoiceNumber no depende del sort de la tabla.
**Depende de**: Fase 3 (misma API route — conviene hacer juntas).

## Estado actual

**Paso en curso**: --
**Ultimo completado**: --
**Siguiente accion concreta**: Implementar Paso 1.1 — agregar stats a GET /api/installments
**Bloqueadores**: --
