import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Cargar variables de entorno desde .env.local
config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("🔑 Actualizando role de mvial@cristaluxspa.cl a admin...");

  const user = await prisma.user.findUnique({
    where: { email: "mvial@cristaluxspa.cl" },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado");
    return;
  }

  console.log(`📧 Usuario encontrado: ${user.email}`);
  console.log(`👤 Role actual: ${user.role}`);

  if (user.role === "admin") {
    console.log("✅ El usuario ya es admin");
    return;
  }

  await prisma.user.update({
    where: { email: "mvial@cristaluxspa.cl" },
    data: { role: "admin" },
  });

  console.log("✅ Role actualizado a admin exitosamente");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
