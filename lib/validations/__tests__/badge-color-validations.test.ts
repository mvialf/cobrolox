import { describe, it, expect } from "vitest";
import {
  badgeColorSchema,
  formValuesToPayload,
  badgeColorToFormValues,
  type BadgeColor,
} from "../badge-color-validations";

const validData = {
  name: "Azul",
  key: "blue-500",
  bgClass: "bg-blue-500",
};

describe("badge-color-validations", () => {
  describe("badgeColorSchema", () => {
    it("debe validar datos mínimos válidos", () => {
      const result = badgeColorSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.textClass).toBe("text-white");
        expect(result.data.order).toBe(0);
        expect(result.data.isActive).toBe(true);
      }
    });

    it("debe rechazar key con caracteres inválidos", () => {
      const result = badgeColorSchema.safeParse({ ...validData, key: "Blue 500!" });
      expect(result.success).toBe(false);
    });

    it("debe convertir key a lowercase", () => {
      const result = badgeColorSchema.safeParse({ ...validData, key: "BLUE-500" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("blue-500");
      }
    });

    it("debe rechazar bgClass que no empieza con bg- ni contiene background", () => {
      const result = badgeColorSchema.safeParse({ ...validData, bgClass: "text-blue-500" });
      expect(result.success).toBe(false);
    });

    it("debe aceptar bgClass con 'background'", () => {
      const result = badgeColorSchema.safeParse({ ...validData, bgClass: "background-blue" });
      expect(result.success).toBe(true);
    });
  });

  describe("formValuesToPayload", () => {
    it("debe transformar form values a payload con defaults", () => {
      const parsed = badgeColorSchema.parse(validData);
      const payload = formValuesToPayload(parsed);
      expect(payload.textClass).toBe("text-white");
      expect(payload.order).toBe(0);
      expect(payload.isActive).toBe(true);
    });
  });

  describe("badgeColorToFormValues", () => {
    it("debe extraer solo campos del schema", () => {
      const badgeColor: BadgeColor = {
        id: "abc",
        name: "Azul",
        key: "blue-500",
        bgClass: "bg-blue-500",
        textClass: "text-white",
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const values = badgeColorToFormValues(badgeColor);
      expect(values).not.toHaveProperty("id");
      expect(values.name).toBe("Azul");
    });
  });
});
