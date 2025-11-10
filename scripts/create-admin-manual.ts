import { PrismaClient } from "@prisma/client";
import { scrypt } from "better-auth/crypto";

const prisma = new PrismaClient();

/**
 * Script para crear admin usando el mismo hash que Better Auth
 */
async function main() {
  console.log("🔐 Creando admin con hash de Better Auth...");

  const adminEmail = "mvial@cristaluxspa.cl";
  const adminPassword = "Pirula4180";

  // Verificar si existe
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminUser) {
    console.log("ℹ️  Usuario ya existe, eliminando...");

    // Eliminar cuenta asociada
    await prisma.account.deleteMany({
      where: { userId: adminUser.id },
    });

    // Eliminar sesiones
    await prisma.session.deleteMany({
      where: { userId: adminUser.id },
    });

    // Eliminar invitaciones
    await prisma.invitation.deleteMany({
      where: { invitedBy: adminUser.id },
    });

    // Eliminar usuario
    await prisma.user.delete({
      where: { id: adminUser.id },
    });

    console.log("✅ Usuario anterior eliminado");
  }

  // Crear nuevo usuario
  adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin Cristalux",
      role: "admin",
      emailVerified: true,
    },
  });

  console.log("✅ Usuario creado:", adminUser.email);

  // Hashear contraseña con el método de Better Auth
  const hashedPassword = await scrypt.hash(adminPassword);

  console.log("✅ Contraseña hasheada con Better Auth");

  // Crear cuenta con contraseña
  await prisma.account.create({
    data: {
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log("✅ Cuenta creada exitosamente");
  console.log("\n📧 Email:", adminEmail);
  console.log("🔑 Password:", adminPassword);
  console.log("\n✨ Ahora intenta hacer login!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
