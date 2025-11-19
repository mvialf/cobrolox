/**
 * Script para recalcular balances de TODOS los clientes
 *
 * Uso:
 *   npx tsx scripts/recalculate-all-balances.ts
 *
 * Este script:
 * 1. Conecta a la base de datos
 * 2. Obtiene todos los clientes
 * 3. Recalcula sus balances (total, vigente, vencido)
 * 4. Actualiza las columnas en Customer
 *
 * Útil para:
 * - Fix de datos desactualizados
 * - Después de migraciones
 * - Mantenimiento manual
 */

import { config } from "dotenv";
import { resolve } from "path";

// Cargar variables de entorno desde .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { recalculateAllCustomers } from "@/lib/business-logic/customer-balance";

async function main() {
  console.log(
    "🚀 Iniciando recálculo de balances para todos los clientes...\n"
  );

  try {
    const count = await recalculateAllCustomers();

    console.log("\n✅ Proceso completado exitosamente");
    console.log(`📊 Total de clientes procesados: ${count}`);
    console.log("\n💡 Los balances han sido actualizados en la base de datos.");
  } catch (error) {
    console.error("\n❌ Error durante el recálculo:", error);
    process.exit(1);
  }
}

main();
