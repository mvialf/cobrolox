# 🔴 Tests de Prioridad CRÍTICA

> **6 archivos - 145 test cases - 62 horas**
>
> Estos tests previenen bugs financieros y errores de datos. **Máxima prioridad.**

---

## Índice

1. [lib/rut-validations.ts](#1-librut-validationsts) - 30 tests, 10 hrs
2. [lib/validations/invoice-validations.ts](#2-libvalidationsinvoice-validationsts) - 25 tests, 6.25 hrs
3. [lib/business-logic/installments.ts](#3-libbusiness-logicinstallmentsts) - 20 tests, 6.7 hrs
4. [lib/import/invoice-import.ts](#4-libimportinvoice-importts) - 25 tests, 10.4 hrs
5. [components/forms/payment-to-customer-form.tsx](#5-componentsformspayment-to-customer-formtsx) - 25 tests, 18.75 hrs
6. [hooks/use-rut-input.ts](#6-hooksuse-rut-inputts) - 20 tests, 10 hrs

---

## 1. lib/rut-validations.ts

**📍 Ubicación:** `lib/rut-validations.ts`
**⏱️ Estimación:** 30 test cases - 10 horas
**📦 Dependencias:** Ninguna
**📊 Estado actual:** ❌ SIN TESTS

### Por qué es crítico

- ✋ Validación ÚNICA de Chile (RUT - Rol Único Tributario)
- 💥 Error = datos inválidos en base de datos
- 🔄 Usado en TODOS los formularios de clientes
- 🧮 Algoritmo complejo (módulo 11 con serie específica)
- 🚨 Bug aquí afecta TODO el sistema

### Funciones a testear

#### `validateRUT(rut: string): boolean`

Valida si un RUT es válido usando algoritmo módulo 11.

**Test cases (10):**

```typescript
describe("validateRUT", () => {
  describe("casos válidos", () => {
    it("debe validar RUT con formato completo", () => {
      expect(validateRUT("12.345.678-9")).toBe(true);
    });

    it("debe validar RUT sin puntos", () => {
      expect(validateRUT("12345678-9")).toBe(true);
    });

    it("debe validar RUT sin guion", () => {
      expect(validateRUT("123456789")).toBe(true);
    });

    it("debe validar RUT con dígito verificador K", () => {
      expect(validateRUT("11.111.111-K")).toBe(true);
      expect(validateRUT("11111111K")).toBe(true);
    });

    it("debe validar RUT con dígito verificador 0", () => {
      expect(validateRUT("14.324.672-0")).toBe(true);
    });
  });

  describe("casos inválidos", () => {
    it("debe rechazar dígito verificador incorrecto", () => {
      expect(validateRUT("12.345.678-0")).toBe(false);
    });

    it("debe rechazar string vacío", () => {
      expect(validateRUT("")).toBe(false);
    });

    it("debe rechazar null/undefined", () => {
      expect(validateRUT(null as any)).toBe(false);
      expect(validateRUT(undefined as any)).toBe(false);
    });

    it("debe rechazar letras en el cuerpo", () => {
      expect(validateRUT("ABC12345-9")).toBe(false);
    });

    it("debe rechazar RUT muy corto", () => {
      expect(validateRUT("123-4")).toBe(false);
    });
  });
});
```

#### `cleanRUT(rut: string): string`

Elimina puntos, guiones y espacios. Convierte 'k' minúscula a 'K'.

**Test cases (8):**

```typescript
describe("cleanRUT", () => {
  it("debe eliminar puntos y guiones", () => {
    expect(cleanRUT("12.345.678-9")).toBe("123456789");
  });

  it("debe eliminar espacios", () => {
    expect(cleanRUT("12 345 678-9")).toBe("123456789");
  });

  it("debe convertir k minúscula a K mayúscula", () => {
    expect(cleanRUT("11.111.111-k")).toBe("11111111K");
  });

  it("debe manejar RUT ya limpio", () => {
    expect(cleanRUT("123456789")).toBe("123456789");
  });

  it("debe manejar string vacío", () => {
    expect(cleanRUT("")).toBe("");
  });

  it("debe manejar null como string vacío", () => {
    expect(cleanRUT(null as any)).toBe("");
  });

  it("debe preservar solo números y K", () => {
    expect(cleanRUT("12.ABC.345-9")).toBe("123459");
  });

  it("debe manejar múltiples espacios y caracteres", () => {
    expect(cleanRUT("  12 . 345 . 678 - 9  ")).toBe("123456789");
  });
});
```

#### `formatRUT(rut: string): string`

Formatea RUT a formato visual: "12.345.678-9"

**Test cases (7):**

```typescript
describe("formatRUT", () => {
  it("debe formatear RUT sin formato", () => {
    expect(formatRUT("123456789")).toBe("12.345.678-9");
  });

  it("debe formatear RUT con K", () => {
    expect(formatRUT("11111111K")).toBe("11.111.111-K");
  });

  it("debe mantener RUT ya formateado", () => {
    expect(formatRUT("12.345.678-9")).toBe("12.345.678-9");
  });

  it("debe formatear RUT corto (menos de 8 dígitos)", () => {
    expect(formatRUT("1234567-9")).toBe("1.234.567-9");
  });

  it("debe manejar string vacío", () => {
    expect(formatRUT("")).toBe("");
  });

  it("debe limpiar antes de formatear", () => {
    expect(formatRUT("12 345 678-9")).toBe("12.345.678-9");
  });

  it("debe manejar RUT incompleto sin dígito verificador", () => {
    expect(formatRUT("12345678")).toBe("12.345.678");
  });
});
```

#### `calculateDV(rut: string): string`

Calcula dígito verificador usando algoritmo módulo 11.

**Test cases (5):**

```typescript
describe("calculateDV", () => {
  it("debe calcular DV para RUT numérico", () => {
    expect(calculateDV("12345678")).toBe("9");
  });

  it("debe calcular DV cuando resultado es K", () => {
    expect(calculateDV("11111111")).toBe("K");
  });

  it("debe calcular DV cuando resultado es 0", () => {
    expect(calculateDV("14324672")).toBe("0");
  });

  it("debe calcular DV para números pequeños", () => {
    expect(calculateDV("1")).toBe("9");
    expect(calculateDV("10")).toBe("3");
    expect(calculateDV("100")).toBe("0");
  });

  it("debe manejar RUT con caracteres no numéricos", () => {
    expect(calculateDV(cleanRUT("12.345.678"))).toBe("9");
  });
});
```

### Casos Edge Críticos

1. **RUT con K mayúscula vs minúscula**
   - Input: "11.111.111-k" → Output: válido
   - Input: "11.111.111-K" → Output: válido

2. **RUT sin dígito verificador**
   - Input: "12.345.678" → Debe poder calcular DV

3. **RUT muy cortos (1-2 dígitos)**
   - Input: "1-9" → Validar correctamente
   - Input: "10-3" → Validar correctamente

4. **Caracteres especiales**
   - Input: "12.345.678-9 " (espacio al final) → Limpiar y validar

---

## 2. lib/validations/invoice-validations.ts

**📍 Ubicación:** `lib/validations/invoice-validations.ts`
**⏱️ Estimación:** 25 test cases - 6.25 horas
**📦 Dependencias:** `lib/business-logic/totals.ts`
**📊 Estado actual:** ❌ SIN TESTS

### Por qué es crítico

- 💰 Totales incorrectos = facturas mal emitidas
- 🧾 IVA 19% (Chile) debe ser exacto
- ⚖️ Validación con tolerancia de centavos (0.01)
- 💱 Diferentes monedas (CLP sin decimales, USD con 2)
- 🚨 Error aquí = problemas legales/tributarios

### Schemas a testear

#### `invoiceSchema` (Zod)

**Test cases (15):**

```typescript
import { invoiceSchema } from "@/lib/validations/invoice-validations";

describe("invoiceSchema", () => {
  const validInvoice = {
    customerId: "123",
    number: "F-001",
    issueDate: new Date("2025-01-01"),
    dueDate: new Date("2025-01-31"),
    subtotal: 1000,
    IVA: 190,
    total: 1190,
    currency: "CLP" as const,
    termsDay: 30,
    isExemptFromTax: false,
  };

  describe("campos básicos", () => {
    it("debe validar factura completa válida", () => {
      expect(() => invoiceSchema.parse(validInvoice)).not.toThrow();
    });

    it("debe requerir customerId", () => {
      const invalid = { ...validInvoice, customerId: "" };
      expect(() => invoiceSchema.parse(invalid)).toThrow();
    });

    it("debe validar termsDay entre 1-365", () => {
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, termsDay: 0 }),
      ).toThrow();
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, termsDay: 366 }),
      ).toThrow();
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, termsDay: 30 }),
      ).not.toThrow();
    });
  });

  describe("validación de totales", () => {
    it("debe validar que total = subtotal + IVA (exacto)", () => {
      const valid = {
        ...validInvoice,
        subtotal: 1000,
        IVA: 190,
        total: 1190,
      };
      expect(() => invoiceSchema.parse(valid)).not.toThrow();
    });

    it("debe aceptar diferencia < 0.01 (tolerancia de redondeo)", () => {
      const valid = {
        ...validInvoice,
        subtotal: 1000,
        IVA: 190,
        total: 1190.009, // diferencia 0.009
      };
      expect(() => invoiceSchema.parse(valid)).not.toThrow();
    });

    it("debe rechazar diferencia > 0.01", () => {
      const invalid = {
        ...validInvoice,
        subtotal: 1000,
        IVA: 190,
        total: 1191, // diferencia 1.00
      };
      expect(() => invoiceSchema.parse(invalid)).toThrow(
        /total debe ser igual/,
      );
    });

    it("debe validar subtotal > 0", () => {
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, subtotal: 0 }),
      ).toThrow();
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, subtotal: -100 }),
      ).toThrow();
    });

    it("debe validar IVA >= 0", () => {
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, IVA: -10 }),
      ).toThrow();
    });
  });

  describe("factura exenta de IVA", () => {
    it("debe requerir IVA = 0 cuando isExemptFromTax = true", () => {
      const exempt = {
        ...validInvoice,
        subtotal: 1000,
        IVA: 0,
        total: 1000,
        isExemptFromTax: true,
      };
      expect(() => invoiceSchema.parse(exempt)).not.toThrow();
    });

    it("debe rechazar IVA > 0 cuando isExemptFromTax = true", () => {
      const invalid = {
        ...validInvoice,
        IVA: 190,
        isExemptFromTax: true,
      };
      expect(() => invoiceSchema.parse(invalid)).toThrow(/IVA debe ser 0/);
    });
  });

  describe("monedas", () => {
    it("debe aceptar CLP, USD, EUR", () => {
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, currency: "CLP" }),
      ).not.toThrow();
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, currency: "USD" }),
      ).not.toThrow();
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, currency: "EUR" }),
      ).not.toThrow();
    });

    it("debe rechazar moneda inválida", () => {
      expect(() =>
        invoiceSchema.parse({ ...validInvoice, currency: "ARS" }),
      ).toThrow();
    });
  });

  describe("CLP - redondeo a entero", () => {
    it("debe aceptar CLP con valores enteros", () => {
      const valid = {
        ...validInvoice,
        subtotal: 1000,
        IVA: 190,
        total: 1190,
        currency: "CLP" as const,
      };
      expect(() => invoiceSchema.parse(valid)).not.toThrow();
    });

    it("CLP con decimales debe validarse igual (redondeo en UI)", () => {
      // El schema no fuerza redondeo, solo valida matemática
      const valid = {
        ...validInvoice,
        subtotal: 1000.5,
        IVA: 190.1,
        total: 1190.6,
        currency: "CLP" as const,
      };
      expect(() => invoiceSchema.parse(valid)).not.toThrow();
    });
  });
});
```

#### `parseInvoicesWithBalance()`

**Test cases (5):**

```typescript
describe("parseInvoicesWithBalance", () => {
  it("debe convertir strings ISO a Date", () => {
    const input = [
      {
        id: "1",
        issueDate: "2025-01-01T00:00:00.000Z",
        dueDate: "2025-01-31T00:00:00.000Z",
        total: 1000,
        paid: 500,
      },
    ];

    const result = parseInvoicesWithBalance(input);

    expect(result[0].issueDate).toBeInstanceOf(Date);
    expect(result[0].dueDate).toBeInstanceOf(Date);
  });

  it("debe calcular balance = total - paid", () => {
    const input = [{ id: "1", total: 1000, paid: 300 }];
    const result = parseInvoicesWithBalance(input);
    expect(result[0].balance).toBe(700);
  });

  it("debe manejar null dates", () => {
    const input = [{ id: "1", issueDate: null, dueDate: null }];
    const result = parseInvoicesWithBalance(input);
    expect(result[0].issueDate).toBeNull();
    expect(result[0].dueDate).toBeNull();
  });

  it("debe manejar array vacío", () => {
    expect(parseInvoicesWithBalance([])).toEqual([]);
  });

  it("debe preservar otros campos", () => {
    const input = [{ id: "1", number: "F-001", customerId: "123" }];
    const result = parseInvoicesWithBalance(input);
    expect(result[0].number).toBe("F-001");
    expect(result[0].customerId).toBe("123");
  });
});
```

### Casos Edge Críticos

1. **Tolerancia de centavos**
   - 1190.001 vs 1190.00 → ✅ Válido (diff < 0.01)
   - 1190.02 vs 1190.00 → ❌ Inválido (diff > 0.01)

2. **IVA 19% exacto**
   - subtotal=1000 → IVA=190 → total=1190 ✅
   - subtotal=100.5 → IVA=19.095 → total=119.595 ✅

3. **Factura exenta**
   - isExempt=true + IVA=0 → ✅
   - isExempt=true + IVA>0 → ❌

---

## 3. lib/business-logic/installments.ts

**📍 Ubicación:** `lib/business-logic/installments.ts`
**⏱️ Estimación:** 20 test cases - 6.7 horas
**📦 Dependencias:** Ninguna
**📊 Estado actual:** 🟡 PARCIAL (necesita expansión)

### Por qué es crítico

- 💸 División de montos en cuotas
- 🎯 Última cuota absorbe centavos (suma exacta)
- ⚖️ Error = cobros incorrectos a clientes
- 📊 Casos edge: 1000÷3, 100÷7, números grandes

### Funciones a testear

#### `divideAmountIntoInstallments(amount: number, count: number): number[]`

✅ **YA TESTEADO:** Casos básicos
❌ **FALTA:** Edge cases críticos

**Test cases adicionales (15):**

```typescript
describe("divideAmountIntoInstallments - Edge Cases", () => {
  describe("absorción de centavos", () => {
    it("debe dividir 1000 en 3 cuotas [333.33, 333.33, 333.34]", () => {
      const result = divideAmountIntoInstallments(1000, 3);
      expect(result).toEqual([333.33, 333.33, 333.34]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(1000);
    });

    it("debe dividir 100 en 7 cuotas con absorción correcta", () => {
      const result = divideAmountIntoInstallments(100, 7);
      const sum = result.reduce((a, b) => a + b, 0);

      expect(result).toHaveLength(7);
      expect(sum).toBe(100); // Suma exacta
      expect(result[6]).toBeGreaterThan(result[0]); // Última absorbe
    });

    it("debe dividir 0.10 en 3 cuotas", () => {
      const result = divideAmountIntoInstallments(0.1, 3);
      const sum = result.reduce((a, b) => a + b, 0);

      expect(Math.abs(sum - 0.1)).toBeLessThan(0.001);
    });

    it("debe dividir 1 centavo en 2 cuotas", () => {
      const result = divideAmountIntoInstallments(0.01, 2);
      expect(result).toEqual([0.0, 0.01]); // o [0.01, 0.00] según implementación
    });
  });

  describe("números grandes", () => {
    it("debe dividir 1,000,000 en 3 cuotas", () => {
      const result = divideAmountIntoInstallments(1_000_000, 3);
      const sum = result.reduce((a, b) => a + b, 0);

      expect(sum).toBe(1_000_000);
      expect(result).toHaveLength(3);
    });

    it("debe dividir 999,999.99 en 12 cuotas", () => {
      const result = divideAmountIntoInstallments(999_999.99, 12);
      const sum = result.reduce((a, b) => a + b, 0);

      expect(Math.abs(sum - 999_999.99)).toBeLessThan(0.01);
    });
  });

  describe("casos extremos", () => {
    it("debe dividir amount en 1 cuota (retornar [amount])", () => {
      expect(divideAmountIntoInstallments(1000, 1)).toEqual([1000]);
    });

    it("debe rechazar count = 0", () => {
      expect(() => divideAmountIntoInstallments(1000, 0)).toThrow();
    });

    it("debe rechazar count negativo", () => {
      expect(() => divideAmountIntoInstallments(1000, -5)).toThrow();
    });

    it("debe rechazar amount negativo", () => {
      expect(() => divideAmountIntoInstallments(-1000, 3)).toThrow();
    });

    it("debe manejar amount = 0", () => {
      const result = divideAmountIntoInstallments(0, 3);
      expect(result).toEqual([0, 0, 0]);
    });

    it("debe rechazar count > 100 (validación de negocio)", () => {
      expect(() => divideAmountIntoInstallments(1000, 101)).toThrow();
    });
  });

  describe("precisión decimal", () => {
    it("debe mantener 2 decimales en todas las cuotas", () => {
      const result = divideAmountIntoInstallments(1000, 3);

      result.forEach((installment) => {
        const decimals = (installment.toString().split(".")[1] || "").length;
        expect(decimals).toBeLessThanOrEqual(2);
      });
    });

    it("debe redondear correctamente (no truncar)", () => {
      // 100 / 3 = 33.33... (no 33.33333333)
      const result = divideAmountIntoInstallments(100, 3);

      expect(result[0]).toBe(33.33);
      expect(result[1]).toBe(33.33);
      expect(result[2]).toBe(33.34);
    });
  });
});
```

#### `calculateInstallmentDates()` (si existe)

**Test cases (5):**

```typescript
describe("calculateInstallmentDates", () => {
  it("debe calcular fechas mensuales correctamente", () => {
    const start = new Date("2025-01-15");
    const dates = calculateInstallmentDates(start, 3, "monthly");

    expect(dates[0]).toEqual(new Date("2025-01-15"));
    expect(dates[1]).toEqual(new Date("2025-02-15"));
    expect(dates[2]).toEqual(new Date("2025-03-15"));
  });

  it("debe manejar fin de mes (31 ene → 28 feb)", () => {
    const start = new Date("2025-01-31");
    const dates = calculateInstallmentDates(start, 3, "monthly");

    expect(dates[1].getDate()).toBe(28); // Feb no tiene día 31
  });

  it("debe manejar años bisiestos", () => {
    const start = new Date("2024-01-31");
    const dates = calculateInstallmentDates(start, 2, "monthly");

    expect(dates[1].getDate()).toBe(29); // 2024 es bisiesto
  });

  it("debe calcular fechas quincenales", () => {
    const start = new Date("2025-01-01");
    const dates = calculateInstallmentDates(start, 3, "biweekly");

    expect(dates[1]).toEqual(new Date("2025-01-15"));
    expect(dates[2]).toEqual(new Date("2025-01-29"));
  });

  it("debe manejar DST (cambio de horario)", () => {
    // Chile: DST cambia en septiembre/abril
    const start = new Date("2025-03-15");
    const dates = calculateInstallmentDates(start, 3, "monthly");

    // No debe haber desfase de horas
    dates.forEach((date) => {
      expect(date.getHours()).toBe(start.getHours());
    });
  });
});
```

---

## 4. lib/import/invoice-import.ts

**📍 Ubicación:** `lib/import/invoice-import.ts`
**⏱️ Estimación:** 25 test cases - 10.4 horas
**📦 Dependencias:** `invoice-validations.ts`, `excel-parser.ts`
**📊 Estado actual:** ❌ SIN TESTS

### Por qué es crítico

- 📥 Importación masiva de facturas desde Excel
- 🧮 Cálculo automático de IVA si falta
- ✅ Validación batch (duplicados, inconsistencias)
- 💥 Error aquí = desastre en producción

### Funciones a testear

#### `calculateIVAFromSubtotal()`

**Test cases (6):**

```typescript
describe("calculateIVAFromSubtotal", () => {
  it("debe calcular IVA 19% correctamente", () => {
    expect(calculateIVAFromSubtotal(1000, false)).toBe(190);
    expect(calculateIVAFromSubtotal(100, false)).toBe(19);
  });

  it("debe retornar 0 cuando isExempt = true", () => {
    expect(calculateIVAFromSubtotal(1000, true)).toBe(0);
  });

  it("debe redondear a 2 decimales", () => {
    expect(calculateIVAFromSubtotal(100.5, false)).toBe(19.1); // 100.5 * 0.19 = 19.095
  });

  it("debe redondear CLP a entero", () => {
    expect(calculateIVAFromSubtotal(1000.5, false, "CLP")).toBe(190);
  });

  it("debe manejar subtotal = 0", () => {
    expect(calculateIVAFromSubtotal(0, false)).toBe(0);
  });

  it("debe rechazar subtotal negativo", () => {
    expect(() => calculateIVAFromSubtotal(-100, false)).toThrow();
  });
});
```

#### `processInvoiceRow()`

**Test cases (10):**

```typescript
describe("processInvoiceRow", () => {
  it("debe mapear columnas Excel a schema", () => {
    const row = {
      Número: "F-001",
      "Cliente RUT": "12.345.678-9",
      "Fecha Emisión": "2025-01-01",
      Subtotal: "1000",
      IVA: "190",
      Total: "1190",
    };

    const result = processInvoiceRow(row);

    expect(result.number).toBe("F-001");
    expect(result.customerRut).toBe("12.345.678-9");
    expect(result.subtotal).toBe(1000);
  });

  it("debe auto-calcular IVA si falta", () => {
    const row = {
      Subtotal: "1000",
      Total: "", // Falta
      IVA: "", // Falta
    };

    const result = processInvoiceRow(row);

    expect(result.IVA).toBe(190);
    expect(result.total).toBe(1190);
  });

  it("debe auto-calcular total si falta", () => {
    const row = {
      Subtotal: "1000",
      IVA: "190",
      Total: "", // Falta
    };

    const result = processInvoiceRow(row);
    expect(result.total).toBe(1190);
  });

  it("debe validar campos requeridos", () => {
    const row = {
      Subtotal: "1000",
      // Falta número y RUT
    };

    expect(() => processInvoiceRow(row)).toThrow(/campos requeridos/);
  });

  it("debe convertir tipos correctamente", () => {
    const row = {
      Subtotal: "1000.50", // String
      "Fecha Emisión": 44927, // Excel serial
    };

    const result = processInvoiceRow(row);

    expect(typeof result.subtotal).toBe("number");
    expect(result.issueDate).toBeInstanceOf(Date);
  });

  it("debe marcar factura como exenta si IVA = 0", () => {
    const row = {
      Subtotal: "1000",
      IVA: "0",
      Total: "1000",
    };

    const result = processInvoiceRow(row);
    expect(result.isExemptFromTax).toBe(true);
  });
});
```

#### `validateInvoiceBatch()`

**Test cases (9):**

```typescript
describe("validateInvoiceBatch", () => {
  it("debe detectar duplicados por número de factura", () => {
    const batch = [
      { number: "F-001", subtotal: 1000 },
      { number: "F-001", subtotal: 2000 }, // Duplicado
    ];

    const result = validateInvoiceBatch(batch);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/duplicado/i);
  });

  it("debe detectar fechas inválidas (futuro)", () => {
    const batch = [
      { issueDate: new Date("2030-01-01") }, // Futuro
    ];

    const result = validateInvoiceBatch(batch);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/fecha futura/i);
  });

  it("debe detectar totales inconsistentes", () => {
    const batch = [
      { subtotal: 1000, IVA: 190, total: 1200 }, // total incorrecto
    ];

    const result = validateInvoiceBatch(batch);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/total inconsistente/i);
  });

  it("debe validar RUTs", () => {
    const batch = [
      { customerRut: "12.345.678-0" }, // DV incorrecto
    ];

    const result = validateInvoiceBatch(batch);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/RUT inválido/i);
  });

  it("debe retornar warnings para montos atípicos", () => {
    const batch = [
      { subtotal: 10_000_000 }, // Monto muy alto
      { subtotal: 0.01 }, // Monto muy bajo
    ];

    const result = validateInvoiceBatch(batch);

    expect(result.warnings).toHaveLength(2);
  });

  it("debe rechazar batch > 1000 facturas", () => {
    const batch = Array(1001).fill({ number: "F-001" });

    expect(() => validateInvoiceBatch(batch)).toThrow(/límite excedido/);
  });

  it("debe validar batch vacío", () => {
    expect(() => validateInvoiceBatch([])).toThrow(/vacío/);
  });

  it("debe retornar índices de errores", () => {
    const batch = [
      { number: "F-001", subtotal: 1000 }, // OK
      { number: "F-001", subtotal: 2000 }, // Error: duplicado
      { number: "F-002", subtotal: 1000 }, // OK
    ];

    const result = validateInvoiceBatch(batch);

    expect(result.errorIndexes).toContain(1);
    expect(result.errorIndexes).not.toContain(0);
    expect(result.errorIndexes).not.toContain(2);
  });

  it("debe validar consistencia de moneda en batch", () => {
    const batch = [
      { currency: "CLP", total: 1000 },
      { currency: "USD", total: 100 },
    ];

    const result = validateInvoiceBatch(batch);
    expect(result.warnings).toContainEqual(
      expect.stringMatching(/múltiples monedas/),
    );
  });
});
```

---

## 5. components/forms/payment-to-customer-form.tsx

**📍 Ubicación:** `components/forms/payment-to-customer-form.tsx`
**⏱️ Estimación:** 25 test cases - 18.75 horas
**📦 Dependencias:** `payment-fifo.ts`, `payment-validations.ts`
**📊 Estado actual:** ❌ SIN TESTS

### Por qué es crítico

- 💸 Distribución FIFO de pagos (First-In-First-Out)
- 🎯 Validación: suma allocations = amount
- 🔄 Dynamic field arrays (React Hook Form)
- 💥 Error = pagos mal asignados a facturas

### Funciones/Componentes a testear

#### `handleCalculateFIFO()`

**Test cases (8):**

```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { PaymentToCustomerForm } from './payment-to-customer-form';

describe('PaymentToCustomerForm - FIFO', () => {
  const invoices = [
    { id: '1', number: 'F-001', balance: 300, dueDate: new Date('2025-01-01') },
    { id: '2', number: 'F-002', balance: 400, dueDate: new Date('2025-01-15') },
    { id: '3', number: 'F-003', balance: 200, dueDate: new Date('2025-02-01') },
  ];

  it('debe distribuir pago FIFO correctamente', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    // Ingresar amount
    const amountInput = screen.getByLabelText(/monto/i);
    await user.type(amountInput, '500');

    // Click en "Calcular FIFO"
    await user.click(screen.getByRole('button', { name: /calcular fifo/i }));

    // Verificar distribución
    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });

    expect(allocations[0]).toHaveValue(300); // F-001 pagada completa
    expect(allocations[1]).toHaveValue(200); // F-002 pago parcial
    expect(allocations[2]).toHaveValue(0);   // F-003 sin pago
  });

  it('debe manejar sobrepago (amount > total balance)', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    await user.type(screen.getByLabelText(/monto/i), '1000'); // > 900
    await user.click(screen.getByRole('button', { name: /calcular fifo/i }));

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });

    // Todas las facturas pagadas completamente
    expect(allocations[0]).toHaveValue(300);
    expect(allocations[1]).toHaveValue(400);
    expect(allocations[2]).toHaveValue(200);

    // Mostrar warning de sobrepago
    expect(screen.getByText(/sobra.*100/i)).toBeInTheDocument();
  });

  it('debe ordenar invoices por dueDate (FIFO)', async () => {
    const unorderedInvoices = [
      { id: '1', balance: 100, dueDate: new Date('2025-02-01') },
      { id: '2', balance: 200, dueDate: new Date('2025-01-01') }, // Más antigua
      { id: '3', balance: 150, dueDate: new Date('2025-01-15') },
    ];

    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={unorderedInvoices} />);

    await user.type(screen.getByLabelText(/monto/i), '250');
    await user.click(screen.getByRole('button', { name: /calcular fifo/i }));

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });

    // Primera factura (más antigua) debe tener allocation
    expect(allocations[1]).toHaveValue(200); // dueDate 2025-01-01
    expect(allocations[2]).toHaveValue(50);  // dueDate 2025-01-15
  });

  it('debe pagar cuotas vencidas primero', () => {
    const invoicesWithOverdue = [
      { id: '1', balance: 100, dueDate: new Date('2024-12-01'), isOverdue: true },
      { id: '2', balance: 200, dueDate: new Date('2025-02-01'), isOverdue: false },
    ];

    // Verificar que isOverdue=true tiene prioridad
    // ...
  });
});
```

#### `handleChangeAllocation()`

**Test cases (5):**

```typescript
describe('PaymentToCustomerForm - Manual Allocation', () => {
  it('debe actualizar allocation específica', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });

    await user.clear(allocations[0]);
    await user.type(allocations[0], '150');

    expect(allocations[0]).toHaveValue(150);
  });

  it('debe recalcular suma después de cambio', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    const amountInput = screen.getByLabelText(/monto/i);
    await user.type(amountInput, '500');

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });
    await user.clear(allocations[0]);
    await user.type(allocations[0], '100');

    // Suma actual vs amount
    const sumDisplay = screen.getByText(/suma:/i);
    expect(sumDisplay).toHaveTextContent('100'); // solo 1 allocation
  });

  it('debe mostrar warning si suma > amount', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    await user.type(screen.getByLabelText(/monto/i), '100');

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });
    await user.type(allocations[0], '150'); // > amount

    expect(screen.getByText(/excede.*monto total/i)).toBeInTheDocument();
  });

  it('debe mostrar warning si suma < amount', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    await user.type(screen.getByLabelText(/monto/i), '500');

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });
    await user.type(allocations[0], '100'); // < amount (falta distribuir)

    expect(screen.getByText(/falta distribuir.*400/i)).toBeInTheDocument();
  });

  it('debe validar allocation <= balance de factura', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    const allocations = screen.getAllByRole('spinbutton', { name: /monto asignado/i });
    await user.type(allocations[0], '500'); // > balance (300)

    expect(screen.getByText(/excede.*balance/i)).toBeInTheDocument();
  });
});
```

#### `handleRemoveAllocation()`

**Test cases (3):**

```typescript
describe('PaymentToCustomerForm - Remove Allocation', () => {
  it('debe eliminar allocation', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    await user.click(deleteButtons[0]);

    expect(screen.getAllByRole('spinbutton', { name: /monto asignado/i })).toHaveLength(2);
  });

  it('debe recalcular suma después de eliminar', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={invoices} />);

    // Setup: allocation 1 = 100, allocation 2 = 200
    await user.type(screen.getAllByRole('spinbutton')[0], '100');
    await user.type(screen.getAllByRole('spinbutton')[1], '200');

    // Eliminar allocation 1
    await user.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

    const sumDisplay = screen.getByText(/suma:/i);
    expect(sumDisplay).toHaveTextContent('200'); // solo allocation 2
  });

  it('debe mantener al menos 1 allocation', async () => {
    const user = userEvent.setup();
    render(<PaymentToCustomerForm invoices={[invoices[0]]} />); // Solo 1 factura

    const deleteButton = screen.getByRole('button', { name: /eliminar/i });

    expect(deleteButton).toBeDisabled();
  });
});
```

#### Validación submit

**Test cases (9):**

```typescript
describe('PaymentToCustomerForm - Submit Validation', () => {
  it('debe validar al menos 1 allocation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToCustomerForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/al menos 1 factura/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('debe validar suma allocations = amount (exacto)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToCustomerForm invoices={invoices} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/monto/i), '500');

    // Allocations suman 400 (< 500)
    await user.type(screen.getAllByRole('spinbutton')[0], '200');
    await user.type(screen.getAllByRole('spinbutton')[1], '200');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/suma debe ser igual/i)).toBeInTheDocument();
  });

  it('debe aceptar diferencia < 0.01 (tolerancia)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToCustomerForm invoices={invoices} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/monto/i), '500.00');
    await user.type(screen.getAllByRole('spinbutton')[0], '500.009'); // diff 0.009

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onSubmit).toHaveBeenCalled(); // ✅ Válido
  });

  it('debe rechazar allocations negativas', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToCustomerForm invoices={invoices} onSubmit={onSubmit} />);

    await user.type(screen.getAllByRole('spinbutton')[0], '-100');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/no puede ser negativo/i)).toBeInTheDocument();
  });

  it('debe validar customerId seleccionado', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToCustomerForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/seleccione.*cliente/i)).toBeInTheDocument();
  });
});
```

---

## 6. hooks/use-rut-input.ts

**📍 Ubicación:** `hooks/use-rut-input.ts`
**⏱️ Estimación:** 20 test cases - 10 horas
**📦 Dependencias:** `lib/rut-validations.ts`
**📊 Estado actual:** ❌ SIN TESTS

### Por qué es crítico

- ⌨️ UX crítica para entrada de RUT
- 🎨 Formateo automático en tiempo real
- ✅ Validación visual (isValid)
- 🔄 Estados: formattedValue, cleanValue

### Test cases (20)

```typescript
import { renderHook, act } from "@testing-library/react";
import { useRutInput } from "@/hooks/use-rut-input";

describe("useRutInput", () => {
  describe("estado formattedValue", () => {
    it("debe inicializar con string vacío", () => {
      const { result } = renderHook(() => useRutInput());
      expect(result.current.formattedValue).toBe("");
    });

    it("debe formatear automáticamente al llamar setValue", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("123456789");
      });

      expect(result.current.formattedValue).toBe("12.345.678-9");
    });

    it("debe aceptar RUT ya formateado", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("12.345.678-9");
      });

      expect(result.current.formattedValue).toBe("12.345.678-9");
    });

    it("debe formatear RUT con K", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("11111111K");
      });

      expect(result.current.formattedValue).toBe("11.111.111-K");
    });
  });

  describe("estado cleanValue", () => {
    it("debe retornar RUT sin formato", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("12.345.678-9");
      });

      expect(result.current.cleanValue).toBe("123456789");
    });

    it("debe preservar K mayúscula", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("11.111.111-K");
      });

      expect(result.current.cleanValue).toBe("11111111K");
    });
  });

  describe("handleChange - sanitización", () => {
    it("debe eliminar caracteres no permitidos", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.handleChange({ target: { value: "12ABC345-9" } } as any);
      });

      expect(result.current.cleanValue).toBe("123459");
    });

    it("debe permitir solo números y K", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.handleChange({ target: { value: "11111111X" } } as any);
      });

      expect(result.current.cleanValue).toBe("11111111"); // X removida
    });

    it("debe llamar onChange con cleanValue", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useRutInput({ onChange }));

      act(() => {
        result.current.handleChange({
          target: { value: "12.345.678-9" },
        } as any);
      });

      expect(onChange).toHaveBeenCalledWith("123456789");
    });

    it("debe convertir k minúscula a K", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.handleChange({ target: { value: "11111111k" } } as any);
      });

      expect(result.current.cleanValue).toBe("11111111K");
    });
  });

  describe("handleBlur - formateo automático", () => {
    it("debe formatear al hacer blur", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.handleChange({ target: { value: "123456789" } } as any);
      });

      expect(result.current.formattedValue).toBe("123456789"); // Sin formato

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.formattedValue).toBe("12.345.678-9"); // Formateado
    });

    it("debe llamar onBlur callback", () => {
      const onBlur = vi.fn();
      const { result } = renderHook(() => useRutInput({ onBlur }));

      act(() => {
        result.current.handleBlur();
      });

      expect(onBlur).toHaveBeenCalled();
    });

    it("no debe formatear si campo vacío", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.handleBlur();
      });

      expect(result.current.formattedValue).toBe("");
    });
  });

  describe("isValid", () => {
    it("debe retornar true para RUT válido", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("12.345.678-9");
      });

      expect(result.current.isValid).toBe(true);
    });

    it("debe retornar false para RUT inválido", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("12.345.678-0"); // DV incorrecto
      });

      expect(result.current.isValid).toBe(false);
    });

    it("debe retornar false para campo vacío", () => {
      const { result } = renderHook(() => useRutInput());

      expect(result.current.isValid).toBe(false);
    });
  });

  describe("clear", () => {
    it("debe limpiar value", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("12.345.678-9");
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.formattedValue).toBe("");
      expect(result.current.cleanValue).toBe("");
    });

    it("debe llamar onChange con string vacío", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useRutInput({ onChange }));

      act(() => {
        result.current.setValue("12.345.678-9");
      });

      onChange.mockClear();

      act(() => {
        result.current.clear();
      });

      expect(onChange).toHaveBeenCalledWith("");
    });
  });

  describe("integración con formularios", () => {
    it("debe ser compatible con React Hook Form", () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useRutInput({ onChange }));

      act(() => {
        result.current.handleChange({
          target: { value: "12.345.678-9" },
        } as any);
      });

      // onChange debe recibir cleanValue (formato esperado por backend)
      expect(onChange).toHaveBeenCalledWith("123456789");
    });

    it("debe mostrar formattedValue en input", () => {
      const { result } = renderHook(() => useRutInput());

      act(() => {
        result.current.setValue("123456789");
      });

      // formattedValue va al input.value
      expect(result.current.formattedValue).toBe("12.345.678-9");
    });
  });
});
```

---

## ✅ Checklist de Implementación

### Semana 1 (Crítico)

- [x] lib/rut-validations.ts (49 tests) ✅ **COMPLETADO 2025-11-11**
  - [x] rutSchema Zod (15 tests)
  - [x] rutSchemaOptional (4 tests)
  - [x] rutHelpers.format() (7 tests)
  - [x] rutHelpers.clean() (7 tests)
  - [x] rutHelpers.validate() (7 tests)
  - [x] rutHelpers.getCheckDigit() (6 tests)
  - [x] Integración (3 tests)

- [ ] lib/validations/invoice-validations.ts (25 tests)
  - [ ] invoiceSchema (15 tests)
  - [ ] parseInvoicesWithBalance (5 tests)
  - [ ] Edge cases financieros (5 tests)

- [ ] lib/business-logic/installments.ts (20 tests)
  - [ ] Absorción de centavos (4 tests)
  - [ ] Números grandes (2 tests)
  - [ ] Casos extremos (6 tests)
  - [ ] Precisión decimal (3 tests)
  - [ ] calculateInstallmentDates (5 tests)

### Semana 2 (Crítico continuación)

- [ ] lib/import/invoice-import.ts (25 tests)
  - [ ] calculateIVAFromSubtotal (6 tests)
  - [ ] processInvoiceRow (10 tests)
  - [ ] validateInvoiceBatch (9 tests)

- [ ] hooks/use-rut-input.ts (20 tests)
  - [ ] Estados (4 tests)
  - [ ] handleChange (4 tests)
  - [ ] handleBlur (3 tests)
  - [ ] isValid (3 tests)
  - [ ] clear (2 tests)
  - [ ] Integración (4 tests)

- [ ] components/forms/payment-to-customer-form.tsx (25 tests)
  - [ ] handleCalculateFIFO (8 tests)
  - [ ] handleChangeAllocation (5 tests)
  - [ ] handleRemoveAllocation (3 tests)
  - [ ] Validación submit (9 tests)

---

**Total Crítico:** 145 test cases - 62 horas

**Próximo:** [03-prioridad-importante.md](./03-prioridad-importante.md)
