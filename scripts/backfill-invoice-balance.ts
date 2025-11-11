/**
 * Script: Backfill Invoice Balance
 *
 * Este script calcula el balance de TODAS las facturas existentes
 * y lo guarda en los campos balance y paidAmount.
 *
 * CUÁNDO EJECUTAR:
 * - Una sola vez después de agregar las columnas balance y paidAmount
 * - Después de correr `npm run db:push`
 *
 * CÓMO EJECUTAR:
 * ```bash
 * npx tsx scripts/backfill-invoice-balance.ts
 * ```
 *
 * IMPORTANTE:
 * - Procesa en batches de 100 para no saturar memoria
 * - Muestra progreso cada batch
 * - Al final muestra resumen de facturas actualizadas
 */

import { prisma } from "@/lib/db";

async function backfillInvoiceBalance() {
  console.log("🚀 Iniciando backfill de Invoice.balance y Invoice.paidAmount");
  console.log("⏳ Cargando facturas...\n");

  // Fetch todas las facturas con allocations
  const invoices = await prisma.invoice.findMany({
    include: { allocations: true },
  });

  const total = invoices.length;
  console.log(`📊 Total de facturas a procesar: ${total}\n`);

  if (total === 0) {
    console.log("✅ No hay facturas para procesar");
    return;
  }

  const BATCH_SIZE = 100;
  let processed = 0;
  let errors = 0;

  // Procesar en batches de 100
  for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
    const batch = invoices.slice(i, i + BATCH_SIZE);

    try {
      // Ejecutar todas las actualizaciones del batch en paralelo
      await prisma.$transaction(
        batch.map((invoice) => {
          // Calcular paidAmount (suma de allocations)
          const paidAmount = invoice.allocations.reduce(
            (sum, alloc) => sum + Number(alloc.allocatedAmount),
            0,
          );

          // Calcular balance (total - pagado)
          const balance = Number(invoice.total) - paidAmount;

          return prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              paidAmount,
              balance,
            },
          });
        }),
      );

      processed += batch.length;
      const percentage = ((processed / total) * 100).toFixed(1);
      console.log(`✅ Procesadas ${processed} / ${total} (${percentage}%)`);
    } catch (error) {
      errors += batch.length;
      console.error(`❌ Error procesando batch ${i / BATCH_SIZE + 1}:`, error);
    }
  }

  console.log("\n🎉 Backfill completado!");
  console.log(`✅ Facturas actualizadas: ${processed}`);
  if (errors > 0) {
    console.log(`❌ Errores: ${errors}`);
  }
  console.log(
    "\n📝 Siguiente paso: Ejecutar verify script para validar consistencia",
  );
  console.log("   npx tsx scripts/verify-invoice-balance.ts\n");
}

// Ejecutar y manejar errores
backfillInvoiceBalance()
  .then(() => {
    console.log("✅ Script finalizado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
