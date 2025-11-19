import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  invoiceSchema,
  updateInvoiceSchema,
  type InvoiceFormData,
  type UpdateInvoiceFormData,
} from "../invoice-validations";

describe("invoice-validations", () => {
  describe("invoiceSchema - Campos básicos", () => {
    const validInvoiceData = {
      invoiceNumber: "F-001",
      issueDate: new Date("2025-01-01"),
      dueDate: new Date("2025-01-31"),
      subtotal: 1000,
      taxAmount: 190,
      total: 1190,
      customerId: "customer-123",
      termsDay: 30,
    };

    it("debe validar factura completa válida", () => {
      const result = invoiceSchema.safeParse(validInvoiceData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoiceNumber).toBe("F-001");
        expect(result.data.subtotal).toBe(1000);
        expect(result.data.total).toBe(1190);
      }
    });

    it("debe requerir invoiceNumber", () => {
      const invalid = { ...validInvoiceData, invoiceNumber: "" };
      const result = invoiceSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("invoiceNumber");
        expect(result.error.issues[0].message).toMatch(
          /número de factura es requerido/i
        );
      }
    });

    it("debe requerir customerId", () => {
      const invalid = { ...validInvoiceData, customerId: "" };
      const result = invoiceSchema.safeParse(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("customerId");
        expect(result.error.issues[0].message).toMatch(
          /seleccionar un cliente/i
        );
      }
    });

    it("debe aceptar termsDay opcional", () => {
      const { termsDay: _unused, ...withoutTermsDay } = validInvoiceData;

      const result = invoiceSchema.safeParse(withoutTermsDay);
      expect(result.success).toBe(true);
    });

    it("debe validar termsDay como entero no negativo", () => {
      // Negativo
      const negative = { ...validInvoiceData, termsDay: -5 };
      expect(invoiceSchema.safeParse(negative).success).toBe(false);

      // Decimal
      const decimal = { ...validInvoiceData, termsDay: 15.5 };
      expect(invoiceSchema.safeParse(decimal).success).toBe(false);

      // Válido
      const valid = { ...validInvoiceData, termsDay: 90 };
      expect(invoiceSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("invoiceSchema - Validación de totales", () => {
    const baseData = {
      invoiceNumber: "F-001",
      issueDate: new Date("2025-01-01"),
      dueDate: new Date("2025-01-31"),
      customerId: "customer-123",
    };

    it("debe validar que total = subtotal + taxAmount (exacto)", () => {
      const valid = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1190,
      };

      const result = invoiceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("debe aceptar diferencia < 0.01 (tolerancia de redondeo)", () => {
      const valid = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1190.009, // diferencia 0.009
      };

      const result = invoiceSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("debe rechazar diferencia > 0.01", () => {
      const invalid = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1191, // diferencia 1.00
      };

      const result = invoiceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(
          /total no coincide.*subtotal.*IVA/i
        );
      }
    });

    it("debe validar subtotal > 0", () => {
      const zero = {
        ...baseData,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      };
      const resultZero = invoiceSchema.safeParse(zero);
      expect(resultZero.success).toBe(false);

      const negative = {
        ...baseData,
        subtotal: -100,
        taxAmount: 0,
        total: -100,
      };
      const resultNegative = invoiceSchema.safeParse(negative);
      expect(resultNegative.success).toBe(false);
      if (!resultNegative.success) {
        expect(resultNegative.error.issues[0].message).toMatch(
          /subtotal debe ser mayor a 0|subtotal mínimo es/i
        );
      }
    });

    it("debe validar taxAmount >= 0", () => {
      // taxAmount negativo
      const negative = {
        ...baseData,
        subtotal: 1000,
        taxAmount: -10,
        total: 990,
      };
      const result = invoiceSchema.safeParse(negative);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(
          /IVA no puede ser negativo/i
        );
      }

      // taxAmount = 0 (factura exenta)
      const exempt = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 0,
        total: 1000,
      };
      const resultExempt = invoiceSchema.safeParse(exempt);
      expect(resultExempt.success).toBe(true);
    });
  });

  describe("invoiceSchema - Validación de fechas", () => {
    const baseData = {
      invoiceNumber: "F-001",
      subtotal: 1000,
      taxAmount: 190,
      total: 1190,
      customerId: "customer-123",
    };

    beforeEach(() => {
      vi.useFakeTimers();
      // Setear fecha a medianoche local para evitar problemas de zona horaria
      vi.setSystemTime(new Date(2025, 1, 1, 0, 0, 0)); // 1 de febrero 2025, medianoche local
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("debe rechazar issueDate futura", () => {
      const futureDate = {
        ...baseData,
        issueDate: new Date(2025, 1, 2), // 2 de febrero (mañana)
        dueDate: new Date(2025, 2, 2), // 2 de marzo
      };

      const result = invoiceSchema.safeParse(futureDate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(
          /fecha de emisión no puede ser futura/i
        );
      }
    });

    it("debe aceptar issueDate = hoy", () => {
      const today = {
        ...baseData,
        issueDate: new Date(2025, 1, 1), // Hoy (1 de febrero)
        dueDate: new Date(2025, 2, 1), // 1 de marzo
      };

      const result = invoiceSchema.safeParse(today);
      expect(result.success).toBe(true);
    });

    it("debe aceptar issueDate pasada", () => {
      const past = {
        ...baseData,
        issueDate: new Date(2025, 0, 15), // 15 de enero
        dueDate: new Date(2025, 1, 15), // 15 de febrero
      };

      const result = invoiceSchema.safeParse(past);
      expect(result.success).toBe(true);
    });

    it("debe validar dueDate >= issueDate", () => {
      // dueDate < issueDate
      const invalid = {
        ...baseData,
        issueDate: new Date(2025, 0, 31), // 31 de enero
        dueDate: new Date(2025, 0, 15), // 15 de enero (antes)
      };
      const result = invoiceSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(
          /fecha de vencimiento debe ser mayor o igual/i
        );
      }

      // dueDate = issueDate (válido)
      const sameDay = {
        ...baseData,
        issueDate: new Date(2025, 0, 15),
        dueDate: new Date(2025, 0, 15),
      };
      const resultSameDay = invoiceSchema.safeParse(sameDay);
      expect(resultSameDay.success).toBe(true);
    });

    it("debe comparar fechas ignorando horas/minutos", () => {
      const withTime = {
        ...baseData,
        issueDate: new Date(2025, 1, 1, 23, 59, 59), // Hoy pero con hora
        dueDate: new Date(2025, 2, 1, 0, 0, 0), // 1 de marzo medianoche
      };

      const result = invoiceSchema.safeParse(withTime);
      expect(result.success).toBe(true);
    });
  });

  describe("updateInvoiceSchema", () => {
    const validId = "550e8400-e29b-41d4-a716-446655440000";

    beforeEach(() => {
      vi.useFakeTimers();
      // Setear fecha a medianoche local
      vi.setSystemTime(new Date(2025, 1, 1, 0, 0, 0)); // 1 de febrero 2025
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("debe validar ID como UUID", () => {
      const validUpdate = {
        id: validId,
        invoiceNumber: "F-002",
      };

      const result = updateInvoiceSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("debe rechazar ID inválido", () => {
      const invalidUpdate = {
        id: "not-a-uuid",
        invoiceNumber: "F-002",
      };

      const result = updateInvoiceSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(
          /ID de factura inválido/i
        );
      }
    });

    it("debe permitir actualizar campos individuales", () => {
      // Solo actualizar invoiceNumber
      const update1 = {
        id: validId,
        invoiceNumber: "F-999",
      };
      expect(updateInvoiceSchema.safeParse(update1).success).toBe(true);

      // Solo actualizar subtotal
      const update2 = {
        id: validId,
        subtotal: 5000,
      };
      expect(updateInvoiceSchema.safeParse(update2).success).toBe(true);

      // Solo actualizar statusId
      const update3 = {
        id: validId,
        statusId: "status-123",
      };
      expect(updateInvoiceSchema.safeParse(update3).success).toBe(true);
    });

    it("debe validar issueDate si está presente", () => {
      // issueDate futura
      const futureDate = {
        id: validId,
        issueDate: new Date(2025, 1, 2), // 2 de febrero (mañana)
      };
      const result = updateInvoiceSchema.safeParse(futureDate);
      expect(result.success).toBe(false);

      // issueDate pasada (válida)
      const pastDate = {
        id: validId,
        issueDate: new Date(2025, 0, 15), // 15 de enero
      };
      const resultPast = updateInvoiceSchema.safeParse(pastDate);
      expect(resultPast.success).toBe(true);
    });

    it("no debe validar totales en update parcial", () => {
      // En el schema de update, no hay validación de consistencia de totales
      // porque los campos son opcionales
      const partialUpdate = {
        id: validId,
        subtotal: 1000,
        // taxAmount y total no proporcionados
      };

      const result = updateInvoiceSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe("Edge cases financieros", () => {
    const baseData = {
      invoiceNumber: "F-001",
      issueDate: new Date("2025-01-01"),
      dueDate: new Date("2025-01-31"),
      customerId: "customer-123",
    };

    it("debe manejar tolerancia exacta de 0.01", () => {
      // Diferencia 0.009 (< 0.01) - VÁLIDO
      const case1 = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1190.009,
      };
      expect(invoiceSchema.safeParse(case1).success).toBe(true);

      // Diferencia 0.01 (= 0.01) - VÁLIDO
      const case2 = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1190.01,
      };
      expect(invoiceSchema.safeParse(case2).success).toBe(true);

      // Diferencia 0.011 (> 0.01) - INVÁLIDO
      const case3 = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1190.011,
      };
      expect(invoiceSchema.safeParse(case3).success).toBe(false);
    });

    it("debe manejar números grandes (millones)", () => {
      const largeMoney = {
        ...baseData,
        subtotal: 10_000_000,
        taxAmount: 1_900_000,
        total: 11_900_000,
      };

      const result = invoiceSchema.safeParse(largeMoney);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subtotal).toBe(10_000_000);
        expect(result.data.total).toBe(11_900_000);
      }
    });

    it("debe manejar números pequeños (centavos)", () => {
      const smallMoney = {
        ...baseData,
        subtotal: 1, // $1
        taxAmount: 0.19, // $0.19
        total: 1.19,
      };

      const result = invoiceSchema.safeParse(smallMoney);
      expect(result.success).toBe(true);
    });

    it("debe manejar IVA 19% con redondeo correcto", () => {
      // Caso típico: 1000 * 0.19 = 190
      const case1 = {
        ...baseData,
        subtotal: 1000,
        taxAmount: 190,
        total: 1190,
      };
      expect(invoiceSchema.safeParse(case1).success).toBe(true);

      // Caso con redondeo: 100.5 * 0.19 = 19.095 → 19.10
      const case2 = {
        ...baseData,
        subtotal: 100.5,
        taxAmount: 19.1, // Redondeado
        total: 119.6,
      };
      expect(invoiceSchema.safeParse(case2).success).toBe(true);

      // Caso con muchos decimales
      const case3 = {
        ...baseData,
        subtotal: 333.33,
        taxAmount: 63.33, // 333.33 * 0.19 = 63.3327
        total: 396.66,
      };
      expect(invoiceSchema.safeParse(case3).success).toBe(true);
    });

    it("debe mantener precisión decimal (no truncar)", () => {
      // Verificar que los decimales se mantienen correctamente
      const withDecimals = {
        ...baseData,
        subtotal: 1234.56,
        taxAmount: 234.57, // 1234.56 * 0.19 = 234.5664
        total: 1469.13,
      };

      const result = invoiceSchema.safeParse(withDecimals);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subtotal).toBe(1234.56);
        expect(result.data.taxAmount).toBe(234.57);
        expect(result.data.total).toBe(1469.13);
      }
    });
  });

  describe("Inferencia de tipos TypeScript", () => {
    it("debe inferir tipo InvoiceFormData correctamente", () => {
      // Este test verifica que los tipos inferidos sean correctos
      const data: InvoiceFormData = {
        invoiceNumber: "F-001",
        issueDate: new Date("2025-01-01"),
        dueDate: new Date("2025-01-31"),
        subtotal: 1000,
        taxAmount: 190,
        total: 1190,
        customerId: "customer-123",
        // statusId es opcional
        // termsDay es opcional
      };

      const result = invoiceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("debe inferir tipo UpdateInvoiceFormData correctamente", () => {
      const data: UpdateInvoiceFormData = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        invoiceNumber: "F-002",
        // Todos los demás campos son opcionales
      };

      const result = updateInvoiceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
