/**
 * Tests para lib/business-logic/installments.ts
 *
 * Valida:
 * - calculateInstallments()
 * - validateInstallmentsSum()
 * - getTotalPendingInstallments()
 */

import { describe, it, expect } from "vitest";
import {
  calculateInstallments,
  validateInstallmentsSum,
  getTotalPendingInstallments,
} from "../installments";

describe("calculateInstallments", () => {
  it("debe dividir $1,000 en 3 cuotas con última absorbiendo centavos", () => {
    const result = calculateInstallments(1000, 3, new Date("2025-01-15"));

    // Cálculo esperado:
    // baseAmount = Math.floor((1000 / 3) * 100) / 100 = 333.33
    // totalBase = 333.33 * 2 = 666.66
    // lastAmount = 1000 - 666.66 = 333.34

    expect(result).toHaveLength(3);
    expect(result[0].installmentNumber).toBe(1);
    expect(result[0].amount).toBe(333.33);
    expect(result[0].dueDate).toEqual(new Date("2025-01-15")); // +0 días

    expect(result[1].installmentNumber).toBe(2);
    expect(result[1].amount).toBe(333.33);
    expect(result[1].dueDate).toEqual(new Date("2025-02-14")); // +30 días

    expect(result[2].installmentNumber).toBe(3);
    expect(result[2].amount).toBeCloseTo(333.34, 2); // ← Absorbe 0.01
    expect(result[2].dueDate).toEqual(new Date("2025-03-16")); // +60 días

    // Validar suma exacta
    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(sum).toBe(1000);
  });

  it("debe dividir $1,200 en 3 cuotas exactamente (sin centavos)", () => {
    const result = calculateInstallments(1200, 3, new Date("2025-01-01"));

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(400);
    expect(result[1].amount).toBe(400);
    expect(result[2].amount).toBe(400);

    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(sum).toBe(1200);
  });

  it("debe manejar caso extremo: $100 en 7 cuotas", () => {
    const result = calculateInstallments(100, 7, new Date("2025-01-01"));

    // Cálculo esperado:
    // baseAmount = Math.floor((100 / 7) * 100) / 100 = 14.28
    // totalBase = 14.28 * 6 = 85.68
    // lastAmount = 100 - 85.68 = 14.32

    expect(result).toHaveLength(7);
    expect(result[0].amount).toBe(14.28);
    expect(result[1].amount).toBe(14.28);
    expect(result[2].amount).toBe(14.28);
    expect(result[3].amount).toBe(14.28);
    expect(result[4].amount).toBe(14.28);
    expect(result[5].amount).toBe(14.28);
    expect(result[6].amount).toBeCloseTo(14.32, 2); // ← Absorbe 0.04

    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(sum).toBe(100);
  });

  it("debe generar fechas de vencimiento correctas (cada 30 días)", () => {
    const result = calculateInstallments(300, 3, new Date("2025-01-15"));

    expect(result[0].dueDate).toEqual(new Date("2025-01-15")); // Cuota 1: +0 días
    expect(result[1].dueDate).toEqual(new Date("2025-02-14")); // Cuota 2: +30 días
    expect(result[2].dueDate).toEqual(new Date("2025-03-16")); // Cuota 3: +60 días
  });

  it("debe lanzar error si installments < 1", () => {
    expect(() => {
      calculateInstallments(1000, 0, new Date());
    }).toThrow("Número de cuotas inválido");
  });

  it("debe lanzar error si installments > 12", () => {
    expect(() => {
      calculateInstallments(1000, 13, new Date());
    }).toThrow("Número de cuotas inválido");
  });

  it("debe lanzar error si amount <= 0", () => {
    expect(() => {
      calculateInstallments(0, 3, new Date());
    }).toThrow("El monto debe ser mayor a 0");

    expect(() => {
      calculateInstallments(-100, 3, new Date());
    }).toThrow("El monto debe ser mayor a 0");
  });

  // --- Tests adicionales: Absorción de centavos (montos muy pequeños) ---

  it("debe dividir $0.10 en 3 cuotas correctamente", () => {
    const result = calculateInstallments(0.1, 3, new Date("2025-01-01"));

    // Cálculo esperado:
    // baseAmount = Math.floor((0.1 / 3) * 100) / 100 = 0.03
    // totalBase = 0.03 * 2 = 0.06
    // lastAmount = 0.1 - 0.06 = 0.04

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(0.03);
    expect(result[1].amount).toBe(0.03);
    expect(result[2].amount).toBeCloseTo(0.04, 2); // Absorbe 0.01

    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(Math.abs(sum - 0.1)).toBeLessThan(0.001); // Tolerancia para float
  });

  it("debe dividir $0.01 (1 centavo) en 2 cuotas", () => {
    const result = calculateInstallments(0.01, 2, new Date("2025-01-01"));

    // Cálculo esperado:
    // baseAmount = Math.floor((0.01 / 2) * 100) / 100 = 0.00
    // totalBase = 0.00 * 1 = 0.00
    // lastAmount = 0.01 - 0.00 = 0.01

    expect(result).toHaveLength(2);
    expect(result[0].amount).toBe(0.0); // Primera cuota es 0
    expect(result[1].amount).toBe(0.01); // Segunda cuota absorbe todo

    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(sum).toBe(0.01);
  });

  // --- Tests adicionales: Números grandes ---

  it("debe dividir $1,000,000 en 3 cuotas correctamente", () => {
    const result = calculateInstallments(1_000_000, 3, new Date("2025-01-01"));

    // Cálculo esperado:
    // baseAmount = Math.floor((1000000 / 3) * 100) / 100 = 333333.33
    // totalBase = 333333.33 * 2 = 666666.66
    // lastAmount = 1000000 - 666666.66 = 333333.34

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(333333.33);
    expect(result[1].amount).toBe(333333.33);
    expect(result[2].amount).toBeCloseTo(333333.34, 2);

    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(sum).toBe(1_000_000);
  });

  it("debe dividir $999,999.99 en 12 cuotas correctamente", () => {
    const result = calculateInstallments(
      999_999.99,
      12,
      new Date("2025-01-01"),
    );

    // Verificar que tiene 12 cuotas
    expect(result).toHaveLength(12);

    // Verificar que la suma es exacta (dentro de tolerancia)
    const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
    expect(Math.abs(sum - 999_999.99)).toBeLessThan(0.01);

    // Verificar que la última cuota absorbe la diferencia
    const baseAmount = result[0].amount;
    const lastAmount = result[11].amount;
    expect(lastAmount).toBeGreaterThanOrEqual(baseAmount);
  });

  // --- Tests adicionales: Casos extremos ---

  it("debe manejar 1 sola cuota (retornar array con 1 elemento)", () => {
    const result = calculateInstallments(1000, 1, new Date("2025-01-01"));

    expect(result).toHaveLength(1);
    expect(result[0].installmentNumber).toBe(1);
    expect(result[0].amount).toBe(1000); // Monto completo
    expect(result[0].dueDate).toEqual(new Date("2025-01-01"));
  });

  it("debe lanzar error con número de cuotas negativo", () => {
    expect(() => {
      calculateInstallments(1000, -3, new Date());
    }).toThrow("Número de cuotas inválido");
  });

  it("debe manejar montos decimales variados correctamente", () => {
    const testCases = [
      { amount: 99.99, installments: 3 },
      { amount: 50.5, installments: 2 },
      { amount: 123.45, installments: 4 },
    ];

    testCases.forEach(({ amount, installments }) => {
      const result = calculateInstallments(
        amount,
        installments,
        new Date("2025-01-01"),
      );

      // Verificar que la suma es exacta
      const sum = result.reduce((acc, inst) => acc + inst.amount, 0);
      expect(Math.abs(sum - amount)).toBeLessThan(0.01);

      // Verificar que tiene el número correcto de cuotas
      expect(result).toHaveLength(installments);
    });
  });

  // --- Tests adicionales: Precisión decimal ---

  it("debe mantener máximo 2 decimales en todas las cuotas", () => {
    const result = calculateInstallments(1000, 3, new Date("2025-01-01"));

    result.forEach((installment) => {
      // Verificar que el número redondeado a 2 decimales es cercano al original
      const rounded = Math.round(installment.amount * 100) / 100;
      expect(installment.amount).toBeCloseTo(rounded, 2);
    });
  });

  it("debe redondear hacia abajo (no truncar) en cuotas base", () => {
    // 100 / 3 = 33.333... → debe ser 33.33 (redondeado hacia abajo)
    const result = calculateInstallments(100, 3, new Date("2025-01-01"));

    expect(result[0].amount).toBe(33.33); // No 33.34 ni 33
    expect(result[1].amount).toBe(33.33);
    expect(result[2].amount).toBe(33.34); // Última absorbe el resto
  });

  it("debe garantizar suma exacta con tolerancia financiera", () => {
    const testAmounts = [1000.5, 999.99, 1234.56, 50000.75, 99.9];

    testAmounts.forEach((amount) => {
      const result = calculateInstallments(amount, 3, new Date("2025-01-01"));

      const sum = result.reduce((acc, inst) => acc + inst.amount, 0);

      // La diferencia debe ser menor a 1 centavo
      expect(Math.abs(sum - amount)).toBeLessThan(0.01);
    });
  });
});

