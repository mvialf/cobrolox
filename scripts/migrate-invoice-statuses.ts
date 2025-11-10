/**
 * Script de migración: Estados de factura
 *
 * Migra de sistema de 1 estado a sistema de 2 estados ortogonales:
 * - InvoiceStatus (temporal): current/overdue/completed
 * - PaymentInvoiceStatus (financiero): pending-payment/partial-payment/paid
 *
 * EJECUTAR DESPUÉS DE:
 * 1. npm run db:generate
 * 2. npm run db:push (aplicar schema)
 * 3. npm run db:seed (crear nuevos estados)
 *
 * USO:
 * npx tsx scripts/migrate-invoice-statuses.ts
 */

import { PrismaClient } from "@prisma/client";
import { calculateInvoiceStatuses } from "@/lib/business-logic/invoice-status";
import {
  INVOICE_STATUS,
  PAYMENT_STATUS,
} from "@/lib/constants/invoice-status-constants";

const prisma = new PrismaClient();

async function migrateInvoiceStatuses() {
  console.log("🔄 Migrando estados de facturas...\n");

  // 1. Obtener nuevos estados del sistema
  console.log("1️⃣  Obteniendo estados del sistema...");
  const [currentStatus, overdueStatus, completedStatus] = await Promise.all([
    prisma.invoiceStatus.findUnique({
      where: { name: INVOICE_STATUS.CURRENT },
    }),
    prisma.invoiceStatus.findUnique({
      where: { name: INVOICE_STATUS.OVERDUE },
    }),
    prisma.invoiceStatus.findUnique({
      where: { name: INVOICE_STATUS.COMPLETED },
    }),
  ]);

  const [pendingPayment, partialPayment, paidPayment] = await Promise.all([
    prisma.paymentInvoiceStatus.findUnique({
      where: { name: PAYMENT_STATUS.PENDING },
    }),
    prisma.paymentInvoiceStatus.findUnique({
      where: { name: PAYMENT_STATUS.PARTIAL },
    }),
    prisma.paymentInvoiceStatus.findUnique({
      where: { name: PAYMENT_STATUS.PAID },
    }),
  ]);

  if (
    !currentStatus ||
    !overdueStatus ||
    !completedStatus ||
    !pendingPayment ||
    !partialPayment ||
    !paidPayment
  ) {
    throw new Error(
      "Estados no encontrados. Ejecuta `npm run db:seed` primero.",
    );
  }

  const availableStatuses = {
    invoice: {
      current: currentStatus,
      overdue: overdueStatus,
      completed: completedStatus,
    },
    payment: {
      pending: pendingPayment,
      partial: partialPayment,
      paid: paidPayment,
    },
  };

  console.log("✅ Estados cargados\n");

  // 2. Obtener todas las facturas
  console.log("2️⃣  Obteniendo facturas existentes...");
  const invoices = await prisma.invoice.findMany({
    include: {
      allocations: true,
    },
  });

  console.log(`✅ ${invoices.length} facturas encontradas\n`);

  // 3. Migrar cada factura
  console.log("3️⃣  Calculando y actualizando estados...\n");

  let updated = 0;
  let errors = 0;

  for (const invoice of invoices) {
    try {
      // Calcular balance y paidAmount
      const paidAmount = invoice.allocations.reduce(
        (sum, a) => sum + Number(a.allocatedAmount),
        0,
      );
      const balance = Number(invoice.total) - paidAmount;

      // Calcular nuevos estados
      const newStatuses = calculateInvoiceStatuses(
        {
          balance,
          paidAmount,
          dueDate: invoice.dueDate,
        },
        availableStatuses,
      );

      // Actualizar factura
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          invoiceStatusId: newStatuses.invoiceStatus.id,
          paymentInvoiceStatusId: newStatuses.paymentInvoiceStatus.id,
        },
      });

      console.log(
        `✅ ${invoice.invoiceNumber.padEnd(10)} → InvoiceStatus: ${newStatuses.invoiceStatus.name.padEnd(15)} | PaymentStatus: ${newStatuses.paymentInvoiceStatus.name.padEnd(20)} | Balance: $${balance.toLocaleString()}`,
      );
      updated++;
    } catch (error) {
      console.error(`❌ Error en factura ${invoice.invoiceNumber}:`, error);
      errors++;
    }
  }

  console.log(`\n📊 Resumen de migración:`);
  console.log(`  - Facturas actualizadas: ${updated}`);
  console.log(`  - Errores: ${errors}`);
  console.log(`  - Total: ${invoices.length}`);

  if (errors === 0) {
    console.log("\n🎉 Migración completada exitosamente!");
  } else {
    console.log(`\n⚠️  Migración completada con ${errors} errores`);
  }
}

migrateInvoiceStatuses()
  .catch((e) => {
    console.error("❌ Error fatal en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
