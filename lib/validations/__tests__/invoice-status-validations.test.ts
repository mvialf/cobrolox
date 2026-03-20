import { describe, it, expect } from "vitest";
import {
  invoiceStatusSchema,
  formValuesToPayload,
  invoiceStatusToFormValues,
  type InvoiceStatus,
} from "../invoice-status-validations";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";

const validData = {
  name: "Emitida",
  colorId: validUUID,
};

describe("invoice-status-validations", () => {
  describe("invoiceStatusSchema", () => {
    it("debe validar datos mínimos válidos", () => {
      const result = invoiceStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe(0);
        expect(result.data.isInitial).toBe(false);
        expect(result.data.isFinal).toBe(false);
        expect(result.data.isActive).toBe(true);
      }
    });

    it("debe rechazar colorId no UUID", () => {
      const result = invoiceStatusSchema.safeParse({ ...validData, colorId: "no-uuid" });
      expect(result.success).toBe(false);
    });

    it("debe rechazar isInitial=true e isFinal=true simultáneo", () => {
      const result = invoiceStatusSchema.safeParse({
        ...validData,
        isInitial: true,
        isFinal: true,
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar isInitial=true con isFinal=false", () => {
      const result = invoiceStatusSchema.safeParse({
        ...validData,
        isInitial: true,
        isFinal: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("formValuesToPayload", () => {
    it("debe transformar con defaults", () => {
      const parsed = invoiceStatusSchema.parse(validData);
      const payload = formValuesToPayload(parsed);
      expect(payload.isInitial).toBe(false);
      expect(payload.isFinal).toBe(false);
    });
  });

  describe("invoiceStatusToFormValues", () => {
    it("debe extraer campos del schema", () => {
      const status: InvoiceStatus = {
        id: "abc",
        name: "Emitida",
        order: 1,
        colorId: validUUID,
        isInitial: true,
        isFinal: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const values = invoiceStatusToFormValues(status);
      expect(values).not.toHaveProperty("id");
      expect(values.isInitial).toBe(true);
    });
  });
});
