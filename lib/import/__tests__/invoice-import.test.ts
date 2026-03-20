import { describe, it, expect } from "vitest";
import {
  validateInvoiceRow,
  validateInvoiceBatch,
  type InvoiceCSVRow,
} from "../invoice-import";

// Fila válida base para reusar en tests
const validRow: InvoiceCSVRow = {
  invoiceNumber: "F-001",
  customerRut: "12.345.678-5",
  subtotal: "100000",
  taxAmount: "",
  issueDate: "01/01/2025",
  dueDate: "31/01/2025",
  notes: "Nota de prueba",
};

describe("invoice-import", () => {
  // ═══════════════════════════════════════════════════════════════
  // validateInvoiceRow
  // ═══════════════════════════════════════════════════════════════
  describe("validateInvoiceRow", () => {
    it("debe validar fila completa válida", () => {
      const result = validateInvoiceRow(validRow, 2);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toBeDefined();
      expect(result.data!.invoiceNumber).toBe("F-001");
      expect(result.data!.subtotal).toBe(100000);
      expect(result.data!.currency).toBe("CLP");
    });

    it("debe calcular IVA automáticamente cuando taxAmount está vacío", () => {
      const result = validateInvoiceRow(validRow, 2);
      expect(result.isValid).toBe(true);
      // 19% de 100000 = 19000
      expect(result.data!.taxAmount).toBe(19000);
      expect(result.data!.total).toBe(119000);
    });

    it("debe aceptar factura exenta (taxAmount = 0)", () => {
      const exemptRow = { ...validRow, taxAmount: "0" };
      const result = validateInvoiceRow(exemptRow, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.taxAmount).toBe(0);
      expect(result.data!.total).toBe(100000);
    });

    it("debe aceptar IVA correcto (19%)", () => {
      const withTax = { ...validRow, taxAmount: "19000" };
      const result = validateInvoiceRow(withTax, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.taxAmount).toBe(19000);
    });

    it("debe rechazar IVA incorrecto (ni 0 ni 19%)", () => {
      const badTax = { ...validRow, taxAmount: "5000" };
      const result = validateInvoiceRow(badTax, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "taxAmount")).toBe(true);
    });

    // --- Campos requeridos ---

    it("debe rechazar invoiceNumber vacío", () => {
      const row = { ...validRow, invoiceNumber: "" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "invoiceNumber")).toBe(true);
    });

    it("debe rechazar customerRut vacío", () => {
      const row = { ...validRow, customerRut: "" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "customerRut")).toBe(true);
    });

    it("debe rechazar subtotal no numérico", () => {
      const row = { ...validRow, subtotal: "abc" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "subtotal")).toBe(true);
    });

    it("debe rechazar subtotal <= 0", () => {
      const row = { ...validRow, subtotal: "-100" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "subtotal")).toBe(true);
    });

    // --- Fechas ---

    it("debe rechazar issueDate inválida", () => {
      const row = { ...validRow, issueDate: "no-fecha" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "issueDate")).toBe(true);
    });

    it("debe rechazar dueDate inválida", () => {
      const row = { ...validRow, dueDate: "no-fecha" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "dueDate")).toBe(true);
    });

    it("debe rechazar dueDate anterior a issueDate", () => {
      const row = { ...validRow, issueDate: "15/01/2025", dueDate: "01/01/2025" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "dueDate")).toBe(true);
    });

    // --- RUT ---

    it("debe rechazar RUT inválido", () => {
      const row = { ...validRow, customerRut: "12.345.678-0" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "customerRut")).toBe(true);
    });

    // --- Opcionales ---

    it("debe usar CLP como currency por defecto", () => {
      const row = { ...validRow, currency: undefined };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.currency).toBe("CLP");
    });

    it("debe manejar notes vacíos como null", () => {
      const row = { ...validRow, notes: "" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(true);
      expect(result.data!.notes).toBeNull();
    });

    it("debe rechazar taxAmount negativo", () => {
      const row = { ...validRow, taxAmount: "-100" };
      const result = validateInvoiceRow(row, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "taxAmount")).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // validateInvoiceBatch
  // ═══════════════════════════════════════════════════════════════
  describe("validateInvoiceBatch", () => {
    it("debe procesar lote vacío", () => {
      const result = validateInvoiceBatch([]);
      expect(result.validInvoices).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });

    it("debe procesar lote con todas las filas válidas", () => {
      const rows = [validRow, { ...validRow, invoiceNumber: "F-002" }];
      const result = validateInvoiceBatch(rows);
      expect(result.validInvoices).toHaveLength(2);
      expect(result.summary.valid).toBe(2);
      expect(result.summary.invalid).toBe(0);
    });

    it("debe separar filas válidas e inválidas", () => {
      const rows = [
        validRow,
        { ...validRow, invoiceNumber: "", subtotal: "" }, // inválida
      ];
      const result = validateInvoiceBatch(rows);
      expect(result.validInvoices).toHaveLength(1);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("debe usar rowIndex +2 (header en fila 1)", () => {
      const rows = [{ ...validRow, invoiceNumber: "" }];
      const result = validateInvoiceBatch(rows);
      // La primera fila de datos es row index 2
      expect(result.errors[0].row).toBe(2);
    });
  });
});
