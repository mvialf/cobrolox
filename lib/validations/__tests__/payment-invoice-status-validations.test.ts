import { describe, it, expect } from "vitest";
import {
  paymentInvoiceStatusSchema,
  formValuesToPayload,
  paymentInvoiceStatusToFormValues,
  type PaymentInvoiceStatus,
} from "../payment-invoice-status-validations";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

const validData = {
  name: "Sin pagar",
  colorId: validUUID,
};

describe("payment-invoice-status-validations", () => {
  describe("paymentInvoiceStatusSchema", () => {
    it("debe validar datos mínimos válidos", () => {
      const result = paymentInvoiceStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isInitial).toBe(false);
        expect(result.data.isFinal).toBe(false);
        expect(result.data.isActive).toBe(true);
      }
    });

    it("debe rechazar isInitial=true e isFinal=true simultáneo", () => {
      const result = paymentInvoiceStatusSchema.safeParse({
        ...validData,
        isInitial: true,
        isFinal: true,
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar colorId no UUID", () => {
      const result = paymentInvoiceStatusSchema.safeParse({
        ...validData,
        colorId: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar solo isInitial=true", () => {
      const result = paymentInvoiceStatusSchema.safeParse({
        ...validData,
        isInitial: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("formValuesToPayload", () => {
    it("debe transformar con defaults", () => {
      const parsed = paymentInvoiceStatusSchema.parse(validData);
      const payload = formValuesToPayload(parsed);
      expect(payload.isInitial).toBe(false);
      expect(payload.isFinal).toBe(false);
      expect(payload.isActive).toBe(true);
    });
  });

  describe("paymentInvoiceStatusToFormValues", () => {
    it("debe extraer campos del schema", () => {
      const status: PaymentInvoiceStatus = {
        id: "abc",
        name: "Sin pagar",
        order: 0,
        colorId: validUUID,
        isInitial: true,
        isFinal: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const values = paymentInvoiceStatusToFormValues(status);
      expect(values).not.toHaveProperty("id");
      expect(values.isInitial).toBe(true);
    });
  });
});
