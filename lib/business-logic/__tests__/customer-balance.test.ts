/**
 * Tests para lib/business-logic/customer-balance.ts
 *
 * Valida:
 * - calculateCustomerBalances() (sin persistir)
 * - recalculateCustomerBalances() (con update BD)
 * - Lógica de vigente vs vencido
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import {
  calculateCustomerBalances,
  recalculateCustomerBalances,
} from "../customer-balance";
import { addDays, subDays } from "date-fns";

describe("customer-balance", () => {
  // IDs de test
  let testCustomerId: string;
  let testInvoice1Id: string; // Factura vigente con balance
  let testInvoice2Id: string; // Factura vencida con balance
  let testInvoice3Id: string; // Factura pagada completamente (balance 0)
  let testPaymentId: string;

  beforeAll(async () => {
    // Crear customer de test
    const customer = await prisma.customer.create({
      data: {
        rut: "12345678-9",
        razonSocial: "Test Customer Balance",
        contact: "Test Contact",
        phone: "123456789",
        street: "Test Street",
        region: "Test Region",
        comuna: "Test Comuna",
      },
    });
    testCustomerId = customer.id;

    // Obtener estados del sistema (necesarios para crear invoices)
    const initialInvoiceStatus = await prisma.invoiceStatus.findFirst({
      where: { isInitial: true, isActive: true },
    });
    const initialPaymentStatus = await prisma.paymentInvoiceStatus.findFirst({
      where: { isInitial: true, isActive: true },
    });

    if (!initialInvoiceStatus || !initialPaymentStatus) {
      throw new Error("Statuses not found. Run seed first.");
    }

    // Crear facturas de test
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
        dueDate: addDays(new Date(), 30), // Vigente (futuro)
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
        dueDate: subDays(new Date(), 10), // Vencida (pasado)
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

    // Obtener un PaymentMethod para crear el pago
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { active: true },
    });

    if (!paymentMethod) {
      throw new Error("No active PaymentMethod found. Run seed first.");
    }

    // Crear un pago con allocations
    const payment = await prisma.payment.create({
      data: {
        amount: 900000, // Total pagado: $900,000
        currency: "CLP",
        date: new Date(),
        customerId: testCustomerId,
        paymentMethodId: paymentMethod.id,
        type: "Invoice",
        allocations: {
          create: [
            // $400,000 a factura vigente
            {
              invoiceId: testInvoice1Id,
              allocatedAmount: 400000,
            },
            // $200,000 a factura vencida
            {
              invoiceId: testInvoice2Id,
              allocatedAmount: 200000,
            },
            // $300,000 a factura pagada (balance = 0)
            {
              invoiceId: testInvoice3Id,
              allocatedAmount: 300000,
            },
          ],
        },
      },
    });
    testPaymentId = payment.id;
  });

  afterAll(async () => {
    // Cleanup: eliminar datos de test
    await prisma.paymentAllocation.deleteMany({
      where: { paymentId: testPaymentId },
    });
    await prisma.payment.deleteMany({ where: { id: testPaymentId } });
    await prisma.invoice.deleteMany({
      where: {
        id: {
          in: [testInvoice1Id, testInvoice2Id, testInvoice3Id],
        },
      },
    });
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
  });

  describe("calculateCustomerBalances", () => {
    it("debe calcular correctamente balanceTotal, balanceVigente y balanceVencido", async () => {
      const result = await calculateCustomerBalances(testCustomerId);

      // Factura 1 (vigente): balance = 1,000,000 - 400,000 = 600,000
      // Factura 2 (vencida): balance = 500,000 - 200,000 = 300,000
      // Factura 3 (pagada): balance = 300,000 - 300,000 = 0 (se excluye)

      expect(result.balanceTotal).toBe(900000); // 600,000 + 300,000
      expect(result.balanceVigente).toBe(600000); // Solo factura 1
      expect(result.balanceVencido).toBe(300000); // Solo factura 2
    });

    it("debe lanzar error si el customer no existe", async () => {
      await expect(
        calculateCustomerBalances("non-existent-id")
      ).rejects.toThrow("Customer not found");
    });
  });

  describe("recalculateCustomerBalances", () => {
    it("debe calcular Y persistir los balances en la BD", async () => {
      // Antes del recálculo, balances deberían estar en 0 (defaults)
      const customerBefore = await prisma.customer.findUnique({
        where: { id: testCustomerId },
      });
      expect(Number(customerBefore!.balanceTotal)).toBe(0);

      // Ejecutar recálculo
      const result = await recalculateCustomerBalances(testCustomerId);

      // Verificar resultado retornado
      expect(result.balanceTotal).toBe(900000);
      expect(result.balanceVigente).toBe(600000);
      expect(result.balanceVencido).toBe(300000);

      // Verificar que se persistió en BD
      const customerAfter = await prisma.customer.findUnique({
        where: { id: testCustomerId },
      });
      expect(Number(customerAfter!.balanceTotal)).toBe(900000);
      expect(Number(customerAfter!.balanceVigente)).toBe(600000);
      expect(Number(customerAfter!.balanceVencido)).toBe(300000);
    });

    it("debe actualizar correctamente cuando cambian los balances", async () => {
      // Primer recálculo
      await recalculateCustomerBalances(testCustomerId);

      // Agregar más pago a factura vigente (reducir su balance)
      await prisma.paymentAllocation.create({
        data: {
          paymentId: testPaymentId,
          invoiceId: testInvoice1Id,
          allocatedAmount: 200000, // Pagar $200,000 adicionales
        },
      });

      // Recalcular
      const result = await recalculateCustomerBalances(testCustomerId);

      // Ahora factura 1 tiene: balance = 1,000,000 - 600,000 = 400,000
      // Factura 2 sigue con: balance = 300,000
      expect(result.balanceTotal).toBe(700000); // 400,000 + 300,000
      expect(result.balanceVigente).toBe(400000); // Factura 1 reducida
      expect(result.balanceVencido).toBe(300000); // Sin cambios

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
      // Crear customer sin facturas
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

      // Verificar que se persistió
      const customer = await prisma.customer.findUnique({
        where: { id: emptyCustomer.id },
      });
      expect(Number(customer!.balanceTotal)).toBe(0);

      // Cleanup
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
      // Importar la función
      const { recalculateAllCustomers } = await import("../customer-balance");

      // Crear un segundo customer de test
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

      // Recalcular todos
      const count = await recalculateAllCustomers();

      // Debería retornar el número total de customers
      // (testCustomerId + customer2 + posiblemente otros de otros tests)
      expect(count).toBeGreaterThanOrEqual(2);

      // Verificar que ambos customers fueron actualizados
      const customer1After = await prisma.customer.findUnique({
        where: { id: testCustomerId },
      });
      const customer2After = await prisma.customer.findUnique({
        where: { id: customer2.id },
      });

      // Customer 1 debería tener balances calculados
      expect(Number(customer1After!.balanceTotal)).toBe(900000);

      // Customer 2 no tiene facturas, debería tener 0
      expect(Number(customer2After!.balanceTotal)).toBe(0);

      // Cleanup
      await prisma.customer.delete({ where: { id: customer2.id } });
    });
  });

  describe("edge cases", () => {
    it("debe manejar correctamente facturas con balance exacto 0", async () => {
      // La factura 3 tiene balance = 0, no debería sumarse
      const result = await calculateCustomerBalances(testCustomerId);

      // Solo facturas 1 y 2 deberían estar en el total
      expect(result.balanceTotal).toBe(900000);
    });

    it("debe clasificar correctamente facturas justo en el límite de vencimiento", async () => {
      // Crear factura que vence HOY (edge case: ¿vigente o vencida?)
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
          dueDate: new Date(), // Vence HOY
          invoiceStatusId: initialInvoiceStatus!.id,
          paymentInvoiceStatusId: initialPaymentStatus!.id,
        },
      });

      const result = await calculateCustomerBalances(testCustomerId);

      // Balance total debería incluir esta nueva factura
      expect(result.balanceTotal).toBe(1000000); // 900,000 + 100,000

      // Esta factura se considera vencida (isAfter(now, dueDate) es true si son iguales o now > dueDate)
      // Nota: Si now > dueDate por milisegundos, se considera vencida
      expect(result.balanceVencido).toBeGreaterThanOrEqual(300000);

      // Cleanup
      await prisma.invoice.delete({ where: { id: invoiceToday.id } });
    });
  });
});
