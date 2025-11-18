/**
 * Script para recalcular balances de UN cliente específico
 *
 * Uso:
 *   npx tsx scripts/recalculate-customer-balance.ts [RUT]
 *
 * Ejemplos:
 *   npx tsx scripts/recalculate-customer-balance.ts 77867697-4
 *   npx tsx scripts/recalculate-customer-balance.ts 778676974
 *
 * Este script:
 * 1. Busca el cliente por RUT (acepta con o sin formato)
 * 2. Recalcula sus balances (total, vigente, vencido)
 * 3. Muestra antes/después
 * 4. Actualiza la BD
 */

import { config } from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { prisma } from "@/lib/db";
import { recalculateCustomerBalances } from "@/lib/business-logic/customer-balance";

async function main() {
  const rutArg = process.argv[2];

  if (!rutArg) {
    console.error("❌ Error: Debe proporcionar un RUT como argumento");
    console.log("\nUso:");
    console.log("  npx tsx scripts/recalculate-customer-balance.ts [RUT]");
    console.log("\nEjemplos:");
    console.log("  npx tsx scripts/recalculate-customer-balance.ts 77867697-4");
    console.log("  npx tsx scripts/recalculate-customer-balance.ts 778676974");
    process.exit(1);
  }

  // Normalizar RUT (eliminar puntos y guión)
  const normalizedRut = rutArg.replace(/\./g, "").replace(/-/g, "");

  console.log(`🔍 Buscando cliente con RUT: ${rutArg}`);
  console.log(`   (normalizado: ${normalizedRut})\n`);

  try {
    // Buscar cliente
    const customer = await prisma.customer.findUnique({
      where: { rut: normalizedRut },
    });

    if (!customer) {
      console.error(`❌ No se encontró un cliente con RUT: ${rutArg}`);
      process.exit(1);
    }

    console.log(`✅ Cliente encontrado:`);
    console.log(`   ID: ${customer.id}`);
    console.log(`   Razón Social: ${customer.razonSocial}`);
    console.log(`   Nombre Comercial: ${customer.tradeName || "N/A"}\n`);

    console.log("📊 Balances ANTES del recálculo:");
    console.log(
      `   Total:   $${customer.balanceTotal.toLocaleString("es-CL")}`,
    );
    console.log(
      `   Vigente: $${customer.balanceVigente.toLocaleString("es-CL")}`,
    );
    console.log(
      `   Vencido: $${customer.balanceVencido.toLocaleString("es-CL")}\n`,
    );

    console.log("🔄 Recalculando balances...\n");

    const result = await recalculateCustomerBalances(customer.id);

    console.log("📊 Balances DESPUÉS del recálculo:");
    console.log(`   Total:   $${result.balanceTotal.toLocaleString("es-CL")}`);
    console.log(
      `   Vigente: $${result.balanceVigente.toLocaleString("es-CL")}`,
    );
    console.log(
      `   Vencido: $${result.balanceVencido.toLocaleString("es-CL")}\n`,
    );

    console.log("✅ Balances actualizados exitosamente en la base de datos");
  } catch (error) {
    console.error("\n❌ Error durante el recálculo:", error);
    process.exit(1);
  }
}

main();
