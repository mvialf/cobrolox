# MATRIZ DE TESTS UNITARIOS - Cobrolox

**Referencia rápida de qué probar en cada módulo de lógica de negocio**

---

## 1. TABLA RESUMEN FUNCIONES x TESTS

### 1.1 RUT (rut-validations.ts)

| Función                      | Input            | Output           | Test Cases                                            |
| ---------------------------- | ---------------- | ---------------- | ----------------------------------------------------- |
| `rutHelpers.validate()`      | `"12.345.678-9"` | `boolean`        | Valid RUT, Invalid check digit, Empty, Invalid format |
| `rutHelpers.format()`        | `"123456789"`    | `"12.345.678-9"` | Valid clean, Already formatted, Empty, Mixed format   |
| `rutHelpers.clean()`         | `"12.345.678-9"` | `"123456789"`    | Formatted, Clean, Empty, Special chars                |
| `rutHelpers.getCheckDigit()` | `"12345678"`     | `"9"`            | Valid RUT, Empty, K digit                             |

---

### 1.2 Formateo (format.ts + invoice-utils.ts)

| Función                     | Input                   | Output                           | Test Cases                                         |
| --------------------------- | ----------------------- | -------------------------------- | -------------------------------------------------- |
| `formatCurrency()`          | `1000, 'CLP'`           | `"$1.000"`                       | CLP, USD, EUR, Unknown currency                    |
| `formatNumber()`            | `1234.567, 2`           | `"1,234.57"`                     | 0 decimals, 2 decimals, Rounding                   |
| `formatDate()`              | `'2025-01-15', 'short'` | `"15/01/2025"`                   | short, long, full variants, Different locales      |
| `calculateTaxAmount()`      | `1000`                  | `190`                            | Normal, Rounding, Edge cases                       |
| `calculateDueDate()`        | `2025-01-01, 30`        | `Date`                           | Month boundary, Year boundary, Same month          |
| `getInvoiceDueDateStatus()` | `Date`                  | `"current"/"due-soon"/"overdue"` | Future date (>7 días), Future (≤7 días), Past date |

---

### 1.3 Cálculos Financieros (totals.ts)

| Función                        | Input                  | Output    | Test Cases                                          |
| ------------------------------ | ---------------------- | --------- | --------------------------------------------------- |
| `calculateProjectTotal()`      | `1000000, 19`          | `1190000` | Normal, 0% tax, Different tax rates, Negative error |
| `calculateTax()`               | `1000000, 19`          | `190000`  | Normal, Rounding, Edge cases                        |
| `validateProjectTotal()`       | `1000000, 19, 1190000` | `boolean` | Correct total, Within tolerance, Out of tolerance   |
| `calculateSubtotalFromTotal()` | `1190000, 19`          | `1000000` | Normal, Inverse operation, Rounding                 |

---

### 1.4 Cuotas (installments.ts)

| Función                     | Input                 | Output                    | Test Cases                                                                       |
| --------------------------- | --------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| `calculateInstallments()`   | `1000, 3, Date`       | `CalculatedInstallment[]` | Exact division, With remainders, 1 installment, 12 installments, Invalid (0, 13) |
| `validateInstallmentsSum()` | `[{amount}...], 1000` | `boolean`                 | Correct sum, Within tolerance, Out of tolerance                                  |

**Critical Case:**

```
amount=1000, installments=3
→ [333.33, 333.33, 333.34]
  SUM: 1000.00 ✅
```

---

### 1.5 FIFO (payment-fifo.ts)

| Función                    | Input                   | Output             | Test Cases                                                             |
| -------------------------- | ----------------------- | ------------------ | ---------------------------------------------------------------------- |
| `calculateFIFO()`          | `500000, Invoices[]`    | `FIFOAllocation[]` | Full payment, Partial payment, Overpayment, No eligible, Order by date |
| `validateAllocationsSum()` | `500000, Allocations[]` | `boolean`          | Correct sum, Within tolerance, Out of tolerance                        |

**Critical Case:**

```
3 invoices: balance=[300, 400, 200], issueDate=[jan, feb, mar]
Payment: 500
→ FIFO order: [300 paid, 200 partial, 0 none]
```

