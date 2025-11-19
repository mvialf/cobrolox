import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkInvoiceStatuses() {
  console.log("📊 Verificando estados de facturas...\n");

  const invoices = await prisma.invoice.findMany({
    orderBy: { dueDate: "desc" },
    take: 15,
    include: {
      status: true,
      customer: {
        select: { razonSocial: true },
      },
    },
  });

  const now = new Date();

  console.log("Estado actual vs Estado esperado:\n");
  console.log(
    "Factura".padEnd(10) +
      "Vencimiento".padEnd(15) +
      "Cliente".padEnd(30) +
      "Estado Actual".padEnd(20) +
      "Debería ser"
  );
  console.log("=".repeat(100));

  invoices.forEach((invoice) => {
    const isOverdue = new Date(invoice.dueDate) < now;
    const expectedStatus = isOverdue ? "Vencida" : "Pendiente";
    const mismatch = invoice.status.name !== expectedStatus ? " ⚠️ " : "";

    console.log(
      invoice.invoiceNumber.padEnd(10) +
        new Date(invoice.dueDate).toLocaleDateString("es-CL").padEnd(15) +
        invoice.customer.razonSocial.substring(0, 28).padEnd(30) +
        invoice.status.name.padEnd(20) +
        expectedStatus +
        mismatch
    );
  });

  // Contar facturas con estados incorrectos
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      dueDate: { lt: now },
      status: { name: { not: "Vencida" } },
    },
  });

  console.log("\n📈 Resumen:");
  console.log(`- Total facturas verificadas: ${invoices.length}`);
  console.log(
    `- Facturas vencidas con estado incorrecto: ${overdueInvoices.length}`
  );

  await prisma.$disconnect();
}

checkInvoiceStatuses().catch((e) => {
  console.error(e);
  process.exit(1);
});
