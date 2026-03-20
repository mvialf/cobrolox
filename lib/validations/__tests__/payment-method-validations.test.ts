import { describe, it, expect } from "vitest";
import {
  paymentMethodSchema,
  formValuesToPayload,
  methodToFormValues,
  type PaymentMethod,
} from "../payment-method-validations";

const validData = {
  name: "Transferencia",
};

describe("payment-method-validations", () => {
  describe("paymentMethodSchema", () => {
    it("debe validar datos mínimos válidos", () => {
      const result = paymentMethodSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("debe rechazar hasInstallments=true sin maxInstallments", () => {
      const result = paymentMethodSchema.safeParse({
        ...validData,
        hasInstallments: true,
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar hasInstallments=true con maxInstallments válido", () => {
      const result = paymentMethodSchema.safeParse({
        ...validData,
        hasInstallments: true,
        maxInstallments: 12,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar maxInstallments < 2", () => {
      const result = paymentMethodSchema.safeParse({
        ...validData,
        hasInstallments: true,
        maxInstallments: 1,
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar maxInstallments > 36", () => {
      const result = paymentMethodSchema.safeParse({
        ...validData,
        hasInstallments: true,
        maxInstallments: 48,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("formValuesToPayload", () => {
    it("debe setear icon a null si vacío", () => {
      const parsed = paymentMethodSchema.parse(validData);
      const payload = formValuesToPayload(parsed);
      expect(payload.icon).toBeNull();
      expect(payload.hasInstallments).toBe(false);
    });
  });

  describe("methodToFormValues", () => {
    it("debe extraer campos del schema", () => {
      const method: PaymentMethod = {
        id: "abc",
        name: "Transferencia",
        active: true,
        order: 1,
        icon: null,
        hasInstallments: false,
        maxInstallments: null,
        _count: { payments: 5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const values = methodToFormValues(method);
      expect(values).not.toHaveProperty("id");
      expect(values).not.toHaveProperty("_count");
      expect(values.name).toBe("Transferencia");
    });
  });
});
