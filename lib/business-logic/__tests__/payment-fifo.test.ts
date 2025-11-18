/**
 * Tests para lib/business-logic/payment-fifo.ts
 *
 * Valida:
 * - calculateFIFO()
 * - validateAllocationsSum()
 * - filterInvoicesWithBalance()
 */

import { describe, it, expect } from "vitest";
import {
  calculateFIFO,
  validateAllocationsSum,
  filterInvoicesWithBalance,
} from "../payment-fifo";
import type { InvoiceWithBalance } from "@/lib/validations/payment-validations";

describe("calculateFIFO", () => {
  it("debe distribuir pago entre facturas ordenados por vencimiento (FEFO)", () => {
    const invoices: InvoiceWithBalance[] = [
      {
        id: "P3",
        invoiceNumber: "2024-003",
        customerId: "C1",
        subtotal: 420168,
        taxAmount: 79832,
        total: 500000,
        currency: "CLP",
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-04-01"),
        paidAmount: 300000,
        balance: 200000, // total - paidAmount
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
      {
        id: "P1",
        invoiceNumber: "2024-001",
        customerId: "C1",
        subtotal: 840336,
        taxAmount: 159664,
        total: 1000000,
        currency: "CLP",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-02-01"),
        paidAmount: 700000,
        balance: 300000,
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
      {
        id: "P2",
        invoiceNumber: "2024-002",
        customerId: "C1",
        subtotal: 672269,
        taxAmount: 127731,
        total: 800000,
        currency: "CLP",
        issueDate: new Date("2024-02-01"),
        dueDate: new Date("2024-03-01"),
        paidAmount: 400000,
        balance: 400000,
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
    ];

    // Pago de $500,000 a distribuir
    const allocations = calculateFIFO(500000, invoices);

    // Resultado esperado (ordenado por vencimiento):
    // P1 (vence 2024-02-01): balance 300,000 → recibe 300,000 (cierra)
    // P2 (vence 2024-03-01): balance 400,000 → recibe 200,000 (abono parcial)
    // P3 (vence 2024-04-01): balance 200,000 → recibe $0 (se acabó el dinero)
    expect(allocations).toHaveLength(3);
    expect(allocations[0]).toEqual({
      invoiceId: "P1",
      invoiceNumber: "2024-001",
      // name removed "Proyecto 1",
      balance: 300000,
      allocatedAmount: 300000,
      isFullyPaid: true,
    });
    expect(allocations[1]).toEqual({
      invoiceId: "P2",
      invoiceNumber: "2024-002",
      // name removed "Proyecto 2",
      balance: 400000,
      allocatedAmount: 200000,
      isFullyPaid: false,
    });
    expect(allocations[2]).toEqual({
      invoiceId: "P3",
      invoiceNumber: "2024-003",
      balance: 200000,
      allocatedAmount: 0, // No recibe dinero
      isFullyPaid: false,
    });
  });

  it("debe manejar monto mayor que todos los balances", () => {
    const invoices: InvoiceWithBalance[] = [
      {
        id: "P1",
        invoiceNumber: "2024-001",
        customerId: "C1",
        subtotal: 420168,
        taxAmount: 79832,
        total: 500000,
        currency: "CLP",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-02-01"),
        paidAmount: 300000,
        balance: 200000, // total - paidAmount
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
    ];

    // Balance P1 = 200,000, pero pago es $500,000
    const allocations = calculateFIFO(500000, invoices);

    expect(allocations).toHaveLength(1);
    expect(allocations[0].allocatedAmount).toBe(200000); // Solo lo que necesita
    expect(allocations[0].isFullyPaid).toBe(true);
  });

  it("debe ignorar facturas ya pagados completamente", () => {
    const invoices: InvoiceWithBalance[] = [
      {
        id: "P1",
        invoiceNumber: "2024-001",
        customerId: "C1",
        subtotal: 840336,
        taxAmount: 159664,
        total: 1000000,
        currency: "CLP",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-02-01"),
        paidAmount: 1000000, // Factura pagada completamente
        balance: 0, // Balance = 0
        status: {
          id: "S1",
          name: "Completado",
          color: {
            id: "C1",
            bgClass: "bg-green-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
      {
        id: "P2",
        invoiceNumber: "2024-002",
        customerId: "C1",
        subtotal: 420168,
        taxAmount: 79832,
        total: 500000,
        currency: "CLP",
        issueDate: new Date("2024-02-01"),
        dueDate: new Date("2024-03-01"),
        paidAmount: 200000,
        balance: 300000, // total - paidAmount
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
    ];

    const allocations = calculateFIFO(500000, invoices);

    // P1 skip (balance 0), P2 recibe todo
    expect(allocations).toHaveLength(1);
    expect(allocations[0].invoiceId).toBe("P2");
    expect(allocations[0].allocatedAmount).toBe(300000);
  });

  it("debe retornar array vacío si no hay facturas", () => {
    const invoices: InvoiceWithBalance[] = [];

    const allocations = calculateFIFO(500000, invoices);

    expect(allocations).toEqual([]);
  });

  it("debe manejar pago exacto al balance total", () => {
    const invoices: InvoiceWithBalance[] = [
      {
        id: "P1",
        invoiceNumber: "2024-001",
        customerId: "C1",
        subtotal: 840336,
        taxAmount: 159664,
        total: 1000000,
        currency: "CLP",
        issueDate: new Date("2024-01-01"),
        dueDate: new Date("2024-02-01"),
        paidAmount: 500000,
        balance: 500000, // total - paidAmount
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
    ];

    // Pago exacto al balance
    const allocations = calculateFIFO(500000, invoices);

    expect(allocations).toHaveLength(1);
    expect(allocations[0].allocatedAmount).toBe(500000);
    expect(allocations[0].isFullyPaid).toBe(true);
  });
});

describe("validateAllocationsSum", () => {
  it("debe validar suma exacta", () => {
    const allocations = [{ allocatedAmount: 600 }, { allocatedAmount: 400 }];

    const isValid = validateAllocationsSum(1000, allocations);

    expect(isValid).toBe(true);
  });

  it("debe validar dentro de tolerancia (0.01)", () => {
    const allocations = [
      { allocatedAmount: 600.01 },
      { allocatedAmount: 399.99 },
    ];

    const isValid = validateAllocationsSum(1000, allocations);

    // Suma = 1000.00, tolerancia permite diferencia < 0.01
    expect(isValid).toBe(true);
  });

  it("debe rechazar diferencia significativa", () => {
    const allocations = [{ allocatedAmount: 600 }, { allocatedAmount: 350 }];

    const isValid = validateAllocationsSum(1000, allocations);

    // Suma = 950, diferencia = 50 > tolerancia
    expect(isValid).toBe(false);
  });
});

describe("filterInvoicesWithBalance", () => {
  it("debe retornar solo facturas con balance > 0", () => {
    const invoices: InvoiceWithBalance[] = [
      {
        id: "P1",
        invoiceNumber: "2024-001",
        customerId: "C1",
        subtotal: 840,
        taxAmount: 160,
        total: 1000,
        currency: "CLP",
        issueDate: new Date(),
        dueDate: new Date(),
        paidAmount: 500,
        balance: 500, // balance: 500
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
      {
        id: "P2",
        invoiceNumber: "2024-002",
        customerId: "C1",
        subtotal: 672,
        taxAmount: 128,
        total: 800,
        currency: "CLP",
        issueDate: new Date(),
        dueDate: new Date(),
        paidAmount: 800,
        balance: 0, // balance: 0
        status: {
          id: "S1",
          name: "Completado",
          color: {
            id: "C1",
            bgClass: "bg-green-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
      {
        id: "P3",
        invoiceNumber: "2024-003",
        customerId: "C1",
        subtotal: 1008,
        taxAmount: 192,
        total: 1200,
        currency: "CLP",
        issueDate: new Date(),
        dueDate: new Date(),
        paidAmount: 0,
        balance: 1200, // balance: 1200
        status: {
          id: "S1",
          name: "Pendiente",
          color: {
            id: "C1",
            bgClass: "bg-yellow-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
    ];

    const filtered = filterInvoicesWithBalance(invoices);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.id)).toEqual(["P1", "P3"]);
  });

  it("debe retornar array vacío si todos están pagados", () => {
    const invoices: InvoiceWithBalance[] = [
      {
        id: "P1",
        invoiceNumber: "2024-001",
        customerId: "C1",
        subtotal: 840,
        taxAmount: 160,
        total: 1000,
        currency: "CLP",
        issueDate: new Date(),
        dueDate: new Date(),
        paidAmount: 1000,
        balance: 0,
        status: {
          id: "S1",
          name: "Completado",
          color: {
            id: "C1",
            bgClass: "bg-green-500",
            textClass: "text-white",
          },
        },
        customer: { id: "C1", razonSocial: "Cliente Test" },
      },
    ];

    const filtered = filterInvoicesWithBalance(invoices);

    expect(filtered).toEqual([]);
  });
});
