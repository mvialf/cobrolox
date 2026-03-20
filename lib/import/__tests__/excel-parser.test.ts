import { describe, it, expect } from "vitest";
import { isNotEmpty, parseDecimal, parseDate } from "../excel-parser";

describe("excel-parser", () => {
  // ═══════════════════════════════════════════════════════════════
  // isNotEmpty
  // ═══════════════════════════════════════════════════════════════
  describe("isNotEmpty", () => {
    it("debe retornar false para null", () => {
      expect(isNotEmpty(null)).toBe(false);
    });

    it("debe retornar false para undefined", () => {
      expect(isNotEmpty(undefined)).toBe(false);
    });

    it("debe retornar false para string vacío", () => {
      expect(isNotEmpty("")).toBe(false);
    });

    it("debe retornar false para string de solo espacios", () => {
      expect(isNotEmpty("   ")).toBe(false);
    });

    it("debe retornar true para string con contenido", () => {
      expect(isNotEmpty("hola")).toBe(true);
    });

    it("debe retornar true para número 0", () => {
      expect(isNotEmpty(0)).toBe(true);
    });

    it("debe retornar true para boolean false", () => {
      expect(isNotEmpty(false)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // parseDecimal
  // ═══════════════════════════════════════════════════════════════
  describe("parseDecimal", () => {
    it("debe retornar null para string vacío", () => {
      expect(parseDecimal("")).toBeNull();
    });

    it("debe retornar null para string de solo espacios", () => {
      expect(parseDecimal("   ")).toBeNull();
    });

    it("debe parsear número simple", () => {
      expect(parseDecimal("1000")).toBe(1000);
    });

    it("debe parsear número con separador de miles (punto) y decimal (coma)", () => {
      // Formato chileno: 1.000.000,50
      expect(parseDecimal("1.000.000,50")).toBe(1000000.5);
    });

    it("debe parsear número con coma decimal sin separador de miles", () => {
      expect(parseDecimal("100,5")).toBe(100.5);
    });

    it("debe retornar null para texto no numérico", () => {
      expect(parseDecimal("abc")).toBeNull();
    });

    it("debe parsear números negativos", () => {
      expect(parseDecimal("-500")).toBe(-500);
    });

    it("debe parsear número con decimales", () => {
      expect(parseDecimal("19000,00")).toBe(19000);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // parseDate
  // ═══════════════════════════════════════════════════════════════
  describe("parseDate", () => {
    it("debe retornar null para valor vacío", () => {
      expect(parseDate("")).toBeNull();
    });

    it("debe retornar null para string de solo espacios", () => {
      expect(parseDate("   ")).toBeNull();
    });

    // @ts-expect-error - testear valor null/falsy
    it("debe retornar null para null", () => {
      expect(parseDate(null as unknown as string)).toBeNull();
    });

    it("debe parsear formato DD/MM/YYYY (chileno)", () => {
      const date = parseDate("15/01/2025");
      expect(date).toBeInstanceOf(Date);
      expect(date!.getDate()).toBe(15);
      expect(date!.getMonth()).toBe(0); // enero
      expect(date!.getFullYear()).toBe(2025);
    });

    it("debe parsear formato MM/DD/YY (Excel americano)", () => {
      const date = parseDate("1/15/25");
      expect(date).toBeInstanceOf(Date);
      expect(date!.getMonth()).toBe(0); // enero
      expect(date!.getDate()).toBe(15);
      expect(date!.getFullYear()).toBe(2025);
    });

    it("debe manejar año de 2 dígitos >= 50 como 19XX", () => {
      const date = parseDate("1/15/99");
      expect(date!.getFullYear()).toBe(1999);
    });

    it("debe manejar año de 2 dígitos < 50 como 20XX", () => {
      const date = parseDate("1/15/25");
      expect(date!.getFullYear()).toBe(2025);
    });

    it("debe aceptar Date object válido", () => {
      const input = new Date(2025, 0, 15);
      const result = parseDate(input);
      expect(result).toEqual(input);
    });

    it("debe retornar null para Date object inválido", () => {
      const invalidDate = new Date("invalid");
      expect(parseDate(invalidDate)).toBeNull();
    });

    it("debe parsear formato ISO", () => {
      const date = parseDate("2025-01-15");
      expect(date).toBeInstanceOf(Date);
      expect(date!.getFullYear()).toBe(2025);
    });

    it("debe retornar null para texto no parseable", () => {
      expect(parseDate("no-es-fecha")).toBeNull();
    });
  });
});
