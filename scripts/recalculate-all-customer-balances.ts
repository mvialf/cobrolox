/**
 * Script de migración: Recalcular balances de TODOS los clientes
 *
 * Ejecutar UNA VEZ después de agregar las columnas de balance al modelo Customer.
 *
 * Este script:
 * 1. Obtiene todos los clientes
 * 2. Recalcula sus balances (total, vigente, vencido)
 * 3. Actualiza la BD
 *
 * Uso:
 *   npx tsx scripts/recalculate-all-customer-balances.ts
 */

import { prisma } from "@/lib/db";
import { recalculateAllCustomers } from "@/lib/business-logic/customer-balance";

async function main() {
  console.log("🔄 Iniciando recálculo de balances de clientes...");
  console.log("");

  try {
    const totalProcessed = await recalculateAllCustomers();

    console.log("");
    console.log("✅ Recálculo completado exitosamente");
    console.log(`📊 Clientes procesados: ${totalProcessed}`);
  } catch (error) {
    console.error("❌ Error durante el recálculo:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
