import { describe, it, expect } from "vitest";
import { calculateInvoiceBalance } from "../invoice-balance";

describe("calculateInvoiceBalance", () => {
  it("factura sin allocations → balance = total", () => {
    const result = calculateInvoiceBalance({
      total: 500000,
      allocations: [],
    });
    expect(result).toBe(500000);
  });

  it("factura con 1 allocation → balance = total - allocated", () => {
    const result = calculateInvoiceBalance({
      total: 500000,
      allocations: [{ allocatedAmount: 200000 }],
    });
    expect(result).toBe(300000);
  });

  it("factura con múltiples allocations → balance = total - sum(allocated)", () => {
    const result = calculateInvoiceBalance({
      total: 1000000,
      allocations: [
        { allocatedAmount: 300000 },
        { allocatedAmount: 250000 },
        { allocatedAmount: 150000 },
      ],
    });
    expect(result).toBe(300000);
  });

  it("factura con allocations que cubren todo → balance = 0", () => {
    const result = calculateInvoiceBalance({
      total: 500000,
      allocations: [
        { allocatedAmount: 300000 },
        { allocatedAmount: 200000 },
      ],
    });
    expect(result).toBe(0);
  });

  it("valores como strings (Decimal de Prisma) → conversión correcta", () => {
    const result = calculateInvoiceBalance({
      total: "500000" as unknown as number,
      allocations: [
        { allocatedAmount: "200000" as unknown as number },
        { allocatedAmount: "100000" as unknown as number },
      ],
    });
    expect(result).toBe(200000);
  });
});
