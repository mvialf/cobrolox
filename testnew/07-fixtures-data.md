# 🎲 Fixtures y Datos de Prueba

> Datos de prueba reutilizables para testing en Cobrolox

---

## 📚 Índice

1. [RUTs de Chile](#ruts-de-chile)
2. [Clientes Mock](#clientes-mock)
3. [Facturas Mock](#facturas-mock)
4. [Pagos Mock](#pagos-mock)
5. [Cuotas Mock](#cuotas-mock)
6. [Fechas Específicas](#fechas-específicas)
7. [Montos de Prueba](#montos-de-prueba)
8. [Factory Functions](#factory-functions)

---

## RUTs de Chile

### RUTs Válidos

```typescript
export const VALID_RUTS = {
  // RUTs reales válidos para testing
  standard: "12.345.678-9",
  withK: "11.111.111-K",
  withZero: "14.324.672-0",
  short: "1.234.567-K",

  // Sin formato
  cleanStandard: "123456789",
  cleanWithK: "11111111K",

  // Variantes de formato
  noPoints: "12345678-9",
  noDash: "123456789",
  withSpaces: "12 345 678-9",
};

// Array para tests de batch
export const VALID_RUTS_ARRAY = [
  "12.345.678-9",
  "11.111.111-K",
  "14.324.672-0",
  "7.654.321-6",
  "18.765.432-1",
];
```

### RUTs Inválidos

```typescript
export const INVALID_RUTS = {
  wrongDV: "12.345.678-0", // DV debería ser 9
  letters: "ABC.DEF.GHI-J",
  tooShort: "123-4",
  empty: "",
  null: null,
  undefined: undefined,
  onlyNumbers: "123456789012", // Muy largo
  specialChars: "12@345#678-9",
};
```

---

## Clientes Mock

### Cliente Básico

```typescript
export const MOCK_CUSTOMER_BASIC = {
  id: "customer-1",
  rut: "12.345.678-9",
  name: "Juan Pérez",
  email: "juan.perez@example.com",
  phone: "+56912345678",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};
```

### Cliente Completo (con dirección)

```typescript
export const MOCK_CUSTOMER_FULL = {
  id: 'customer-2',
  rut: '11.111.111-K',
  name: 'María González',
  email: 'maria.gonzalez@example.com',
  phone: '+56987654321',

  // Dirección
  street: 'Av. Libertador Bernardo O'Higgins',
  streetNumber: '1234',
  apartment: 'Depto 501',
  regionId: '13', // Región Metropolitana
  comunaId: '13101', // Santiago
  postalCode: '8320000',

  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2025-01-15'),
};
```

### Array de Clientes

```typescript
export const MOCK_CUSTOMERS = [
  MOCK_CUSTOMER_BASIC,
  MOCK_CUSTOMER_FULL,
  {
    id: "customer-3",
    rut: "18.765.432-1",
    name: "Pedro Silva",
    email: "pedro.silva@example.com",
    phone: "+56945678901",
  },
];
```

---

## Facturas Mock

### Factura Estándar (con IVA)

```typescript
export const MOCK_INVOICE_STANDARD = {
  id: "invoice-1",
  customerId: "customer-1",
  number: "F-001",

  // Fechas
  issueDate: new Date("2025-01-01"),
  dueDate: new Date("2025-01-31"),
  termsDay: 30,

  // Montos
  subtotal: 1000,
  IVA: 190,
  total: 1190,
  paid: 0,
  balance: 1190,

  // Metadata
  currency: "CLP",
  isExemptFromTax: false,
  status: "current",
  paymentStatus: "pending",

  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};
```

### Factura Exenta (sin IVA)

```typescript
export const MOCK_INVOICE_EXEMPT = {
  id: "invoice-2",
  customerId: "customer-1",
  number: "F-002",

  issueDate: new Date("2025-01-15"),
  dueDate: new Date("2025-02-15"),
  termsDay: 30,

  subtotal: 500,
  IVA: 0,
  total: 500,
  paid: 0,
  balance: 500,

  currency: "CLP",
  isExemptFromTax: true,
  status: "current",
  paymentStatus: "pending",
};
```

### Factura Vencida

```typescript
export const MOCK_INVOICE_OVERDUE = {
  id: "invoice-3",
  customerId: "customer-2",
  number: "F-003",

  issueDate: new Date("2024-11-01"),
  dueDate: new Date("2024-12-01"), // Vencida
  termsDay: 30,

  subtotal: 2000,
  IVA: 380,
  total: 2380,
  paid: 1000,
  balance: 1380,

  currency: "CLP",
  isExemptFromTax: false,
  status: "overdue",
  paymentStatus: "partial",
};
```

### Factura Pagada

```typescript
export const MOCK_INVOICE_PAID = {
  id: "invoice-4",
  customerId: "customer-1",
  number: "F-004",

  issueDate: new Date("2024-12-01"),
  dueDate: new Date("2025-01-01"),
  termsDay: 30,

  subtotal: 1500,
  IVA: 285,
  total: 1785,
  paid: 1785,
  balance: 0,

  currency: "CLP",
  isExemptFromTax: false,
  status: "completed",
  paymentStatus: "paid",
};
```

### Array de Facturas (varios estados)

```typescript
export const MOCK_INVOICES = [
  MOCK_INVOICE_STANDARD, // Pendiente
  MOCK_INVOICE_EXEMPT, // Exenta
  MOCK_INVOICE_OVERDUE, // Vencida parcial
  MOCK_INVOICE_PAID, // Pagada completa
];
```

---

## Pagos Mock

### Pago a Factura Única

```typescript
export const MOCK_PAYMENT_SINGLE = {
  id: "payment-1",
  customerId: "customer-1",

  amount: 1190,
  paymentDate: new Date("2025-01-15"),

  // Método
  paymentMethodId: "method-1",
  paymentMethod: {
    id: "method-1",
    name: "Transferencia",
    type: "bank_transfer",
  },

  // Allocations
  allocations: [
    {
      id: "alloc-1",
      invoiceId: "invoice-1",
      amount: 1190,
    },
  ],

  reference: "TRANS-12345",
  notes: "Pago completo de factura F-001",

  createdAt: new Date("2025-01-15"),
};
```

### Pago FIFO a Múltiples Facturas

```typescript
export const MOCK_PAYMENT_FIFO = {
  id: "payment-2",
  customerId: "customer-2",

  amount: 3000,
  paymentDate: new Date("2025-01-20"),

  paymentMethodId: "method-2",
  paymentMethod: {
    id: "method-2",
    name: "Efectivo",
    type: "cash",
  },

  // FIFO: paga facturas más antiguas primero
  allocations: [
    {
      id: "alloc-2",
      invoiceId: "invoice-5",
      amount: 1000, // Factura 1 completa
    },
    {
      id: "alloc-3",
      invoiceId: "invoice-6",
      amount: 1500, // Factura 2 completa
    },
    {
      id: "alloc-4",
      invoiceId: "invoice-7",
      amount: 500, // Factura 3 parcial
    },
  ],

  reference: "CASH-20250120",
};
```

---

## Cuotas Mock

### Cuotas de un Pago

```typescript
export const MOCK_INSTALLMENTS = [
  {
    id: "inst-1",
    paymentId: "payment-3",
    installmentNumber: 1,
    amount: 333.33,
    dueDate: new Date("2025-02-01"),
    status: "pending",
  },
  {
    id: "inst-2",
    paymentId: "payment-3",
    installmentNumber: 2,
    amount: 333.33,
    dueDate: new Date("2025-03-01"),
    status: "pending",
  },
  {
    id: "inst-3",
    paymentId: "payment-3",
    installmentNumber: 3,
    amount: 333.34, // Última absorbe centavos
    dueDate: new Date("2025-04-01"),
    status: "pending",
  },
];
```

---

## Fechas Específicas

### Fechas para Testing

```typescript
export const TEST_DATES = {
  // Fechas pasadas
  past: {
    year: new Date("2024-01-01"),
    month: new Date("2024-12-01"),
    week: new Date("2025-01-04"),
    yesterday: new Date("2025-01-14"),
  },

  // Fecha actual (mockeable)
  now: new Date("2025-01-15"),

  // Fechas futuras
  future: {
    tomorrow: new Date("2025-01-16"),
    week: new Date("2025-01-22"),
    month: new Date("2025-02-15"),
    year: new Date("2026-01-15"),
  },

  // Fechas especiales (edge cases)
  special: {
    leapYear: new Date("2024-02-29"), // Año bisiesto
    endOfMonth: new Date("2025-01-31"),
    startOfYear: new Date("2025-01-01"),
    endOfYear: new Date("2025-12-31"),
  },

  // DST en Chile (cambio de horario)
  dst: {
    beforeChange: new Date("2025-09-06"), // Antes de DST
    afterChange: new Date("2025-09-07"), // Después de DST
  },
};
```

---

## Montos de Prueba

### Montos para Testing de Redondeo

```typescript
export const TEST_AMOUNTS = {
  // Montos simples
  simple: {
    hundred: 100,
    thousand: 1000,
    tenThousand: 10000,
  },

  // Montos con decimales
  decimal: {
    twoDecimals: 1234.56,
    oneDecimal: 999.9,
    manyDecimals: 100.123456789,
  },

  // Montos que requieren redondeo
  rounding: {
    oneThird: 1000 / 3, // 333.333...
    oneSeventh: 100 / 7, // 14.285714...
    roundUp: 1234.567, // Redondea a 1234.57
    roundDown: 1234.564, // Redondea a 1234.56
  },

  // Edge cases
  edge: {
    zero: 0,
    oneCent: 0.01,
    negative: -100,
    veryLarge: 999999999.99,
    verySmall: 0.001,
  },

  // IVA Chile (19%)
  iva: {
    subtotal1000: 1000,
    ivaExpected: 190,
    totalExpected: 1190,
  },
};
```

---

## Factory Functions

### Customer Factory

```typescript
export function createMockCustomer(overrides = {}) {
  return {
    id: `customer-${Math.random().toString(36).substr(2, 9)}`,
    rut: VALID_RUTS.standard,
    name: "Test Customer",
    email: "test@example.com",
    phone: "+56912345678",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Uso:
const customer1 = createMockCustomer({ name: "Juan Pérez" });
const customer2 = createMockCustomer({ rut: VALID_RUTS.withK });
```

### Invoice Factory

```typescript
export function createMockInvoice(overrides = {}) {
  const subtotal = overrides.subtotal || 1000;
  const isExempt = overrides.isExemptFromTax || false;
  const IVA = isExempt ? 0 : Math.round(subtotal * 0.19 * 100) / 100;
  const total = subtotal + IVA;

  return {
    id: `invoice-${Math.random().toString(36).substr(2, 9)}`,
    customerId: "customer-1",
    number: `F-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,

    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
    termsDay: 30,

    subtotal,
    IVA,
    total,
    paid: 0,
    balance: total,

    currency: "CLP",
    isExemptFromTax: isExempt,
    status: "current",
    paymentStatus: "pending",

    createdAt: new Date(),
    updatedAt: new Date(),

    ...overrides,
  };
}

// Uso:
const invoice1 = createMockInvoice({ subtotal: 2000 });
const invoice2 = createMockInvoice({ isExemptFromTax: true });
```

### Payment Factory

```typescript
export function createMockPayment(overrides = {}) {
  return {
    id: `payment-${Math.random().toString(36).substr(2, 9)}`,
    customerId: "customer-1",

    amount: 1000,
    paymentDate: new Date(),

    paymentMethodId: "method-1",
    allocations: [],

    reference: `REF-${Date.now()}`,
    notes: "",

    createdAt: new Date(),

    ...overrides,
  };
}
```

### Batch Factory

```typescript
export function createMockCustomers(count: number, baseOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockCustomer({
      name: `Customer ${i + 1}`,
      rut: VALID_RUTS_ARRAY[i % VALID_RUTS_ARRAY.length],
      ...baseOverrides,
    }),
  );
}

export function createMockInvoices(count: number, baseOverrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockInvoice({
      number: `F-${String(i + 1).padStart(3, "0")}`,
      ...baseOverrides,
    }),
  );
}

// Uso:
const customers = createMockCustomers(10);
const invoices = createMockInvoices(50, { currency: "CLP" });
```

---

## 🎯 Uso en Tests

### Ejemplo Completo

```typescript
import { describe, it, expect } from "vitest";
import { VALID_RUTS, createMockInvoice, TEST_AMOUNTS } from "./fixtures";

describe("Invoice Processing", () => {
  it("debe calcular IVA correctamente", () => {
    const invoice = createMockInvoice({
      subtotal: TEST_AMOUNTS.iva.subtotal1000,
    });

    expect(invoice.IVA).toBe(TEST_AMOUNTS.iva.ivaExpected);
    expect(invoice.total).toBe(TEST_AMOUNTS.iva.totalExpected);
  });

  it("debe manejar facturas exentas", () => {
    const invoice = createMockInvoice({
      subtotal: 1000,
      isExemptFromTax: true,
    });

    expect(invoice.IVA).toBe(0);
    expect(invoice.total).toBe(1000);
  });

  it("debe validar RUT de cliente", () => {
    const validRut = VALID_RUTS.standard;
    const result = validateCustomerRut(validRut);

    expect(result.valid).toBe(true);
  });
});
```

---

## 📝 Mejores Prácticas

1. **Usar factories:** Prefiere factories sobre datos hardcodeados
2. **Datos realistas:** Usa RUTs válidos de Chile, fechas coherentes
3. **Overrides claros:** Factory patterns permiten personalización fácil
4. **Arrays de fixtures:** Para tests de batch/múltiples items
5. **Edge cases explícitos:** Documenta casos límite con constantes nombradas

---

**Última actualización:** 2025-11-11