---

### 1.6 Estados (invoice-status.ts)

| Función                      | Input                            | Output                           | Test Cases                                                               |
| ---------------------------- | -------------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `calculateInvoiceStatuses()` | `{balance, paidAmount, dueDate}` | `{invoiceStatus, paymentStatus}` | All 6 combinations                                                       |
| `hasStatusChanged()`         | `current, calculated`            | `boolean`                        | Same, Different invoice status, Different payment status, Both different |

**Matrix (3×2):**

```
         | balance=0 | balance>0, paidAmount=0 | balance>0, paidAmount>0
---------|-----------|-------------------------|------------------------
dueDate<now | "completed"+"paid" | "overdue"+"pending" | "overdue"+"partial"
dueDate>=now | "completed"+"paid" | "current"+"pending" | "current"+"partial"
```

---

### 1.7 Validaciones Zod (all validations/\*.ts)

| Schema                    | Required Fields                                                           | Validations                                                      | Test Cases                                                                   |
| ------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `customerSchema`          | rut, razonSocial, contact, phone, street, region, comuna                  | RUT valid, Email format, Region/Comuna exist                     | Valid complete, Missing required, Invalid RUT, Invalid email, Invalid region |
| `invoiceSchema`           | invoiceNumber, issueDate, dueDate, subtotal, taxAmount, total, customerId | total = subtotal+taxAmount, dueDate>=issueDate, issueDate<=today | Valid, Inconsistent total, Future issueDate, dueDate<issueDate               |
| `paymentToInvoiceSchema`  | invoiceId, amount, date, paymentMethodId                                  | amount > 0                                                       | Valid, Missing fields, Invalid UUIDs                                         |
| `paymentToCustomerSchema` | customerId, amount, date, paymentMethodId, allocations                    | sum(allocations)==amount, no duplicates, min 1 allocation        | Valid, Sum mismatch, Duplicate invoice, All zero allocations                 |

---

## 2. MATRIZ CASOS EXTREMOS

### Redondeos y Decimales

| Caso              | Input                    | Expected        | Tolerancia |
| ----------------- | ------------------------ | --------------- | ---------- |
| CLP sin decimales | 1190.5                   | 1191 (redondea) | 0          |
| USD con decimales | 1190.55                  | 1190.55         | 0.01       |
| Suma con centavos | [333.33, 333.33, 333.34] | 1000.00         | 0          |
| Tolerancia        | 1000.001 vs 1000.00      | ✅ válido       | 0.01       |

### Fechas

| Caso              | Input     | Expected                |
| ----------------- | --------- | ----------------------- |
| Hoy es dueDate    | today     | "overdue" OR "current"? |
| Mañana es dueDate | tomorrow  | "current"               |
| Ayer era dueDate  | yesterday | "overdue"               |
| Hace 7 días       | -7 días   | "due-soon"              |
| Hace 8 días       | -8 días   | "overdue"               |

### Edge Cases

| Caso                  | Input             | Expected                    |
| --------------------- | ----------------- | --------------------------- |
| RUT con K             | "12345678-K"      | ✅ válido                   |
| RUT sin formato       | "123456789"       | ✅ válido (se formatea)     |
| Email vacío           | ""                | ✅ válido (opcional)        |
| Teléfono con espacios | "+56 9 1234 5678" | ✅ válido (se trimea)       |
| Total con 3 decimales | 1190.001          | ✅ válido (<0.01 tolerance) |
| 0 cuotas              | 0                 | ❌ error                    |
| 13 cuotas             | 13                | ❌ error (max 12)           |
| Monto negativo        | -100              | ❌ error                    |

---

## 3. CHECKLIST DE TESTS POR ARCHIVO

### ✅ lib/rut-validations.ts

- [ ] `validate()` - RUT válido
- [ ] `validate()` - RUT inválido (check digit)
- [ ] `validate()` - RUT vacío
- [ ] `format()` - Formatea correctamente
- [ ] `format()` - Ya formateado
- [ ] `clean()` - Limpia puntos y guión
- [ ] `clean()` - Vacío
- [ ] `getCheckDigit()` - Calcula dígito correcto
- [ ] `rutSchema` - RUT válido y obligatorio
- [ ] `rutSchemaOptional` - RUT válido pero opcional

