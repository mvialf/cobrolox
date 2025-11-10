import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Eliminando usuario mvial@cristaluxspa.cl...");

  const user = await prisma.user.findUnique({
    where: { email: "mvial@cristaluxspa.cl" },
  });

  if (user) {
    // Eliminar relaciones primero
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.invitation.deleteMany({ where: { invitedBy: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log("✅ Usuario eliminado");
  } else {
    console.log("ℹ️  Usuario no encontrado");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
