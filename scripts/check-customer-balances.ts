/**
 * Script para verificar balances de clientes
 *
 * Muestra balanceTotal (almacenado) y vigente/vencido (derivados)
 */

import { prisma } from "@/lib/db";
import { getDerivedBalances } from "@/lib/business-logic/customer-balance";

async function main() {
  console.log("Verificando balances de clientes...\n");

  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      rut: true,
      razonSocial: true,
      balanceTotal: true,
    },
    orderBy: { balanceTotal: "desc" },
  });

  const customerIds = customers.map((c) => c.id);
  const derived = await getDerivedBalances(customerIds);

  console.log(
    "| RUT         | Razon Social           | Total        | Vigente        | Vencido        |"
  );
  console.log(
    "|-------------|------------------------|--------------|----------------|----------------|"
  );

  for (const customer of customers) {
    const d = derived.get(customer.id);
    const rut = customer.rut.padEnd(11);
    const razonSocial = customer.razonSocial.substring(0, 22).padEnd(22);
    const total =
      `$${Number(customer.balanceTotal).toLocaleString("es-CL")}`.padStart(12);
    const vigente =
      `$${(d?.balanceVigente ?? 0).toLocaleString("es-CL")}`.padStart(14);
    const vencido =
      `$${(d?.balanceVencido ?? 0).toLocaleString("es-CL")}`.padStart(14);

    console.log(
      `| ${rut} | ${razonSocial} | ${total} | ${vigente} | ${vencido} |`
    );
  }

  console.log(`\nTotal clientes: ${customers.length}`);

  await prisma.$disconnect();
}

main();
