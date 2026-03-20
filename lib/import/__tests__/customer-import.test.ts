import { describe, it, expect } from "vitest";
import {
  validateCustomerRow,
  validateCustomerBatch,
  type CustomerCSVRow,
} from "../customer-import";

// Fila válida base
const validRow: CustomerCSVRow = {
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

describe("customer-import", () => {
  // ═══════════════════════════════════════════════════════════════
  // validateCustomerRow
  // ═══════════════════════════════════════════════════════════════
  describe("validateCustomerRow", () => {
    it("debe validar fila completa válida", () => {
      const result = validateCustomerRow(validRow, 2);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
      expect(result.data!.razonSocial).toBe("Empresa Demo SpA");
    });

    it("debe formatear el RUT correctamente", () => {
      const row = { ...validRow, rut: "123456785" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.rut).toMatch(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/);
    });

    // --- Campos requeridos ---

    it("debe rechazar rut vacío", () => {
      const row = { ...validRow, rut: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "rut")).toBe(true);
    });

    it("debe rechazar razonSocial vacía", () => {
      const row = { ...validRow, razonSocial: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "razonSocial")).toBe(true);
    });

    it("debe rechazar contact vacío", () => {
      const row = { ...validRow, contact: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "contact")).toBe(true);
    });

    it("debe rechazar phone vacío", () => {
      const row = { ...validRow, phone: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "phone")).toBe(true);
    });

    it("debe rechazar street vacía", () => {
      const row = { ...validRow, street: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "street")).toBe(true);
    });

    it("debe rechazar region vacía", () => {
      const row = { ...validRow, region: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "region")).toBe(true);
    });

    it("debe rechazar comuna vacía", () => {
      const row = { ...validRow, comuna: "" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "comuna")).toBe(true);
    });

    // --- Opcionales ---

    it("debe manejar campos opcionales vacíos", () => {
      const row = {
        ...validRow,
        tradeName: "",
        businessActivity: "",
        email: "",
        apartment: "",
      };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.tradeName).toBeNull();
      expect(result.data!.businessActivity).toBeNull();
      expect(result.data!.email).toBeNull();
      expect(result.data!.apartment).toBeNull();
    });

    // --- RUT inválido (pasa required pero falla validación Zod) ---

    it("debe rechazar RUT con dígito verificador incorrecto", () => {
      const row = { ...validRow, rut: "12.345.678-0" };
      const result = validateCustomerRow(row, 2);
      expect(result.isValid).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // validateCustomerBatch
  // ═══════════════════════════════════════════════════════════════
  describe("validateCustomerBatch", () => {
    it("debe procesar lote vacío", () => {
      const result = validateCustomerBatch([]);
      expect(result.validCustomers).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });

    it("debe procesar lote con todas las filas válidas", () => {
      const rows = [validRow, { ...validRow, rut: "76.086.428-5" }];
      const result = validateCustomerBatch(rows);
      expect(result.validCustomers).toHaveLength(2);
      expect(result.summary.valid).toBe(2);
      expect(result.summary.invalid).toBe(0);
    });

    it("debe separar filas válidas e inválidas", () => {
      const rows = [
        validRow,
        { ...validRow, rut: "", razonSocial: "" }, // inválida
      ];
      const result = validateCustomerBatch(rows);
      expect(result.validCustomers).toHaveLength(1);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("debe usar rowIndex +2 (header en fila 1)", () => {
      const rows = [{ ...validRow, rut: "" }];
      const result = validateCustomerBatch(rows);
      expect(result.errors[0].row).toBe(2);
    });
  });
});
