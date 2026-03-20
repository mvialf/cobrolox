/**
 * Tests para lib/business-logic/customer-balance.ts
 *
 * Valida:
 * - calculateCustomerBalances() (sin persistir)
 * - recalculateCustomerBalances() (con update BD — solo balanceTotal)
 * - Lógica de vigente vs vencido (derivados, no almacenados)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import {
  calculateCustomerBalances,
  recalculateCustomerBalances,
} from "../customer-balance";
import { addDays, subDays } from "date-fns";

describe("customer-balance", () => {
  let testCustomerId: string;
  let testInvoice1Id: string; // Factura vigente con balance
  let testInvoice2Id: string; // Factura vencida con balance
  let testInvoice3Id: string; // Factura pagada completamente (balance 0)
  let testPaymentId: string;

  const TEST_RUT = "12345678-9";

  beforeAll(async () => {
    const existing = await prisma.customer.findUnique({
      where: { rut: TEST_RUT },
    });
    if (existing) {
      await prisma.paymentAllocation.deleteMany({
        where: { payment: { customerId: existing.id } },
      });
      await prisma.payment.deleteMany({ where: { customerId: existing.id } });
      await prisma.invoice.deleteMany({ where: { customerId: existing.id } });
      await prisma.customer.delete({ where: { id: existing.id } });
    }

    const customer = await prisma.customer.create({
      data: {
        rut: TEST_RUT,
        razonSocial: "Test Customer Balance",
        contact: "Test Contact",
        phone: "123456789",
        street: "Test Street",
        region: "Test Region",
        comuna: "Test Comuna",
      },
    });
    testCustomerId = customer.id;

    const initialInvoiceStatus = await prisma.invoiceStatus.findFirst({
      where: { isInitial: true, isActive: true },
    });
    const initialPaymentStatus = await prisma.paymentInvoiceStatus.findFirst({
      where: { isInitial: true, isActive: true },
    });

    if (!initialInvoiceStatus || !initialPaymentStatus) {
      throw new Error("Statuses not found. Run seed first.");
    }

    // Factura 1: Vigente (vence en 30 días), total $1,000,000, pagado $400,000, balance $600,000
    const invoice1 = await prisma.invoice.create({
      data: {
        invoiceNumber: `TEST-VIGENTE-${Date.now()}`,
        customerId: testCustomerId,
        subtotal: 840336,
        taxAmount: 159664,
        total: 1000000,
        currency: "CLP",
        issueDate: new Date(),
        dueDate: addDays(new Date(), 30),
        invoiceStatusId: initialInvoiceStatus.id,
        paymentInvoiceStatusId: initialPaymentStatus.id,
      },
    });
    testInvoice1Id = invoice1.id;

    // Factura 2: Vencida (venció hace 10 días), total $500,000, pagado $200,000, balance $300,000
    const invoice2 = await prisma.invoice.create({
      data: {
        invoiceNumber: `TEST-VENCIDA-${Date.now()}`,
        customerId: testCustomerId,
        subtotal: 420168,
        taxAmount: 79832,
        total: 500000,
        currency: "CLP",
        issueDate: subDays(new Date(), 40),
        dueDate: subDays(new Date(), 10),
        invoiceStatusId: initialInvoiceStatus.id,
        paymentInvoiceStatusId: initialPaymentStatus.id,
      },
    });
    testInvoice2Id = invoice2.id;

    // Factura 3: Pagada completamente, total $300,000, pagado $300,000, balance $0
    const invoice3 = await prisma.invoice.create({
      data: {
        invoiceNumber: `TEST-PAGADA-${Date.now()}`,
        customerId: testCustomerId,
        subtotal: 252101,
        taxAmount: 47899,
        total: 300000,
        currency: "CLP",
        issueDate: subDays(new Date(), 20),
        dueDate: addDays(new Date(), 10),
        invoiceStatusId: initialInvoiceStatus.id,
        paymentInvoiceStatusId: initialPaymentStatus.id,
      },
    });
    testInvoice3Id = invoice3.id;

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { active: true },
    });

    if (!paymentMethod) {
      throw new Error("No active PaymentMethod found. Run seed first.");
    }

    const payment = await prisma.payment.create({
      data: {
        amount: 900000,
        currency: "CLP",
        date: new Date(),
        customerId: testCustomerId,
        paymentMethodId: paymentMethod.id,
        type: "Invoice",
        allocations: {
          create: [
            { invoiceId: testInvoice1Id, allocatedAmount: 400000 },
            { invoiceId: testInvoice2Id, allocatedAmount: 200000 },
            { invoiceId: testInvoice3Id, allocatedAmount: 300000 },
          ],
        },
      },
    });
    testPaymentId = payment.id;
  });

  afterAll(async () => {
    if (!testCustomerId) return;

    if (testPaymentId) {
      await prisma.paymentAllocation.deleteMany({
        where: { paymentId: testPaymentId },
      });
      await prisma.payment.delete({ where: { id: testPaymentId } }).catch(() => {});
    }

    const invoiceIds = [testInvoice1Id, testInvoice2Id, testInvoice3Id].filter(Boolean);
    if (invoiceIds.length > 0) {
      await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    }

    await prisma.customer.delete({ where: { id: testCustomerId } }).catch(() => {});
  });

  describe("calculateCustomerBalances", () => {
    it("debe calcular correctamente balanceTotal, balanceVigente y balanceVencido", async () => {
      const result = await calculateCustomerBalances(testCustomerId);

      // Factura 1 (vigente): balance = 1,000,000 - 400,000 = 600,000
      // Factura 2 (vencida): balance = 500,000 - 200,000 = 300,000
      // Factura 3 (pagada): balance = 300,000 - 300,000 = 0 (se excluye)

      expect(result.balanceTotal).toBe(900000);
      expect(result.balanceVigente).toBe(600000);
      expect(result.balanceVencido).toBe(300000);
    });

    it("debe lanzar error si el customer no existe", async () => {
      await expect(
        calculateCustomerBalances("non-existent-id")
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("recalculateCustomerBalances", () => {
    it("debe calcular Y persistir balanceTotal en la BD", async () => {
      const customerBefore = await prisma.customer.findUnique({
        where: { id: testCustomerId },
      });
      expect(Number(customerBefore!.balanceTotal)).toBe(0);

      const result = await recalculateCustomerBalances(testCustomerId);

      // El resultado retornado incluye los 3 balances (vigente/vencido son derivados)
      expect(result.balanceTotal).toBe(900000);
      expect(result.balanceVigente).toBe(600000);
      expect(result.balanceVencido).toBe(300000);

      // Solo balanceTotal se persiste en BD
      const customerAfter = await prisma.customer.findUnique({
        where: { id: testCustomerId },
      });
      expect(Number(customerAfter!.balanceTotal)).toBe(900000);
    });

    it("debe actualizar correctamente cuando cambian los balances", async () => {
      await recalculateCustomerBalances(testCustomerId);

      await prisma.paymentAllocation.create({
        data: {
          paymentId: testPaymentId,
          invoiceId: testInvoice1Id,
          allocatedAmount: 200000,
        },
      });

      const result = await recalculateCustomerBalances(testCustomerId);

      // Factura 1: balance = 1,000,000 - 600,000 = 400,000
      // Factura 2: balance = 300,000
      expect(result.balanceTotal).toBe(700000);
      expect(result.balanceVigente).toBe(400000);
      expect(result.balanceVencido).toBe(300000);

      // Cleanup del allocation adicional
      await prisma.paymentAllocation.deleteMany({
        where: {
          paymentId: testPaymentId,
          invoiceId: testInvoice1Id,
          allocatedAmount: 200000,
        },
      });
    });

    it("debe retornar ceros si el customer no tiene facturas con balance", async () => {
      const emptyCustomer = await prisma.customer.create({
        data: {
          rut: `${Date.now()}-9`,
          razonSocial: "Empty Customer",
          contact: "Contact",
          phone: "123",
          street: "Street",
          region: "Region",
          comuna: "Comuna",
        },
      });

      const result = await recalculateCustomerBalances(emptyCustomer.id);

      expect(result.balanceTotal).toBe(0);
      expect(result.balanceVigente).toBe(0);
      expect(result.balanceVencido).toBe(0);

      const customer = await prisma.customer.findUnique({
        where: { id: emptyCustomer.id },
      });
      expect(Number(customer!.balanceTotal)).toBe(0);

      await prisma.customer.delete({ where: { id: emptyCustomer.id } });
    });

    it("debe lanzar error si el customer no existe", async () => {
      await expect(
        recalculateCustomerBalances("non-existent-id")
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("recalculateAllCustomers", () => {
    it("debe recalcular balances de todos los clientes en el sistema", async () => {
      const { recalculateAllCustomers } = await import("../customer-balance");

      const customer2 = await prisma.customer.create({
        data: {
          rut: `${Date.now()}-8`,
          razonSocial: "Second Customer",
          contact: "Contact 2",
          phone: "987654321",
          street: "Street 2",
          region: "Region 2",
          comuna: "Comuna 2",
        },
      });

      const count = await recalculateAllCustomers();

      expect(count).toBeGreaterThanOrEqual(2);

      const customer1After = await prisma.customer.findUnique({
        where: { id: testCustomerId },
      });
      const customer2After = await prisma.customer.findUnique({
        where: { id: customer2.id },
      });

      expect(Number(customer1After!.balanceTotal)).toBe(900000);
      expect(Number(customer2After!.balanceTotal)).toBe(0);

      await prisma.customer.delete({ where: { id: customer2.id } });
    });
  });

  describe("edge cases", () => {
    it("debe manejar correctamente facturas con balance exacto 0", async () => {
      const result = await calculateCustomerBalances(testCustomerId);

      expect(result.balanceTotal).toBe(900000);
    });

    it("debe clasificar correctamente facturas justo en el límite de vencimiento", async () => {
      const initialInvoiceStatus = await prisma.invoiceStatus.findFirst({
        where: { isInitial: true },
      });
      const initialPaymentStatus = await prisma.paymentInvoiceStatus.findFirst({
        where: { isInitial: true },
      });

      const invoiceToday = await prisma.invoice.create({
        data: {
          invoiceNumber: `TEST-TODAY-${Date.now()}`,
          customerId: testCustomerId,
          subtotal: 84034,
          taxAmount: 15966,
          total: 100000,
          currency: "CLP",
          issueDate: new Date(),
          dueDate: new Date(),
          invoiceStatusId: initialInvoiceStatus!.id,
          paymentInvoiceStatusId: initialPaymentStatus!.id,
        },
      });

      const result = await calculateCustomerBalances(testCustomerId);

      expect(result.balanceTotal).toBe(1000000); // 900,000 + 100,000
      expect(result.balanceVencido).toBeGreaterThanOrEqual(300000);

      await prisma.invoice.delete({ where: { id: invoiceToday.id } });
    });
  });
});
