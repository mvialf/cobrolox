/**
 * Script para verificar balances de clientes después de migración
 */

import { prisma } from "@/lib/db";

async function main() {
  console.log("📊 Verificando balances de clientes...\n");

  const customers = await prisma.customer.findMany({
    select: {
      rut: true,
      razonSocial: true,
      balanceTotal: true,
      balanceVigente: true,
      balanceVencido: true,
    },
    orderBy: { balanceTotal: "desc" },
  });

  console.log(
    "┌─────────────┬────────────────────────┬──────────────┬────────────────┬────────────────┐"
  );
  console.log(
    "│ RUT         │ Razón Social           │ Total        │ Vigente        │ Vencido        │"
  );
  console.log(
    "├─────────────┼────────────────────────┼──────────────┼────────────────┼────────────────┤"
  );

  for (const customer of customers) {
    const rut = customer.rut.padEnd(11);
    const razonSocial = customer.razonSocial.substring(0, 22).padEnd(22);
    const total =
      `$${Number(customer.balanceTotal).toLocaleString("es-CL")}`.padStart(12);
    const vigente =
      `$${Number(customer.balanceVigente).toLocaleString("es-CL")}`.padStart(
        14
      );
    const vencido =
      `$${Number(customer.balanceVencido).toLocaleString("es-CL")}`.padStart(
        14
      );

    console.log(
      `│ ${rut} │ ${razonSocial} │ ${total} │ ${vigente} │ ${vencido} │`
    );
  }

  console.log(
    "└─────────────┴────────────────────────┴──────────────┴────────────────┴────────────────┘"
  );
  console.log(`\nTotal clientes: ${customers.length}`);

  await prisma.$disconnect();
}

main();