---

### ✅ lib/format.ts

- [ ] `formatCurrency()` - CLP (0 decimales)
- [ ] `formatCurrency()` - USD (2 decimales)
- [ ] `formatCurrency()` - EUR
- [ ] `formatCurrency()` - Moneda desconocida (fallback CLP)
- [ ] `formatNumber()` - 2 decimales
- [ ] `formatNumber()` - 0 decimales
- [ ] `formatDate()` - "short" format
- [ ] `formatDate()` - "long" format
- [ ] `formatDate()` - "full" format
- [ ] `formatDate()` - Different locale (en-US)

---

### ✅ lib/utils/invoice-utils.ts

- [ ] `calculateTaxAmount()` - Normal (1000 → 190)
- [ ] `calculateTaxAmount()` - Rounding (230490 → 43793)
- [ ] `calculateTotal()` - Suma correcta
- [ ] `calculateDueDate()` - Suma 30 días
- [ ] `calculateDueDate()` - Month boundary (31→28)
- [ ] `getInvoiceDueDateStatus()` - "current"
- [ ] `getInvoiceDueDateStatus()` - "due-soon"
- [ ] `getInvoiceDueDateStatus()` - "overdue"
- [ ] `formatCurrency()` - CLP format

---

### ✅ lib/business-logic/totals.ts

- [ ] `calculateProjectTotal()` - Normal (1000000, 19 → 1190000)
- [ ] `calculateProjectTotal()` - Sin IVA (0%)
- [ ] `calculateProjectTotal()` - Tasa personalizada (21%)
- [ ] `calculateProjectTotal()` - Subtotal negativo → error
- [ ] `calculateProjectTotal()` - Tasa < 0 → error
- [ ] `calculateProjectTotal()` - Tasa > 100 → error
- [ ] `calculateTax()` - Normal
- [ ] `calculateTax()` - Redondeo
- [ ] `validateProjectTotal()` - Exacto
- [ ] `validateProjectTotal()` - Dentro tolerancia (±0.01)
- [ ] `validateProjectTotal()` - Fuera tolerancia
- [ ] `calculateSubtotalFromTotal()` - Operación inversa

---

### ✅ lib/business-logic/installments.ts

- [ ] `calculateInstallments()` - División exacta (1200/3)
- [ ] `calculateInstallments()` - Con centavos (1000/3)
- [ ] `calculateInstallments()` - 1 cuota
- [ ] `calculateInstallments()` - 12 cuotas
- [ ] `calculateInstallments()` - 0 cuotas → error
- [ ] `calculateInstallments()` - 13 cuotas → error
- [ ] `calculateInstallments()` - Monto <= 0 → error
- [ ] `calculateInstallments()` - Fechas de vencimiento (30 días entre cada)
- [ ] `validateInstallmentsSum()` - Suma exacta
- [ ] `validateInstallmentsSum()` - Dentro tolerancia
- [ ] `validateInstallmentsSum()` - Fuera tolerancia
- [ ] `getTotalPendingInstallments()` - Suma correcta

---

### ✅ lib/business-logic/payment-fifo.ts

- [ ] `calculateFIFO()` - Pago completo
- [ ] `calculateFIFO()` - Pago parcial
- [ ] `calculateFIFO()` - Sobrepago
- [ ] `calculateFIFO()` - Sin facturas elegibles
- [ ] `calculateFIFO()` - Orden por fecha (FIFO correcto)
- [ ] `calculateFIFO()` - isFullyPaid flag correcto
- [ ] `validateAllocationsSum()` - Exacto
- [ ] `validateAllocationsSum()` - Dentro tolerancia
- [ ] `validateAllocationsSum()` - Fuera tolerancia
- [ ] `filterInvoicesWithBalance()` - Filtra balance > 0

---

### ✅ lib/business-logic/invoice-status.ts

