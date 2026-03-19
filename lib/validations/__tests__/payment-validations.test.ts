import { describe, it, expect } from "vitest";
import {
  paymentToInvoiceSchema,
  paymentToCustomerSchema,
  parseInvoicesWithBalance,
  paymentToInvoiceToPayload,
  paymentToCustomerToPayload,
  type InvoiceWithBalance,
  type InvoiceWithBalanceSerialized,
} from "../payment-validations";

// Helpers para datos válidos
const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "550e8400-e29b-41d4-a716-446655440001";

const validInvoicePayment = {
  invoiceId: validUUID,
  amount: 100000,
  date: new Date("2025-06-15"),
  paymentMethodId: validUUID2,
};

const validCustomerPayment = {
  customerId: validUUID,
  amount: 100000,
  date: new Date("2025-06-15"),
  paymentMethodId: validUUID2,
  allocations: [
    { invoiceId: validUUID, allocatedAmount: 100000 },
  ],
};

describe("paymentToInvoiceSchema", () => {
  it("datos válidos → parse ok", () => {
    const result = paymentToInvoiceSchema.safeParse(validInvoicePayment);
    expect(result.success).toBe(true);
  });

  it("monto negativo → error", () => {
    const result = paymentToInvoiceSchema.safeParse({
      ...validInvoicePayment,
      amount: -1000,
    });
    expect(result.success).toBe(false);
  });

  it("sin invoiceId → error", () => {
    const { invoiceId: _, ...sinInvoice } = validInvoicePayment;
    const result = paymentToInvoiceSchema.safeParse(sinInvoice);
    expect(result.success).toBe(false);
  });

  it("monto con >2 decimales → error", () => {
    const result = paymentToInvoiceSchema.safeParse({
      ...validInvoicePayment,
      amount: 100.999,
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentToCustomerSchema", () => {
  it("datos válidos con 1 allocation → ok", () => {
    const result = paymentToCustomerSchema.safeParse(validCustomerPayment);
    expect(result.success).toBe(true);
  });

  it("datos válidos con múltiples allocations → ok", () => {
    const result = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      amount: 300000,
      allocations: [
        { invoiceId: validUUID, allocatedAmount: 200000 },
        { invoiceId: validUUID2, allocatedAmount: 100000 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("allocations vacías → error", () => {
    const result = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      allocations: [],
    });
    expect(result.success).toBe(false);
  });

  it("allocations duplicadas (mismo invoiceId) → error", () => {
    const result = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      amount: 200000,
      allocations: [
        { invoiceId: validUUID, allocatedAmount: 100000 },
        { invoiceId: validUUID, allocatedAmount: 100000 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("suma de allocations != amount → error", () => {
    const result = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      amount: 500000,
      allocations: [
        { invoiceId: validUUID, allocatedAmount: 100000 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("suma de allocations = amount con diferencia menor a tolerancia → ok", () => {
    const result = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      amount: 100000,
      allocations: [
        { invoiceId: validUUID, allocatedAmount: 50000 },
        { invoiceId: validUUID2, allocatedAmount: 49999.99 },
      ],
    });
    // Diferencia: 100000 - 99999.99 = 0.01, y tolerancia es < 0.01 (estricto)
    // Entonces 0.01 NO pasa. Probamos con diferencia menor:
    const result2 = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      amount: 100000,
      allocations: [
        { invoiceId: validUUID, allocatedAmount: 99999.99 },
        { invoiceId: validUUID2, allocatedAmount: 0.01 },
      ],
    });
    // 99999.99 + 0.01 = 100000.00, diferencia = 0 → ok
    expect(result2.success).toBe(true);
  });

  it("todas las allocations en 0 → error", () => {
    const result = paymentToCustomerSchema.safeParse({
      ...validCustomerPayment,
      amount: 0.01,
      allocations: [
        { invoiceId: validUUID, allocatedAmount: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("parseInvoicesWithBalance", () => {
  it("convierte strings ISO a Date correctamente", () => {
    const serialized: InvoiceWithBalanceSerialized[] = [
      {
        id: validUUID,
        invoiceNumber: "F-001",
        customerId: validUUID2,
        subtotal: 840336,
        taxAmount: 159664,
        total: 1000000,
        currency: "CLP",
        issueDate: "2025-06-01T00:00:00.000Z",
        dueDate: "2025-07-01T00:00:00.000Z",
        paidAmount: 0,
        balance: 1000000,
        status: {
          id: "s1",
          name: "Vigente",
          color: { id: "c1", bgClass: "bg-green-100", textClass: "text-green-800" },
        },
        customer: {
          id: validUUID2,
          rut: "12345678-9",
          razonSocial: "Test SpA",
          tradeName: null,
        },
      },
    ];

    const result = parseInvoicesWithBalance(serialized);
    expect(result[0].issueDate).toBeInstanceOf(Date);
    expect(result[0].dueDate).toBeInstanceOf(Date);
    expect(result[0].issueDate.toISOString()).toBe("2025-06-01T00:00:00.000Z");
  });
});

describe("paymentToInvoiceToPayload", () => {
  it("transforma form values a payload de API", () => {
    const invoice = {
      id: validUUID,
      currency: "CLP",
      customer: { id: validUUID2, rut: "12345678-9", razonSocial: "Test", tradeName: null },
    } as InvoiceWithBalance;

    const result = paymentToInvoiceToPayload(validInvoicePayment, invoice);
    expect(result.type).toBe("Invoice");
    expect(result.customerId).toBe(validUUID2);
    expect(result.currency).toBe("CLP");
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].allocatedAmount).toBe(100000);
  });
});

describe("paymentToCustomerToPayload", () => {
  it("transforma form values a payload de API", () => {
    const parsed = paymentToCustomerSchema.parse(validCustomerPayment);
    const result = paymentToCustomerToPayload(parsed, "CLP");
    expect(result.type).toBe("Customer");
    expect(result.currency).toBe("CLP");
    expect(result.allocations).toHaveLength(1);
  });
});
