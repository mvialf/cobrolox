import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateInvoiceStatuses,
  hasStatusChanged,
  getInvoiceStatus,
  getPaymentStatus,
  type AvailableStatuses,
} from "../invoice-status";

// Mock de estados disponibles del sistema
const mockStatuses: AvailableStatuses = {
  invoice: {
    current: { id: "inv-1", name: "Vigente" } as AvailableStatuses["invoice"]["current"],
    overdue: { id: "inv-2", name: "Vencida" } as AvailableStatuses["invoice"]["overdue"],
    completed: { id: "inv-3", name: "Completada" } as AvailableStatuses["invoice"]["completed"],
  },
  payment: {
    pending: { id: "pay-1", name: "Pago Pendiente" } as AvailableStatuses["payment"]["pending"],
    partial: { id: "pay-2", name: "Pago Parcial" } as AvailableStatuses["payment"]["partial"],
    paid: { id: "pay-3", name: "Pagada" } as AvailableStatuses["payment"]["paid"],
  },
};

describe("invoice-status", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateInvoiceStatuses", () => {
    it("balance = 0 → completed + paid", () => {
      const result = calculateInvoiceStatuses(
        { balance: 0, paidAmount: 500000, dueDate: new Date("2025-07-01") },
        mockStatuses
      );
      expect(result.invoiceStatus.id).toBe("inv-3");
      expect(result.paymentInvoiceStatus.id).toBe("pay-3");
    });

    it("balance > 0, dueDate futuro, paidAmount = 0 → current + pending", () => {
      const result = calculateInvoiceStatuses(
        { balance: 500000, paidAmount: 0, dueDate: new Date("2025-07-01") },
        mockStatuses
      );
      expect(result.invoiceStatus.id).toBe("inv-1");
      expect(result.paymentInvoiceStatus.id).toBe("pay-1");
    });

    it("balance > 0, dueDate pasado, paidAmount = 0 → overdue + pending", () => {
      const result = calculateInvoiceStatuses(
        { balance: 500000, paidAmount: 0, dueDate: new Date("2025-05-01") },
        mockStatuses
      );
      expect(result.invoiceStatus.id).toBe("inv-2");
      expect(result.paymentInvoiceStatus.id).toBe("pay-1");
    });

    it("balance > 0, dueDate futuro, paidAmount > 0 → current + partial", () => {
      const result = calculateInvoiceStatuses(
        { balance: 200000, paidAmount: 300000, dueDate: new Date("2025-07-01") },
        mockStatuses
      );
      expect(result.invoiceStatus.id).toBe("inv-1");
      expect(result.paymentInvoiceStatus.id).toBe("pay-2");
    });

    it("balance > 0, dueDate pasado, paidAmount > 0 → overdue + partial", () => {
      const result = calculateInvoiceStatuses(
        { balance: 200000, paidAmount: 300000, dueDate: new Date("2025-05-01") },
        mockStatuses
      );
      expect(result.invoiceStatus.id).toBe("inv-2");
      expect(result.paymentInvoiceStatus.id).toBe("pay-2");
    });

    it("balance negativo → completed + paid (edge case)", () => {
      const result = calculateInvoiceStatuses(
        { balance: -100, paidAmount: 500100, dueDate: new Date("2025-07-01") },
        mockStatuses
      );
      expect(result.invoiceStatus.id).toBe("inv-3");
      expect(result.paymentInvoiceStatus.id).toBe("pay-3");
    });
  });

  describe("hasStatusChanged", () => {
    it("estados iguales → false", () => {
      const current = {
        invoiceStatus: mockStatuses.invoice.current,
        paymentInvoiceStatus: mockStatuses.payment.pending,
      };
      expect(hasStatusChanged(current, current)).toBe(false);
    });

    it("invoiceStatus diferente → true", () => {
      const current = {
        invoiceStatus: mockStatuses.invoice.current,
        paymentInvoiceStatus: mockStatuses.payment.pending,
      };
      const calculated = {
        invoiceStatus: mockStatuses.invoice.overdue,
        paymentInvoiceStatus: mockStatuses.payment.pending,
      };
      expect(hasStatusChanged(current, calculated)).toBe(true);
    });

    it("paymentInvoiceStatus diferente → true", () => {
      const current = {
        invoiceStatus: mockStatuses.invoice.current,
        paymentInvoiceStatus: mockStatuses.payment.pending,
      };
      const calculated = {
        invoiceStatus: mockStatuses.invoice.current,
        paymentInvoiceStatus: mockStatuses.payment.partial,
      };
      expect(hasStatusChanged(current, calculated)).toBe(true);
    });
  });

  describe("getInvoiceStatus", () => {
    it("retorna solo el invoiceStatus", () => {
      const result = getInvoiceStatus(
        { balance: 500000, paidAmount: 0, dueDate: new Date("2025-07-01") },
        mockStatuses
      );
      expect(result.id).toBe("inv-1");
    });
  });

  describe("getPaymentStatus", () => {
    it("retorna solo el paymentInvoiceStatus", () => {
      const result = getPaymentStatus(
        { balance: 0, paidAmount: 500000, dueDate: new Date("2025-07-01") },
        mockStatuses
      );
      expect(result.id).toBe("pay-3");
    });
  });
});