- [ ] `calculateInvoiceStatuses()` - All 6 matrix combinations
- [ ] `getInvoiceStatus()` - Solo invoice status
- [ ] `getPaymentStatus()` - Solo payment status
- [ ] `hasStatusChanged()` - Sin cambios
- [ ] `hasStatusChanged()` - Cambio invoice status
- [ ] `hasStatusChanged()` - Cambio payment status
- [ ] `hasStatusChanged()` - Ambos cambios

---

### ✅ lib/validations/customer-validations.ts

- [ ] `customerSchema` - Cliente válido completo
- [ ] `customerSchema` - RUT requerido
- [ ] `customerSchema` - RUT inválido
- [ ] `customerSchema` - razonSocial < 2 caracteres
- [ ] `customerSchema` - Email inválido (si se proporciona)
- [ ] `customerSchema` - Región inexistente
- [ ] `customerSchema` - Comuna inexistente
- [ ] `customerSchema` - Campos opcionales omitidos

---

### ✅ lib/validations/invoice-validations.ts

- [ ] `invoiceSchema` - Factura válida completa
- [ ] `invoiceSchema` - issueDate futura → error
- [ ] `invoiceSchema` - dueDate < issueDate → error
- [ ] `invoiceSchema` - total != subtotal+taxAmount → error
- [ ] `invoiceSchema` - Tolerancia ±0.01 en total
- [ ] `invoiceSchema` - subtotal <= 0 → error
- [ ] `invoiceSchema` - customerId no UUID → error
- [ ] `updateInvoiceSchema` - Todos los campos opcionales

---

### ✅ lib/validations/payment-validations.ts

- [ ] `paymentAllocationSchema` - Allocation válida
- [ ] `paymentAllocationSchema` - Monto <= 0 → error
- [ ] `paymentAllocationSchema` - 3 decimales → error
- [ ] `paymentToInvoiceSchema` - Pago 1:1 válido
- [ ] `paymentToInvoiceSchema` - invoiceId UUID inválido
- [ ] `paymentToCustomerSchema` - Pago 1:N válido
- [ ] `paymentToCustomerSchema` - sum(allocations) != amount → error
- [ ] `paymentToCustomerSchema` - Allocation duplicada → error
- [ ] `paymentToCustomerSchema` - Todas las allocations = 0 → error
- [ ] `parseInvoicesWithBalance()` - Convierte dates correctamente
- [ ] `paymentToInvoiceToPayload()` - Conversión correcta
- [ ] `paymentToCustomerToPayload()` - Conversión correcta

---

### ✅ lib/transformers/payment-transformers.ts

- [ ] `extractProjectAllocations()` - Extrae allocations correctas
- [ ] `extractProjectAllocations()` - Proyecto no encontrado → []
- [ ] `sortAllocationsByDate()` - Orden 'asc'
- [ ] `sortAllocationsByDate()` - Orden 'desc'
- [ ] `sortAllocationsByDate()` - No mutación del array
- [ ] `processProjectPayments()` - Pipeline completo

---

### ✅ lib/import/excel-parser.ts

- [ ] `parseExcel()` - Archivo válido
- [ ] `parseExcel()` - Sheet index inválido
- [ ] `isNotEmpty()` - null, undefined, ""
- [ ] `isNotEmpty()` - 0, 1, "text"
- [ ] `parseDecimal()` - "1000" → 1000
- [ ] `parseDecimal()` - "1.000,50" (chileno) → 1000.50
- [ ] `parseDecimal()` - "1,000.50" (americano) → 1000.50
- [ ] `parseDecimal()` - Inválido → null
- [ ] `parseDate()` - "DD/MM/YYYY" (chileno)
- [ ] `parseDate()` - "MM/DD/YY" (Excel americano)
- [ ] `parseDate()` - ISO date
- [ ] `parseDate()` - Excel Date object
- [ ] `parseDate()` - Inválido → null

---

### ✅ lib/import/customer-import.ts

- [ ] `validateCustomerRow()` - Fila válida completa
- [ ] `validateCustomerRow()` - Campos requeridos faltantes
- [ ] `validateCustomerRow()` - RUT inválido
- [ ] `validateCustomerRow()` - Email inválido (si se proporciona)
- [ ] `validateCustomerRow()` - Región inexistente
- [ ] `validateCustomerRow()` - Comuna inexistente
- [ ] `validateCustomerBatch()` - Mezcla de filas válidas e inválidas
- [ ] `validateCustomerBatch()` - Resumen correcto (total, valid, invalid)

