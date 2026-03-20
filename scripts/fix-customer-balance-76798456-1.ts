/**
 * Script para corregir balanceTotal inconsistente del cliente 76.798.456-1
 */

import { prisma } from "@/lib/db";
import {
  calculateCustomerBalances,
  recalculateCustomerBalances,
} from "@/lib/business-logic/customer-balance";

async function main() {
  const targetRut = "767984561";

  console.log("Verificando inconsistencia en cliente:", targetRut);

  const customer = await prisma.customer.findUnique({
    where: { rut: targetRut },
  });

  if (!customer) {
    console.error(`Cliente ${targetRut} no encontrado`);
    await prisma.$disconnect();
    return;
  }

  console.log(`Cliente encontrado: ${customer.razonSocial}`);

  console.log("\nBALANCE ALMACENADO:");
  console.log(
    `   Total: $${Number(customer.balanceTotal).toLocaleString("es-CL")}`
  );

  const calculated = await calculateCustomerBalances(customer.id);

  console.log("\nBALANCES CALCULADOS:");
  console.log(
    `   Total:   $${calculated.balanceTotal.toLocaleString("es-CL")}`
  );
  console.log(
    `   Vigente: $${calculated.balanceVigente.toLocaleString("es-CL")}`
  );
  console.log(
    `   Vencido: $${calculated.balanceVencido.toLocaleString("es-CL")}`
  );

  const diffTotal = calculated.balanceTotal - Number(customer.balanceTotal);

  if (Math.abs(diffTotal) > 1) {
    console.log(`\nINCONSISTENCIA: Diff Total = $${diffTotal.toLocaleString("es-CL")}`);
    console.log("Aplicando correccion...");
    await recalculateCustomerBalances(customer.id);
    console.log("Correccion completada");
  } else {
    console.log("\nNo se detectaron inconsistencias en balanceTotal");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
