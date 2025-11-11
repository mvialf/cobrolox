# MAPEO DE LÓGICA DE NEGOCIO CRÍTICA - Cobrolox

**Documento:** Mapeo exhaustivo de funciones que requieren tests unitarios  
**Fecha:** Noviembre 2025  
**Enfoque:** Validaciones, transformadores, utilidades, cálculos financieros y hooks personalizados

---

## ÍNDICE

1. [Funciones de Validación (RUT, Emails, Formularios)](#1-funciones-de-validación)
2. [Lógica de Negocio Financiera](#2-lógica-de-negocio-financiera)
3. [Transformadores de Datos](#3-transformadores-de-datos)
4. [Utilidades y Helpers](#4-utilidades-y-helpers)
5. [Importación de Datos](#5-importación-de-datos)
6. [Lógica Regional (Chile)](#6-lógica-regional-chile)
7. [Hooks Personalizados](#7-hooks-personalizados)
8. [Alertas y Monitoreo](#8-alertas-y-monitoreo)

---

## 1. FUNCIONES DE VALIDACIÓN

### 1.1 Validaciones de RUT (Chileno)

**Ubicación:** `/home/mau/programas/Cobrolox/lib/rut-validations.ts`

#### Funciones Críticas:

| Función                         | Propósito                                                  | Complejidad | Entrada           | Salida                |
| ------------------------------- | ---------------------------------------------------------- | ----------- | ----------------- | --------------------- |
| `rutHelpers.validate(rut)`      | Valida que un RUT sea válido (dígito verificador correcto) | **Media**   | `string`          | `boolean`             |
| `rutHelpers.format(rut)`        | Formatea RUT a formato estándar `XX.XXX.XXX-X`             | **Simple**  | `string` (limpio) | `string` (formateado) |
| `rutHelpers.clean(rut)`         | Remueve puntos y guión del RUT                             | **Simple**  | `string`          | `string` (limpio)     |
| `rutHelpers.getCheckDigit(rut)` | Calcula el dígito verificador del RUT                      | **Media**   | `string`          | `string`              |

#### Schemas Zod:

```typescript
// rutSchema - RUT obligatorio y válido
// rutSchemaOptional - RUT opcional pero válido si se proporciona
```

#### Tests Necesarios:

```javascript
✓ RUT válido: "12.345.678-9", "12345678-9", "123456789"
✓ RUT inválido: "12.345.678-0" (dígito verificador incorrecto)
✓ RUT con formato: "12.345.678-9" → formatea y valida correctamente
✓ RUT limpio: "12.345.678-9" → "123456789"
✓ Dígito verificador: "12345678" → "9"
✓ RUT vacío: "" → invalido
✓ RUT con caracteres especiales: "12$345$678-9" → sanitizar
```

---

### 1.2 Validaciones de Cliente

**Ubicación:** `/home/mau/programas/Cobrolox/lib/validations/customer-validations.ts`

#### Schema: `customerSchema`

```typescript
{
  rut: string (RUT válido - obligatorio)
  razonSocial: string (2+ caracteres - obligatorio)
  tradeName?: string (nombre de fantasía - opcional)
  businessActivity?: string (actividad económica - opcional)
  contact: string (persona de contacto - obligatorio)
  phone: string (teléfono - obligatorio)
  email?: string (email válido - opcional)
  street: string (dirección - obligatorio)
  apartment?: string (depto/casa - opcional)
  region: string (región chilena - obligatorio)
  comuna: string (comuna chilena - obligatorio)
}
```

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ Validar cliente completo válido
✓ Validar RUT inválido → error
✓ Validar email inválido → error (si se proporciona)
✓ Validar región inexistente → error
✓ Validar comuna inexistente → error
✓ Validar campos requeridos faltantes
✓ Validar caracteres especiales en razonSocial
✓ Validar longitud mínima de razonSocial (2 caracteres)
```

---

### 1.3 Validaciones de Factura

**Ubicación:** `/home/mau/programas/Cobrolox/lib/validations/invoice-validations.ts`

#### Schema: `invoiceSchema`

```typescript
{
  invoiceNumber: string (obligatorio)
  issueDate: Date (no puede ser futura - obligatorio)
  dueDate: Date (>= issueDate - obligatorio)
  subtotal: number (> 0 - obligatorio)
  taxAmount: number (>= 0 - obligatorio)
  total: number (> 0 - obligatorio)
  customerId: string (UUID - obligatorio)
  statusId?: string (opcional)
  termsDay?: number (días de crédito - opcional)
}
```

#### Validaciones Especiales:

1. **Consistencia de Cálculo:** `total === subtotal + taxAmount` (tolerancia ±0.01)
2. **Fechas Válidas:** `dueDate >= issueDate`
3. **Fecha No Futura:** `issueDate <= hoy`

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Validar factura completa válida
✓ issueDate futura → error
✓ dueDate < issueDate → error
✓ total != subtotal + taxAmount → error
✓ subtotal negativo → error
✓ customerId UUID inválido → error
✓ Cambio dinámico de fecha (hoy, mañana, ayer)
✓ Tolerancia de redondeo: total = 1190.001 con subtotal=1000, tax=190.001
✓ Schema de actualización (updateInvoiceSchema): campos opcionales
```

---

### 1.4 Validaciones de Pago

**Ubicación:** `/home/mau/programas/Cobrolox/lib/validations/payment-validations.ts`

#### Schemas:

1. **`paymentAllocationSchema`** - Una asignación individual

   ```typescript
   {
     invoiceId: string (UUID)
     allocatedAmount: number (> 0, máximo 2 decimales)
   }
   ```

2. **`paymentToInvoiceSchema`** - Pago 1:1 a factura

   ```typescript
   {
     invoiceId: string (UUID - obligatorio)
     amount: number (> 0)
     date: Date (obligatorio)
     paymentMethodId: string (UUID - obligatorio)
     selectedInstallments?: number (1-12)
     notes?: string (max 500 caracteres)
   }
   ```

3. **`paymentToCustomerSchema`** - Pago 1:N a múltiples facturas
   ```typescript
   {
     customerId: string (UUID - obligatorio)
     amount: number (> 0)
     date: Date (obligatorio)
     paymentMethodId: string (UUID - obligatorio)
     allocations: array (mínimo 1 allocation)
     selectedInstallments?: number (1-12)
     notes?: string (max 500)
   }
   ```

#### Validaciones Especiales:

- **Suma de Allocations:** `sum(allocations.allocatedAmount) === amount` (tolerancia ±0.01)
- **No duplicados:** No puede haber dos allocations para la misma factura
- **Al menos 1 allocation > 0**

#### Complejidad: **Compleja**

#### Tests Necesarios:

```javascript
✓ Validar pago 1:1 completo
✓ Validar pago 1:N completo
✓ suma de allocations != amount → error
✓ Allocation duplicada (misma invoiceId) → error
✓ Todas las allocations en $0 → error
✓ Monto con 3 decimales → error (máximo 2)
✓ paymentToInvoiceToPayload() convierte schema correctamente
✓ paymentToCustomerToPayload() convierte schema correctamente
✓ parseInvoicesWithBalance() convierte strings ISO a Date objects
```

---

### 1.5 Validaciones de Cuotas

**Ubicación:** `/home/mau/programas/Cobrolox/lib/validations/installment-validations.ts`

#### Schema: `installmentSchema`

```typescript
{
  paymentId: string (UUID - obligatorio)
  installmentNumber: number (>= 1 - obligatorio)
  amount: number (> 0 - obligatorio)
  dueDate: Date (obligatorio)
  paidDate?: Date (nullable, solo si status="paid")
  status?: "pending" | "paid" | "overdue"
}
```

#### Validaciones Especiales:

- **Si `status="paid"`:** `paidDate` es obligatorio
- **Si `status="pending"` o `"overdue"`:** `paidDate` debe ser `null`
- **`paidDate`** debe estar dentro de ±1 año de `dueDate`

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Validar cuota completa
✓ status="paid" sin paidDate → error
✓ status="pending" con paidDate → error
✓ paidDate > 1 año antes de dueDate → error
✓ installmentNumber < 1 → error
✓ amount con 3 decimales → error
✓ Helper markAsPaid(): convierte a payload correcto
✓ Helper markAsOverdue(): convierte a payload correcto
```

---

### 1.6 Validaciones de Método de Pago

**Ubicación:** `/home/mau/programas/Cobrolox/lib/validations/payment-method-validations.ts`

#### Schema: `paymentMethodSchema`

```typescript
{
  name: string (1-50 caracteres - obligatorio)
  icon?: string (max 50 caracteres - opcional)
  hasInstallments?: boolean
  maxInstallments?: number (2-36 si hasInstallments=true)
}
```

#### Validaciones Especiales:

- **Si `hasInstallments=true`:** `maxInstallments` es obligatorio

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ Validar método completo
✓ hasInstallments=true sin maxInstallments → error
✓ maxInstallments < 2 → error
✓ maxInstallments > 36 → error
✓ Nombre vacío → error
✓ formValuesToPayload() convierte correctamente
```

---

## 2. LÓGICA DE NEGOCIO FINANCIERA

### 2.1 Cálculo de Totales y Impuestos

**Ubicación:** `/home/mau/programas/Cobrolox/lib/business-logic/totals.ts`

#### Funciones Críticas:

| Función                                                  | Propósito                                            | Entrada                         | Salida    |
| -------------------------------------------------------- | ---------------------------------------------------- | ------------------------------- | --------- |
| `calculateProjectTotal(subtotal, taxRate)`               | Calcula total: `subtotal + (subtotal × taxRate/100)` | `number`, `number` (19 default) | `number`  |
| `calculateTax(subtotal, taxRate)`                        | Calcula solo el monto del impuesto                   | `number`, `number`              | `number`  |
| `calculateSubtotalFromTotal(total, taxRate)`             | Calcula inverso: `total / (1 + taxRate/100)`         | `number`, `number`              | `number`  |
| `validateProjectTotal(subtotal, taxRate, receivedTotal)` | Valida que total sea correcto (tolerancia ±0.01)     | `number`, `number`, `number`    | `boolean` |

#### Constantes:

```typescript
FINANCIAL.DEFAULT_TAX_RATE = 19; // IVA Chile
FINANCIAL.MIN_TAX_RATE = 0;
FINANCIAL.MAX_TAX_RATE = 100;
FINANCIAL.TOLERANCE = 0.01; // Tolerancia centavos
```

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ calculateProjectTotal(1000000, 19) === 1190000
✓ calculateProjectTotal(500000, 0) === 500000
✓ calculateTax(1000000, 19) === 190000
✓ calculateSubtotalFromTotal(1190000, 19) === 1000000
✓ validateProjectTotal(1000000, 19, 1190000) === true
✓ validateProjectTotal(1000000, 19, 1100000) === false (diferencia > 0.01)
✓ Subtotal negativo → error
✓ Tasa < 0 → error
✓ Tasa > 100 → error
✓ Redondeo: (1000000/3)*3 === 1000000 (con tolerancia)
```

---

### 2.2 Cálculo de Cuotas sin Interés

**Ubicación:** `/home/mau/programas/Cobrolox/lib/business-logic/installments.ts`

#### Función Principal: `calculateInstallments(amount, installments, paymentDate)`

**Algoritmo:**

```
baseAmount = floor((amount / installments) × 100) / 100
totalBase = baseAmount × (installments - 1)
lastAmount = amount - totalBase  ← ¡Absorbe centavos!
```

#### Ejemplo:

```
amount = $1000, installments = 3
baseAmount = floor((1000/3) × 100) / 100 = 333.33
totalBase = 333.33 × 2 = 666.66
lastAmount = 1000 - 666.66 = 333.34

Resultado:
Cuota 1: $333.33
Cuota 2: $333.33
Cuota 3: $333.34 ← Absorbe $0.01
SUMA: $1000.00 ✅ EXACTO
```

#### Validaciones:

```typescript
installments ∈ [1, 12]
amount > 0
dueDate válida
```

#### Retorna: `CalculatedInstallment[]`

```typescript
{
  installmentNumber: number
  amount: number
  dueDate: Date (fecha + (n-1) × 30 días)
}
```

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Divisiones exactas: 1200/3 → [400, 400, 400]
✓ Divisiones con centavos: 1000/3 → [333.33, 333.33, 333.34]
✓ Casos extremos: 100/7 → suma = 100.00 exacta
✓ 1 cuota: [amount]
✓ 12 cuotas: validar fechas (30 días entre cada una)
✓ installments = 0 → error
✓ installments = 13 → error
✓ amount <= 0 → error
✓ validateInstallmentsSum([...], 1000) === true
✓ Redondeo consistente: sum(cuotas) - amount < 0.01
```

---

### 2.3 Distribución FIFO de Pagos

**Ubicación:** `/home/mau/programas/Cobrolox/lib/business-logic/payment-fifo.ts`

#### Función Principal: `calculateFIFO(totalAmount, invoices)`

**Algoritmo:**

```
1. Ordenar facturas por issueDate (más antigua primero)
2. Para cada factura:
   - allocated = min(balance, remaining)
   - remaining -= allocated
3. Retornar allocations (incluyendo facturas con $0)
```

#### Ejemplo:

```
Facturas (por fecha):
F-001 (2025-01-01): balance=$300
F-002 (2025-02-01): balance=$400
F-003 (2025-03-01): balance=$200

Pago: $500

Resultado FIFO:
F-001: allocated=$300 (fully paid)
F-002: allocated=$200 (partial, remaining=$200)
F-003: allocated=$0 (no dinero)
```

#### Retorna: `FIFOAllocation[]`

```typescript
{
  invoiceId: string;
  invoiceNumber: string;
  balance: number;
  allocatedAmount: number;
  isFullyPaid: boolean;
}
```

#### Funciones Adicionales:

| Función                                            | Propósito                                                  |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `validateAllocationsSum(totalAmount, allocations)` | Valida que suma de allocations == totalAmount (tolerancia) |
| `filterInvoicesWithBalance(invoices)`              | Filtra solo facturas con balance > 0                       |

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ FIFO básico: 3 facturas, pago completo
✓ FIFO parcial: dinero insuficiente
✓ FIFO con sobrepago: dinero > suma de balances
✓ FIFO sin facturas elegibles: todas pagadas
✓ Ordenamiento por issueDate: orden correcto
✓ isFullyPaid flag: correcto en cada caso
✓ validateAllocationsSum(1000, [{amt: 600}, {amt: 400}]) === true
✓ validateAllocationsSum(1000, [{amt: 600}, {amt: 350}]) === false
✓ filterInvoicesWithBalance: solo balance > 0
```

---

### 2.4 Cálculo de Estados de Factura

**Ubicación:** `/home/mau/programas/Cobrolox/lib/business-logic/invoice-status.ts`

#### Función Principal: `calculateInvoiceStatuses(input, statuses)`

**Dos sistemas ortogonales:**

##### A. InvoiceStatus (Temporal)

```
balance = 0               → "completed"
balance > 0 ∧ dueDate < now → "overdue"
balance > 0 ∧ dueDate ≥ now → "current"
```

##### B. PaymentInvoiceStatus (Financiero)

```
balance = 0               → "paid"
paidAmount > 0 ∧ balance > 0 → "partial-payment"
paidAmount = 0 ∧ balance > 0 → "pending-payment"
```

#### Input:

```typescript
{
  balance: number;
  paidAmount: number;
  dueDate: Date;
}
```

#### Output:

```typescript
{
  invoiceStatus: InvoiceStatus;
  paymentInvoiceStatus: PaymentInvoiceStatus;
}
```

#### Funciones Adicionales:

| Función                                 | Retorna                     |
| --------------------------------------- | --------------------------- |
| `getInvoiceStatus(input, statuses)`     | Solo `InvoiceStatus`        |
| `getPaymentStatus(input, statuses)`     | Solo `PaymentInvoiceStatus` |
| `hasStatusChanged(current, calculated)` | `boolean`                   |

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ balance=0 → "completed" + "paid"
✓ balance>0, dueDate futuro → "current" + "pending-payment"
✓ balance>0, dueDate pasado → "overdue" + "pending-payment"
✓ balance>0, paidAmount>0 → "current/overdue" + "partial-payment"
✓ Cambio dinámico de estado según fecha (hoy vs mañana vs ayer)
✓ hasStatusChanged() detecta cambios correctamente
```

---

### 2.5 Recalculación de Balances de Cliente

**Ubicación:** `/home/mau/programas/Cobrolox/lib/business-logic/customer-balance.ts`

#### Función Principal: `recalculateCustomerBalances(customerId)`

**Lógica:**

```
1. Obtener todas las facturas del cliente
2. Para cada factura:
   - balance = total - sum(allocations.allocatedAmount)
   - Si balance <= 0: skip
   - Si dueDate < now: balanceVencido += balance
   - Si dueDate >= now: balanceVigente += balance
   - balanceTotal += balance
3. Actualizar Customer en BD
4. Retornar resultado
```

#### Retorna:

```typescript
{
  balanceTotal: number;
  balanceVigente: number;
  balanceVencido: number;
}
```

#### Funciones Adicionales:

| Función                                     | Propósito                 | Transaccional |
| ------------------------------------------- | ------------------------- | ------------- |
| `calculateCustomerBalances(customerId)`     | Calcula sin actualizar BD | No            |
| `recalculateMultipleCustomers(customerIds)` | Batch                     | Sí            |
| `recalculateAllCustomers()`                 | Todos los clientes        | Sí            |

#### Complejidad: **Compleja**

#### Tests Necesarios (Unitarios):

```javascript
✓ Cliente sin facturas → {total: 0, vigente: 0, vencido: 0}
✓ Cliente con 1 factura vigente sin pagar
✓ Cliente con 1 factura vigente parcialmente pagada
✓ Cliente con 1 factura vencida sin pagar
✓ Cliente con mix vigente + vencida
✓ Cliente con todas las facturas pagadas → {total: 0, vigente: 0, vencido: 0}
✓ Cálculo de paidAmount: suma correcta de allocations
✓ Edge case: allocation = $0.01 (centavo)
✓ Edge case: factura con balance = $0.005 (redondeado a $0)

NOTA: Tests de integración van en tests/integration/
(involucran Prisma, DB, transacciones)
```

---

### 2.6 Retry Automático para Balance

**Ubicación:** `/home/mau/programas/Cobrolox/lib/business-logic/customer-balance-retry.ts`

#### Función Principal: `recalculateCustomerBalancesWithRetry(customerId, logger, options)`

**Características:**

```
- Reintentos automáticos (default: 3)
- Backoff exponencial: baseDelay × attempt
- Alerta crítica si falla después de todos los reintentos
```

#### Retorna: `boolean`

```typescript
true; // Éxito
false; // Fallo definitivo
```

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Éxito en primer intento
✓ Éxito en segundo intento (después de 1 fallo)
✓ Fallo definitivo después de 3 intentos
✓ Backoff: delay = baseDelayMs × attempt
✓ Logger: logs correctos (debug, warn, error)
✓ Alerta enviada cuando falla definitivamente
```

---

## 3. TRANSFORMADORES DE DATOS

### 3.1 Transformadores de Pago

**Ubicación:** `/home/mau/programas/Cobrolox/lib/transformers/payment-transformers.ts`

#### Funciones:

| Función                                              | Propósito                                    | Entrada                                   | Salida                |
| ---------------------------------------------------- | -------------------------------------------- | ----------------------------------------- | --------------------- |
| `extractProjectAllocations(payments, projectId)`     | Extrae allocations de un proyecto específico | `PaymentFromAPI[]`, `string`              | `PaymentAllocation[]` |
| `sortAllocationsByDate(allocations, order)`          | Ordena por fecha de pago                     | `PaymentAllocation[]`, `'asc'/'desc'`     | `PaymentAllocation[]` |
| `processProjectPayments(payments, projectId, order)` | Pipeline completo: extrae + ordena           | `PaymentFromAPI[]`, `string`, `SortOrder` | `PaymentAllocation[]` |

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ extractProjectAllocations: filtra solo allocations del proyecto
✓ Proyectos no encontrados: retorna []
✓ sortAllocationsByDate('asc'): orden cronológico
✓ sortAllocationsByDate('desc'): orden inverso
✓ processProjectPayments: combina extracción + ordenamiento
✓ No mutación del array original
```

---

## 4. UTILIDADES Y HELPERS

### 4.1 Formateo de Moneda y Fechas

**Ubicación:** `/home/mau/programas/Cobrolox/lib/format.ts`

#### Funciones:

| Función                                   | Propósito                       | Entrada                                          | Salida   |
| ----------------------------------------- | ------------------------------- | ------------------------------------------------ | -------- |
| `formatCurrency(amount, currency)`        | Formatea como moneda            | `number`, `string` (CLP/USD/EUR)                 | `string` |
| `formatNumber(num, decimals)`             | Formatea número con separadores | `number`, `number`                               | `string` |
| `formatDate(dateString, variant, locale)` | Formatea fecha                  | `string/Date`, `'short'/'long'/'full'`, `locale` | `string` |

#### Ejemplos:

```typescript
formatCurrency(1234.56, "CLP"); // "$1.235"
formatCurrency(1234.56, "USD"); // "$1,234.56"
formatDate("2025-01-15", "short"); // "15/01/2025" (es-CL)
formatDate("2025-01-15", "long"); // "15 de enero de 2025" (es-CL)
```

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ CLP sin decimales: 1000 → "$1.000"
✓ USD con decimales: 1000.50 → "$1,000.50"
✓ EUR: 1000 → "€1,000.00"
✓ Moneda desconocida: fallback a CLP
✓ formatNumber(1234.567, 2) → "1,234.57"
✓ formatDate short: "15/01/2025"
✓ formatDate long: "15 de enero de 2025"
✓ formatDate full: "15 de enero de 2025, 14:30"
✓ Locales diferentes: en-US → "01/15/2025"
```

---

### 4.2 Utilidades de Factura

**Ubicación:** `/home/mau/programas/Cobrolox/lib/utils/invoice-utils.ts`

#### Funciones:

| Función                                         | Propósito                   | Entrada            | Salida                           |
| ----------------------------------------------- | --------------------------- | ------------------ | -------------------------------- |
| `calculateTaxAmount(subtotal)`                  | IVA 19% redondeado a entero | `number`           | `number`                         |
| `calculateTotal(subtotal, taxAmount)`           | Suma redondeada             | `number`, `number` | `number`                         |
| `calculateDueDate(issueDate, paymentTermsDays)` | Calcula vencimiento         | `Date`, `number`   | `Date`                           |
| `getInvoiceDueDateStatus(dueDate, warningDays)` | Estado temporal             | `Date`, `number`   | `'current'/'due-soon'/'overdue'` |
| `formatCurrency(amount)`                        | CLP con $                   | `number`           | `string`                         |

#### Constantes:

```typescript
TAX_RATE_CHILE = 0.19;
INVOICE_STATUS_CONFIG = {
  current: { variant: "default", label: "Vigente" },
  "due-soon": { variant: "outline", label: "Por vencer" },
  overdue: { variant: "destructive", label: "Vencida" },
};
```

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ calculateTaxAmount(1000) === 190
✓ calculateTaxAmount(230490) === 43793 (redondeado)
✓ calculateTotal(1000, 190) === 1190
✓ calculateDueDate(2025-01-01, 30) === 2025-01-31
✓ calculateDueDate(2025-01-31, 30) === 2025-03-02 (próximo mes)
✓ getInvoiceDueDateStatus: dueDate futura > 7 días → 'current'
✓ getInvoiceDueDateStatus: dueDate futura <= 7 días → 'due-soon'
✓ getInvoiceDueDateStatus: dueDate pasada → 'overdue'
✓ formatCurrency(1190000) === "$ 1.190.000"
```

---

### 4.3 Utilidades CSS

**Ubicación:** `/home/mau/programas/Cobrolox/lib/utils.ts`

#### Función: `cn(...inputs)`

```typescript
// Combina clases Tailwind sin conflictos
cn("px-2", "px-4"); // → 'px-4' (último gana)
cn("bg-red-500", "bg-red-500"); // → 'bg-red-500' (deduplicado)
```

#### Complejidad: **Simple (wrapper)**

#### Tests: Usar el tests del paquete `clsx` + `tailwind-merge`

---

## 5. IMPORTACIÓN DE DATOS

### 5.1 Parser Excel

**Ubicación:** `/home/mau/programas/Cobrolox/lib/import/excel-parser.ts`

#### Funciones Principales:

| Función                        | Propósito                  | Entrada                | Salida                    |
| ------------------------------ | -------------------------- | ---------------------- | ------------------------- |
| `parseExcel<T>(file, options)` | Parsea archivo Excel       | `File`, `ParseOptions` | `Promise<ParseResult<T>>` |
| `isNotEmpty(value)`            | Valida que no esté vacío   | `unknown`              | `boolean`                 |
| `parseDecimal(value)`          | Convierte string a número  | `string`               | `number \| null`          |
| `parseDate(value)`             | Parsea fechas multiformato | `string \| Date`       | `Date \| null`            |

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ parseExcel: procesa archivo válido
✓ parseExcel: maneja hojas múltiples (sheetIndex)
✓ isNotEmpty: null, undefined, "", 0, 1 → correctos
✓ parseDecimal: "1000" → 1000
✓ parseDecimal: "1.000,50" → 1000.50 (chileno)
✓ parseDecimal: "1,000.50" → 1000.50 (americano)
✓ parseDecimal: invalido → null
✓ parseDate: "DD/MM/YYYY" → correcto
✓ parseDate: "MM/DD/YY" → correcto
✓ parseDate: ISO date → correcto
✓ parseDate: Excel Date object → correcto
✓ parseDate: invalido → null
```

---

### 5.2 Importación de Clientes

**Ubicación:** `/home/mau/programas/Cobrolox/lib/import/customer-import.ts`

#### Funciones Principales:

| Función                              | Propósito                                  |
| ------------------------------------ | ------------------------------------------ |
| `validateCustomerRow(row, rowIndex)` | Valida 1 fila → `CustomerValidationResult` |
| `validateCustomerBatch(rows)`        | Valida lote completo → resumen             |

#### Lógica:

```
1. Validar campos requeridos (no vacío)
2. Limpiar y formatear RUT
3. Validar con Zod (customerSchema)
4. Retornar datos o errores
```

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Fila válida completa
✓ Campos requeridos faltantes → errores específicos
✓ RUT inválido → error
✓ Email inválido (si se proporciona) → error
✓ Región inexistente → error
✓ Comuna inexistente → error
✓ Lote con mezcla de filas válidas + inválidas
✓ Resumen correcto: total, valid, invalid
```

---

### 5.3 Importación de Facturas

**Ubicación:** `/home/mau/programas/Cobrolox/lib/import/invoice-import.ts`

#### Funciones Principales:

| Función                             | Propósito                                 |
| ----------------------------------- | ----------------------------------------- |
| `validateInvoiceRow(row, rowIndex)` | Valida 1 fila → `InvoiceValidationResult` |
| `validateInvoiceBatch(rows)`        | Valida lote completo                      |

#### Lógica de Cálculo de IVA:

```
1. Si taxAmount vacío:
   → Calcular automáticamente (19%)
2. Si taxAmount proporcionado:
   → Validar que sea exactamente 19% O 0 (exenta)
3. total = subtotal + taxAmount (siempre calculado)
```

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Factura completa válida con IVA automático
✓ Factura exenta (taxAmount = 0)
✓ Factura con IVA manual correcto (19%)
✓ Factura con IVA manual incorrecto → error
✓ subtotal inválido → error
✓ taxAmount negativo → error
✓ Fechas invalidas → error
✓ dueDate < issueDate → error
✓ issueDate futura → error
✓ RUT inválido → error
✓ Lote con mezcla de filas
✓ Redondeo: calculateTaxAmount(230490) === 43793
```

---

## 6. LÓGICA REGIONAL (CHILE)

### 6.1 Regiones y Comunas

**Ubicación:** `/home/mau/programas/Cobrolox/lib/regiones-chile.ts`

#### Funciones:

| Función                            | Propósito                    | Entrada  | Salida                |
| ---------------------------------- | ---------------------------- | -------- | --------------------- |
| `getRegiones()`                    | Obtiene todas las regiones   | -        | `Region[]`            |
| `getRegionByCodigo(codigo)`        | Obtiene región por código    | `string` | `Region \| undefined` |
| `getComunasByRegion(codigoRegion)` | Obtiene comunas de región    | `string` | `Comuna[]`            |
| `getComunaByCodigo(codigoComuna)`  | Obtiene comuna por código    | `string` | `Comuna \| undefined` |
| `getRegionByComuna(codigoComuna)`  | Obtiene región de una comuna | `string` | `Region \| undefined` |
| `formatRegionForCombobox(region)`  | Formatea para UI             | `Region` | `{value, label}`      |
| `formatComunaForCombobox(comuna)`  | Formatea para UI             | `Comuna` | `{value, label}`      |

#### Data Source: `regiones-chile.json`

#### Complejidad: **Simple**

#### Tests Necesarios:

```javascript
✓ getRegiones(): retorna array no vacío
✓ getRegionByCodigo('RM'): retorna región correcta
✓ getRegionByCodigo('XX'): retorna undefined
✓ getComunasByRegion('RM'): retorna comunas de RM
✓ getComunasByRegion('XX'): retorna []
✓ getComunaByCodigo('13101'): retorna comuna correcta
✓ getRegionByComuna('13101'): retorna RM
✓ Datos JSON consistentes: no comunas duplicadas
✓ formatRegionForCombobox: estructura correcta {value, label}
```

---

## 7. HOOKS PERSONALIZADOS

### 7.1 Hook para Input de RUT

**Ubicación:** `/home/mau/programas/Cobrolox/hooks/use-rut-input.ts`

#### Interfaz:

```typescript
useRutInput(options?: {
  initialValue?: string
  onChange?: (cleanRut: string) => void
  formatOnChange?: boolean
})

Retorna: {
  formattedValue: string
  cleanValue: string
  isValid: boolean
  inputProps: { value, onChange, onBlur }
  setValue: (value: string) => void
  clear: () => void
}
```

#### Lógica:

```
1. State: siempre guarda valor formateado
2. onChange: formatea + notifica valor limpio
3. onBlur: asegura formato final
4. Sanitiza input (solo números, puntos, guión, K)
```

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ Formateo on change: "12345678" → "12.345.678"
✓ No formateo on change (formatOnChange=false)
✓ Formateo en blur
✓ Validación correcta
✓ Sanitización: caracteres inválidos → removidos
✓ isValid: verdadero para RUT válido
✓ isValid: falso para RUT inválido
✓ setValue: actualiza state correctamente
✓ clear: limpia state + llamada onChange
✓ onChange callback: recibe valor limpio
```

---

### 7.2 Hook de Configuración

**Ubicación:** `/home/mau/programas/Cobrolox/hooks/use-configuration.ts`

#### Re-exporta desde:

```typescript
lib / contexts / configuration - context.tsx;
```

#### Hook: `useConfiguration()`

```typescript
Retorna: {
  region?: string
  comuna?: string
  currency?: string
  // ... más configuraciones
}
```

#### Complejidad: **Simple (wrapper)**

---

## 8. ALERTAS Y MONITOREO

### 8.1 Sistema de Alertas de Balance

**Ubicación:** `/home/mau/programas/Cobrolox/lib/alerts/balance-alerts.ts`

#### Funciones:

| Función                                                | Propósito                    | Entrada                       |
| ------------------------------------------------------ | ---------------------------- | ----------------------------- |
| `sendBalanceCalculationFailureAlert(failure)`          | Alerta multi-canal por fallo | `BalanceCalculationFailure`   |
| `sendBalanceCalculationFailureSlack(failure)`          | Alerta a Slack               | `BalanceCalculationFailure`   |
| `sendDailyInconsistencyReport(inconsistencies, stats)` | Reporte diario               | `BalanceInconsistencyAlert[]` |
| `sendDailyInconsistencyReportSlack(...)`               | Reporte a Slack              | arrays                        |

#### Tipos:

```typescript
BalanceCalculationFailure {
  customerId: string
  error: string
  attempts: number
  timestamp: Date
}

BalanceInconsistencyAlert {
  customerId: string
  customerRut: string
  customerName: string
  diff: { total, vigente, vencido }
  timestamp: Date
  severity: "warning" | "critical"
}
```

#### Complejidad: **Media**

#### Tests Necesarios:

```javascript
✓ sendBalanceCalculationFailureSlack: formato correcto
✓ Webhook no configurado: fallback a console
✓ sendDailyInconsistencyReportSlack: formato correcto
✓ Resumen stats: total, fixed, failed
✓ Top inconsistencias: ordenamiento
```

---

## CONSTANTES FINANCIERAS

**Ubicación:** `/home/mau/programas/Cobrolox/lib/constants/financial-constants.ts`

```typescript
FINANCIAL = {
  TOLERANCE: 0.01           // Tolerancia para redondeos
  DEFAULT_TAX_RATE: 19      // IVA Chile
  MIN_TAX_RATE: 0
  MAX_TAX_RATE: 100
  MIN_INSTALLMENTS: 1
  MAX_INSTALLMENTS: 12
  DAYS_PER_INSTALLMENT: 30
  DECIMAL_PRECISION: 0.01
}

CURRENCY_CONFIG = {
  CLP: { locale: 'es-CL', decimals: 0, ... },
  USD: { locale: 'en-US', decimals: 2, ... },
  EUR: { locale: 'es-ES', decimals: 2, ... },
  ARS: { ... },
  MXN: { ... }
}
```

---

## RESUMEN POR COMPLEJIDAD

### SIMPLE (30 funciones)

```
✓ rutHelpers.format, clean, validate
✓ formatCurrency, formatNumber, formatDate
✓ calculateTaxAmount, calculateTotal
✓ getInvoiceStatus, getPaymentStatus
✓ Regiones/comunas Chile
✓ Transformadores de pago
✓ Parser Excel básico
```

### MEDIA (25 funciones)

```
✓ calculateInstallments
✓ calculateFIFO
✓ recalculateCustomerBalancesWithRetry
✓ validateCustomerRow, validateInvoiceRow
✓ useRutInput hook
✓ Alertas y reportes
✓ calculateSubtotalFromTotal
✓ Validaciones Zod (schemas)
```

### COMPLEJA (5 funciones)

```
✓ recalculateCustomerBalances (con BD)
✓ recalculateMultipleCustomers
✓ recalculateAllCustomers
✓ validateInvoiceBatch
✓ validateCustomerBatch
```

---

## ORDEN RECOMENDADO PARA ESCRIBIR TESTS

### FASE 1: Validaciones Básicas (Semana 1)

1. **RUT**: `rutHelpers` + `rutSchema`
2. **Formateo**: `format.ts` + `invoice-utils.ts`
3. **Constantes**: `financial-constants.ts`
4. **Schemas Zod**: `customer-validations.ts`, `invoice-validations.ts`, `payment-validations.ts`

**Cobertura esperada:** 90%+

### FASE 2: Lógica Financiera (Semana 2)

5. **Totales**: `calculateProjectTotal`, `calculateTax`, `calculateSubtotalFromTotal`
6. **Cuotas**: `calculateInstallments`, `validateInstallmentsSum`
7. **FIFO**: `calculateFIFO`, `validateAllocationsSum`, `filterInvoicesWithBalance`
8. **Estados**: `calculateInvoiceStatuses`

**Cobertura esperada:** 95%+

### FASE 3: Transformaciones e Importación (Semana 3)

9. **Transformadores**: `payment-transformers.ts`
10. **Parser Excel**: `excel-parser.ts`
11. **Importadores**: `customer-import.ts`, `invoice-import.ts`
12. **Regiones**: `regiones-chile.ts`

**Cobertura esperada:** 90%+

### FASE 4: Hooks y Alertas (Semana 4)

13. **Hooks**: `use-rut-input.ts`
14. **Alertas**: `balance-alerts.ts`
15. **Retry**: `customer-balance-retry.ts`

**Cobertura esperada:** 85%+

### FASE 5: Integración (Semana 5+)

16. **Customer Balance** (con Prisma mock/BD test)
17. **Flujos completos**: pagos + allocations

---

## NOTAS IMPORTANTES

### Edge Cases Críticos

```javascript
// 1. Redondeos decimales
1000 / 3 = 333.33... → [333.33, 333.33, 333.34]
sum(cuotas) === 1000.00 ✅

// 2. Tolerancia de centavos
total = 1190.001 vs expected = 1190.00 → ✅ (< 0.01)

// 3. Datas en frontera
dueDate = hoy → "vigente" o "vencida"?
dueDate = ahora mismo → "current" o "overdue"?

// 4. Divisiones exactas
amount = 1200, installments = 3 → [400, 400, 400] (exacto)
vs
amount = 1000, installments = 3 → [333.33, 333.33, 333.34] (con absorción)

// 5. CLP sin decimales
CLP siempre redondea a entero: 1190.5 → 1191, 1190.4 → 1190

// 6. Fechas y timezones
Date objects pueden tener timezone implícito en tests
```

### Mockeado en Unit Tests

```javascript
✓ Prisma (usar fixtures de datos)
✓ fetch (para alertas Slack)
✓ Date.now() / new Date() (usar fake timers)
✓ Random (usar seeders)
```

### NO Mockeado en Unit Tests

```javascript
✗ Cálculos matemáticos (reales)
✗ Validaciones Zod (reales)
✗ Parsers (reales)
✗ Formatters (reales)
```

---

## ARCHIVOS CON TESTS EXISTENTES

```
/home/mau/programas/Cobrolox/lib/__tests__/
├── format.test.ts
├── utils.test.ts
└── business-logic/
    ├── customer-balance.test.ts
    ├── installments.test.ts
    ├── payment-fifo.test.ts
    └── totals.test.ts

/home/mau/programas/Cobrolox/lib/transformers/__tests__/
└── payment-transformers.test.ts

/home/mau/programas/Cobrolox/lib/utils/__tests__/
└── invoice-utils.test.ts

/home/mau/programas/Cobrolox/hooks/__tests__/
├── use-debounce.test.tsx
└── use-mobile.test.tsx

/home/mau/programas/Cobrolox/hooks/queries/__tests__/
└── use-payments.test.tsx
```

---

**Documento compilado:** Noviembre 2025  
**Total funciones críticas identificadas:** ~60  
**Cobertura potencial de tests:** 90-95%
