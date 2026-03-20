/**
 * Script para recalcular balanceTotal de UN cliente específico
 *
 * Uso:
 *   npx tsx scripts/recalculate-customer-balance.ts [RUT]
 *
 * Nota: balanceVigente/balanceVencido se derivan al consultar (no se almacenan)
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { prisma } from "@/lib/db";
import { recalculateCustomerBalances } from "@/lib/business-logic/customer-balance";

async function main() {
  const rutArg = process.argv[2];

  if (!rutArg) {
    console.error("Error: Debe proporcionar un RUT como argumento");
    console.log("\nUso:");
    console.log("  npx tsx scripts/recalculate-customer-balance.ts [RUT]");
    process.exit(1);
  }

  const normalizedRut = rutArg.replace(/\./g, "").replace(/-/g, "");

  console.log(`Buscando cliente con RUT: ${rutArg}`);

  try {
    const customer = await prisma.customer.findUnique({
      where: { rut: normalizedRut },
    });

    if (!customer) {
      console.error(`No se encontro un cliente con RUT: ${rutArg}`);
      process.exit(1);
    }

    console.log(`Cliente encontrado: ${customer.razonSocial}`);

    console.log("\nBalanceTotal ANTES:");
    console.log(
      `   Total: $${customer.balanceTotal.toLocaleString("es-CL")}`
    );

    console.log("\nRecalculando...\n");

    const result = await recalculateCustomerBalances(customer.id);

    console.log("Balances DESPUES:");
    console.log(`   Total:   $${result.balanceTotal.toLocaleString("es-CL")}`);
    console.log(
      `   Vigente: $${result.balanceVigente.toLocaleString("es-CL")} (derivado)`
    );
    console.log(
      `   Vencido: $${result.balanceVencido.toLocaleString("es-CL")} (derivado)`
    );

    console.log("\nBalanceTotal actualizado en la BD");
  } catch (error) {
    console.error("\nError durante el recalculo:", error);
    process.exit(1);
  }
}

main();