---

### ✅ lib/import/invoice-import.ts

- [ ] `validateInvoiceRow()` - Factura válida con IVA automático
- [ ] `validateInvoiceRow()` - Factura exenta (taxAmount=0)
- [ ] `validateInvoiceRow()` - IVA manual correcto (19%)
- [ ] `validateInvoiceRow()` - IVA manual incorrecto → error
- [ ] `validateInvoiceRow()` - subtotal inválido → error
- [ ] `validateInvoiceRow()` - taxAmount negativo → error
- [ ] `validateInvoiceRow()` - Fechas inválidas
- [ ] `validateInvoiceRow()` - dueDate < issueDate → error
- [ ] `validateInvoiceRow()` - issueDate futura → error
- [ ] `validateInvoiceRow()` - RUT inválido
- [ ] `validateInvoiceBatch()` - Mezcla de filas
- [ ] `validateInvoiceBatch()` - Redondeo: calculateTaxAmount(230490)

---

### ✅ lib/regiones-chile.ts

- [ ] `getRegiones()` - Retorna array no vacío
- [ ] `getRegionByCodigo()` - Región existente
- [ ] `getRegionByCodigo()` - Región inexistente → undefined
- [ ] `getComunasByRegion()` - Comunas correctas
- [ ] `getComunasByRegion()` - Región inexistente → []
- [ ] `getComunaByCodigo()` - Comuna existente
- [ ] `getComunaByCodigo()` - Comuna inexistente → undefined
- [ ] `getRegionByComuna()` - Región correcta
- [ ] `formatRegionForCombobox()` - Estructura {value, label}
- [ ] `formatComunaForCombobox()` - Estructura {value, label}
- [ ] Datos JSON consistentes (no duplicados)

---

### ✅ hooks/use-rut-input.ts

- [ ] Formateo on change: "12345678" → "12.345.678"
- [ ] No formateo on change (formatOnChange=false)
- [ ] Formateo en blur
- [ ] Validación correcta (isValid)
- [ ] Sanitización: caracteres inválidos removidos
- [ ] onChange callback: recibe valor limpio
- [ ] setValue: actualiza state
- [ ] clear: limpia state + callback
- [ ] initialValue: se formatea en inicio

---

### ✅ lib/constants/financial-constants.ts

- [ ] FINANCIAL.TOLERANCE = 0.01
- [ ] FINANCIAL.DEFAULT_TAX_RATE = 19
- [ ] FINANCIAL.MIN/MAX_INSTALLMENTS = 1/12
- [ ] CURRENCY_CONFIG: todos los pares clave-valor
- [ ] getCurrencyConfig(): fallback a CLP

---

### ✅ lib/alerts/balance-alerts.ts

- [ ] `sendBalanceCalculationFailureAlert()` - Webhook configurado
- [ ] `sendBalanceCalculationFailureAlert()` - Sin webhook → fallback console
- [ ] `sendBalanceCalculationFailureSlack()` - Formato correcto
- [ ] `sendDailyInconsistencyReport()` - Log en console
- [ ] `sendDailyInconsistencyReportSlack()` - Formato correcto
- [ ] Resumen stats: total, fixed, failed

---

### ✅ lib/business-logic/customer-balance-retry.ts

- [ ] `recalculateCustomerBalancesWithRetry()` - Éxito en 1er intento
- [ ] `recalculateCustomerBalancesWithRetry()` - Éxito en 2do intento
- [ ] `recalculateCustomerBalancesWithRetry()` - Fallo definitivo (3 intentos)
- [ ] Backoff exponencial: delay = baseDelay × attempt
- [ ] Logger: logs correctos (debug, warn, error)
- [ ] Alerta enviada cuando falla definitivamente

---

## 4. SUITE DE FIXTURES