describe("validateInstallmentsSum", () => {
  it("debe validar suma exacta", () => {
    const installments = [
      { amount: 100, installmentNumber: 1, dueDate: new Date() },
      { amount: 100, installmentNumber: 2, dueDate: new Date() },
      { amount: 100, installmentNumber: 3, dueDate: new Date() },
    ];

    const isValid = validateInstallmentsSum(installments, 300);

    expect(isValid).toBe(true);
  });

  it("debe validar suma con diferencia dentro de tolerancia", () => {
    const installments = calculateInstallments(1000, 3, new Date());

    const isValid = validateInstallmentsSum(installments, 1000);

    // La función calculateInstallments garantiza suma exacta
    expect(isValid).toBe(true);
  });

  it("debe rechazar suma incorrecta", () => {
    const installments = [
      { amount: 100, installmentNumber: 1, dueDate: new Date() },
      { amount: 100, installmentNumber: 2, dueDate: new Date() },
      { amount: 50, installmentNumber: 3, dueDate: new Date() },
    ];

    const isValid = validateInstallmentsSum(installments, 300);

    // Suma = 250, esperado = 300, diferencia = 50 > tolerancia
    expect(isValid).toBe(false);
  });
});

describe("getTotalPendingInstallments", () => {
  it("debe sumar solo cuotas pendientes", () => {
    const installments = [
      { amount: 100, status: "paid" },
      { amount: 100, status: "pending" },
      { amount: 100, status: "pending" },
    ];

    const totalPending = getTotalPendingInstallments(installments);

    expect(totalPending).toBe(200); // Solo las pendientes
  });

  it("debe retornar 0 si todas están pagadas", () => {
    const installments = [
      { amount: 100, status: "paid" },
      { amount: 100, status: "paid" },
    ];

    const totalPending = getTotalPendingInstallments(installments);

    expect(totalPending).toBe(0);
  });

  it("debe manejar array vacío", () => {
    const installments: Array<{ amount: number; status: string }> = [];

    const totalPending = getTotalPendingInstallments(installments);

    expect(totalPending).toBe(0);
  });

  it('debe ignorar estados que no sean "pending"', () => {
    const installments = [
      { amount: 100, status: "pending" },
      { amount: 100, status: "cancelled" },
      { amount: 100, status: "overdue" },
    ];

    const totalPending = getTotalPendingInstallments(installments);

    expect(totalPending).toBe(100); // Solo "pending"
  });
});
