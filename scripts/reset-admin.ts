import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Eliminando usuario admin anterior...");

  // Eliminar usuario admin@cobrolox.com (si existe)
  const oldAdmin = await prisma.user.findUnique({
    where: { email: "admin@cobrolox.com" },
  });

  if (oldAdmin) {
    // Eliminar cuenta asociada (Better Auth)
    await prisma.account.deleteMany({
      where: { userId: oldAdmin.id },
    });

    // Eliminar sesiones
    await prisma.session.deleteMany({
      where: { userId: oldAdmin.id },
    });

    // Eliminar invitaciones creadas por este admin
    await prisma.invitation.deleteMany({
      where: { invitedBy: oldAdmin.id },
    });

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: oldAdmin.id },
    });

    console.log("✅ Usuario admin@cobrolox.com eliminado");
  } else {
    console.log("ℹ️  No se encontró el usuario admin@cobrolox.com");
  }

  console.log("✅ Listo para ejecutar el seed con nuevas credenciales");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