```typescript
// fixtures/payment.ts
export const VALID_RUT = "12.345.678-9";
export const INVALID_RUT = "12.345.678-0";
export const CLEAN_RUT = "123456789";

// fixtures/invoice.ts
export const VALID_SUBTOTAL = 1000000;
export const VALID_TOTAL = 1190000;
export const VALID_TAX = 190000;

// fixtures/installments.ts
export const PAYMENT_AMOUNT = 1000;
export const INSTALLMENTS_3 = 3;
export const EXPECTED_AMOUNTS = [333.33, 333.33, 333.34];
export const EXPECTED_SUM = 1000.0;

// fixtures/date.ts
export const TODAY = new Date();
export const TOMORROW = addDays(TODAY, 1);
export const YESTERDAY = subDays(TODAY, 1);
export const NEXT_WEEK = addDays(TODAY, 7);
export const NEXT_MONTH = addDays(TODAY, 30);

// fixtures/customer.ts
export const VALID_CUSTOMER = {
  rut: VALID_RUT,
  razonSocial: "Empresa Test SpA",
  contact: "Juan Pérez",
  phone: "+56912345678",
  street: "Calle Test 123",
  region: "Región Metropolitana",
  comuna: "Santiago",
};

// fixtures/invoice.ts
export const VALID_INVOICE = {
  invoiceNumber: "F-001",
  issueDate: YESTERDAY,
  dueDate: NEXT_MONTH,
  subtotal: VALID_SUBTOTAL,
  taxAmount: VALID_TAX,
  total: VALID_TOTAL,
  customerId: "uuid-123",
};
```

---

## 5. PATRONES DE TESTING

### Patrón 1: Entrada → Salida

```typescript
it("calculates total correctly", () => {
  const result = calculateProjectTotal(1000000, 19);
  expect(result).toBe(1190000);
});
```

### Patrón 2: Validación de Límites

```typescript
it("rejects negative tax rate", () => {
  expect(() => calculateProjectTotal(1000, -1)).toThrow();
  expect(() => calculateProjectTotal(1000, 101)).toThrow();
});
```

### Patrón 3: Tolerancia de Redondeo

```typescript
it("validates total within tolerance", () => {
  expect(validateProjectTotal(1000000, 19, 1190000.005)).toBe(true);
  expect(validateProjectTotal(1000000, 19, 1190000.02)).toBe(false);
});
```

### Patrón 4: Matriz Completa

```typescript
describe("calculateInvoiceStatuses", () => {
  const cases = [
    // [balance, paidAmount, dueDate, expectedInvoiceStatus, expectedPaymentStatus]
    [0, 0, TOMORROW, "completed", "paid"],
    [100, 0, TOMORROW, "current", "pending-payment"],
    [100, 50, TOMORROW, "current", "partial-payment"],
    [100, 0, YESTERDAY, "overdue", "pending-payment"],
    [100, 50, YESTERDAY, "overdue", "partial-payment"],
  ];

  it.each(cases)(
    "status for balance=%p, paid=%p, date=%p",
    (balance, paid, date, expectedInvoice, expectedPayment) => {
      const result = calculateInvoiceStatuses(
        { balance, paidAmount: paid, dueDate: date },
        statuses,
      );
      expect(result.invoiceStatus).toBe(expectedInvoice);
      expect(result.paymentInvoiceStatus).toBe(expectedPayment);
    },
  );
});
```

### Patrón 5: Propiedades (Property-Based Testing)

```typescript
it("sum of installments always equals total", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 100, max: 1000000 }),
      fc.integer({ min: 1, max: 12 }),
      (amount, installments) => {
        const result = calculateInstallments(amount, installments, new Date());
        const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
        return Math.abs(sum - amount) < 0.01;
      },
    ),
  );
});
```

---

## 6. EJECUCIÓN DE TESTS

```bash
# Tests unitarios específicos
npm test -- rut-validations.test.ts
npm test -- totals.test.ts
npm test -- installments.test.ts

# Tests con coverage
npm test -- --coverage

# Tests en watch mode
npm test -- --watch

# Tests de un archivo específico
npm test -- lib/business-logic/__tests__/totals.test.ts
```

---

**Matriz compilada:** Noviembre 2025  
**Total test cases identificados:** 180+  
**Cobertura estimada:** 90-95%
