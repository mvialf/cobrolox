import { describe, it, expect } from "vitest";
import {
  getRegiones,
  getRegionByCodigo,
  getComunasByRegion,
  getComunaByCodigo,
  getRegionByComuna,
  formatRegionForCombobox,
  formatComunaForCombobox,
} from "../regiones-chile";

describe("regiones-chile", () => {
  // ═══════════════════════════════════════════════════════════════
  // getRegiones
  // ═══════════════════════════════════════════════════════════════
  describe("getRegiones", () => {
    it("debe retornar todas las regiones de Chile (16)", () => {
      const regiones = getRegiones();
      expect(regiones.length).toBe(16);
    });

    it("debe tener estructura correcta", () => {
      const regiones = getRegiones();
      const primera = regiones[0];
      expect(primera).toHaveProperty("codigo");
      expect(primera).toHaveProperty("nombre");
      expect(primera).toHaveProperty("nombre_corto");
      expect(primera).toHaveProperty("numero_romano");
      expect(primera).toHaveProperty("comunas");
      expect(Array.isArray(primera.comunas)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getRegionByCodigo
  // ═══════════════════════════════════════════════════════════════
  describe("getRegionByCodigo", () => {
    it("debe encontrar región por código", () => {
      const region = getRegionByCodigo("13");
      expect(region).toBeDefined();
      expect(region!.nombre_corto).toBe("Metropolitana");
    });

    it("debe retornar undefined para código inexistente", () => {
      expect(getRegionByCodigo("99")).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getComunasByRegion
  // ═══════════════════════════════════════════════════════════════
  describe("getComunasByRegion", () => {
    it("debe retornar comunas de una región", () => {
      const comunas = getComunasByRegion("15"); // Arica y Parinacota
      expect(comunas.length).toBe(4);
      expect(comunas.some((c) => c.nombre === "Arica")).toBe(true);
    });

    it("debe retornar array vacío para región inexistente", () => {
      expect(getComunasByRegion("99")).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getComunaByCodigo
  // ═══════════════════════════════════════════════════════════════
  describe("getComunaByCodigo", () => {
    it("debe encontrar comuna por código", () => {
      const comuna = getComunaByCodigo("15101");
      expect(comuna).toBeDefined();
      expect(comuna!.nombre).toBe("Arica");
    });

    it("debe retornar undefined para código inexistente", () => {
      expect(getComunaByCodigo("99999")).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getRegionByComuna
  // ═══════════════════════════════════════════════════════════════
  describe("getRegionByComuna", () => {
    it("debe encontrar la región que contiene una comuna", () => {
      const region = getRegionByComuna("15101"); // Arica
      expect(region).toBeDefined();
      expect(region!.codigo).toBe("15");
    });

    it("debe retornar undefined para comuna inexistente", () => {
      expect(getRegionByComuna("99999")).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // formatRegionForCombobox
  // ═══════════════════════════════════════════════════════════════
  describe("formatRegionForCombobox", () => {
    it("debe formatear región con value=codigo y label=nombre_corto", () => {
      const region = getRegionByCodigo("15")!;
      const formatted = formatRegionForCombobox(region);
      expect(formatted).toEqual({
        value: "15",
        label: "Arica y Parinacota",
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // formatComunaForCombobox
  // ═══════════════════════════════════════════════════════════════
  describe("formatComunaForCombobox", () => {
    it("debe formatear comuna con value=codigo y label=nombre", () => {
      const formatted = formatComunaForCombobox({
        codigo: "15101",
        nombre: "Arica",
      });
      expect(formatted).toEqual({
        value: "15101",
        label: "Arica",
      });
    });
  });
});
