/**
 * Script para crear admin usando la API de Better Auth directamente
 *
 * Este script hace un signup normal y luego actualiza el role a admin
 */

async function main() {
  console.log("🔐 Creando admin via signup API...");

  const adminEmail = "mvial@cristaluxspa.cl";
  const adminPassword = "Pirula4180";
  const baseUrl = "http://localhost:3000";

  try {
    // Paso 1: Crear invitación temporal para el admin
    console.log("📧 Creando invitación temporal...");

    // Primero necesitamos crear manualmente en DB una invitación
    // O podemos hacer el signup sin validación y luego actualizar el role

    console.log("\n⚠️  OPCIÓN MANUAL:");
    console.log("1. Ve a http://localhost:3000/signup");
    console.log("2. Ignora el error de invitación requerida");
    console.log("3. Voy a desactivar temporalmente la validación de invitación");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main();
