import { describe, it, expect } from "vitest";
import { customerSchema } from "../customer-validations";

const validData = {
  rut: "12.345.678-5",
  razonSocial: "Empresa Demo SpA",
  tradeName: "Demo",
  businessActivity: "Servicios",
  contact: "Juan Pérez",
  phone: "+56912345678",
  email: "contacto@demo.cl",
  street: "Av. Principal 123",
  apartment: "Of. 401",
  region: "Región Metropolitana",
  comuna: "Santiago",
};

describe("customerSchema", () => {
  it("debe validar datos completos válidos", () => {
    const result = customerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("debe rechazar RUT con dígito verificador incorrecto", () => {
    const result = customerSchema.safeParse({ ...validData, rut: "12.345.678-0" });
    expect(result.success).toBe(false);
  });

  it("debe rechazar razonSocial con menos de 2 caracteres", () => {
    const result = customerSchema.safeParse({ ...validData, razonSocial: "A" });
    expect(result.success).toBe(false);
  });

  it("debe aceptar campos opcionales vacíos", () => {
    const result = customerSchema.safeParse({
      ...validData,
      tradeName: "",
      businessActivity: "",
      email: "",
      apartment: "",
    });
    expect(result.success).toBe(true);
  });

  it("debe rechazar email inválido cuando se proporciona", () => {
    const result = customerSchema.safeParse({ ...validData, email: "no-email" });
    expect(result.success).toBe(false);
  });

  it("debe rechazar street con menos de 3 caracteres", () => {
    const result = customerSchema.safeParse({ ...validData, street: "AB" });
    expect(result.success).toBe(false);
  });
});
