import { describe, it, expect } from "vitest";
import {
  installmentSchema,
  formValuesToPayload,
  installmentToFormValues,
  type Installment,
} from "../installment-validations";

describe("installment-validations", () => {
  const validData = {
    paymentId: "550e8400-e29b-41d4-a716-446655440000",
    installmentNumber: 1,
    amount: 50000,
    dueDate: new Date("2025-06-15"),
  };

  // ═══════════════════════════════════════════════════════════════
  // installmentSchema
  // ═══════════════════════════════════════════════════════════════
  describe("installmentSchema", () => {
    it("debe validar datos completos válidos", () => {
      const result = installmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe rechazar paymentId no UUID", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        paymentId: "no-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar installmentNumber < 1", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        installmentNumber: 0,
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar installmentNumber decimal", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        installmentNumber: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar amount negativo", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        amount: -100,
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar amount con más de 2 decimales", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        amount: 100.123,
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar amount con 2 decimales", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        amount: 100.01,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar dueDate inválida", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        dueDate: "no-fecha",
      });
      expect(result.success).toBe(false);
    });

    it("debe coercionar amount string a número", () => {
      const result = installmentSchema.safeParse({
        ...validData,
        amount: "50000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50000);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // formValuesToPayload
  // ═══════════════════════════════════════════════════════════════
  describe("formValuesToPayload", () => {
    it("debe transformar form values a payload", () => {
      const payload = formValuesToPayload(validData);
      expect(payload).toEqual({
        paymentId: validData.paymentId,
        installmentNumber: 1,
        amount: 50000,
        dueDate: validData.dueDate,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // installmentToFormValues
  // ═══════════════════════════════════════════════════════════════
  describe("installmentToFormValues", () => {
    it("debe extraer solo los campos del schema", () => {
      const installment: Installment = {
        id: "some-id",
        paymentId: validData.paymentId,
        installmentNumber: 1,
        amount: 50000,
        dueDate: new Date("2025-06-15"),
        status: "pending",
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const formValues = installmentToFormValues(installment);
      expect(formValues).toEqual({
        paymentId: validData.paymentId,
        installmentNumber: 1,
        amount: 50000,
        dueDate: installment.dueDate,
      });
      // No debe incluir campos extra
      expect(formValues).not.toHaveProperty("id");
      expect(formValues).not.toHaveProperty("status");
    });
  });
});
