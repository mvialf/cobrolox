/**
 * Script: Verify Invoice Balance
 *
 * Este script verifica que los campos balance y paidAmount
 * estén correctamente calculados comparándolos con la suma
 * real de allocations.
 *
 * CUÁNDO EJECUTAR:
 * - Después del backfill inicial
 * - Periódicamente para auditoría
 * - Cuando se sospeche de inconsistencias
 *
 * CÓMO EJECUTAR:
 * ```bash
 * npx tsx scripts/verify-invoice-balance.ts
 * ```
 *
 * RESULTADO:
 * - ✅ Si todas las facturas tienen balance correcto
 * - ❌ Si hay inconsistencias (muestra detalles de cada error)
 */

import { prisma } from "@/lib/db";

interface BalanceError {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  storedBalance: number;
  calculatedBalance: number;
  storedPaidAmount: number;
  calculatedPaidAmount: number;
  difference: number;
}

async function verifyInvoiceBalance() {
  console.log(
    "🔍 Verificando consistencia de Invoice.balance y Invoice.paidAmount"
  );
  console.log("⏳ Cargando facturas...\n");

  // Fetch todas las facturas con allocations
  const invoices = await prisma.invoice.findMany({
    include: { allocations: true },
  });

  const total = invoices.length;
  console.log(`📊 Total de facturas a verificar: ${total}\n`);

  if (total === 0) {
    console.log("✅ No hay facturas para verificar");
    return;
  }

  const errors: BalanceError[] = [];

  // Verificar cada factura
  for (const invoice of invoices) {
    // Calcular paidAmount (suma de allocations)
    const calculatedPaidAmount = invoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );

    // Calcular balance (total - pagado)
    const calculatedBalance = Number(invoice.total) - calculatedPaidAmount;

    // Comparar con valores almacenados (tolerancia de 0.01 por redondeos)
    const balanceDiff = Math.abs(Number(invoice.balance) - calculatedBalance);
    const paidAmountDiff = Math.abs(
      Number(invoice.paidAmount) - calculatedPaidAmount
    );

    if (balanceDiff > 0.01 || paidAmountDiff > 0.01) {
      errors.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: Number(invoice.total),
        storedBalance: Number(invoice.balance),
        calculatedBalance,
        storedPaidAmount: Number(invoice.paidAmount),
        calculatedPaidAmount,
        difference: balanceDiff,
      });
    }
  }

  // Mostrar resultados
  console.log("\n" + "=".repeat(80));

  if (errors.length === 0) {
    console.log("\n✅ ¡TODAS LAS FACTURAS TIENEN BALANCE CORRECTO!");
    console.log(`   ${total} facturas verificadas, 0 errores encontrados\n`);
  } else {
    console.log(
      `\n❌ ENCONTRADAS ${errors.length} FACTURAS CON BALANCE INCORRECTO:\n`
    );

    errors.forEach((error, index) => {
      console.log(
        `${index + 1}. Factura ${error.invoiceNumber} (${error.invoiceId})`
      );
      console.log(`   Total: $${error.total.toFixed(2)}`);
      console.log(`   Balance almacenado: $${error.storedBalance.toFixed(2)}`);
      console.log(
        `   Balance calculado:  $${error.calculatedBalance.toFixed(2)}`
      );
      console.log(`   Diferencia: $${error.difference.toFixed(2)}`);
      console.log(
        `   PaidAmount almacenado: $${error.storedPaidAmount.toFixed(2)}`
      );
      console.log(
        `   PaidAmount calculado:  $${error.calculatedPaidAmount.toFixed(2)}`
      );
      console.log("");
    });

    console.log("📝 Para corregir estos errores:");
    console.log("   1. Revisar las allocations de estas facturas");
    console.log("   2. Ejecutar backfill nuevamente:");
    console.log("      npx tsx scripts/backfill-invoice-balance.ts\n");
  }

  console.log("=".repeat(80) + "\n");

  // Exit con código de error si hay inconsistencias
  process.exit(errors.length > 0 ? 1 : 0);
}

// Ejecutar y manejar errores
verifyInvoiceBalance().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
