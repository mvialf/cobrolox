import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Eliminando clientes de prueba...");

  const customerIds = [
    "23fe7dbd-8ddf-4fa5-b565-4e6bbf1c2d3b", // Juan Perez
    "8f01b08d-a4c5-418c-b624-3d2f5359b29c", // Maria Gonzalez
    "5aed8825-106f-4054-b564-5bd42028085e", // Pedro Sanchez
  ];

  const result = await prisma.customer.deleteMany({
    where: {
      id: {
        in: customerIds,
      },
    },
  });

  console.log(`✅ Eliminados ${result.count} clientes`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
