/**
 * Script para corregir balances inconsistentes del cliente 76.798.456-1
 *
 * Problema detectado: 4 facturas vencidas mostradas pero solo 3 sumadas
 * Diferencia: $18.967 (factura 2322)
 *
 * Causa: Fallo silencioso en recalculateCustomerBalances cuando se creó la factura
 */

import { prisma } from "@/lib/db";
import {
  calculateCustomerBalances,
  recalculateCustomerBalances,
} from "@/lib/business-logic/customer-balance";

async function main() {
  const targetRut = "767984561";

  console.log("🔍 Verificando inconsistencia en cliente:", targetRut);
  console.log("─".repeat(80));

  // 1. Buscar cliente
  const customer = await prisma.customer.findUnique({
    where: { rut: targetRut },
  });

  if (!customer) {
    console.error(`❌ Cliente ${targetRut} no encontrado`);
    await prisma.$disconnect();
    return;
  }

  console.log(`✓ Cliente encontrado: ${customer.razonSocial}`);
  console.log();

  // 2. Mostrar balances actuales (almacenados)
  console.log("📊 BALANCES ALMACENADOS (potencialmente incorrectos):");
  console.log(
    `   Total:   $${Number(customer.balanceTotal).toLocaleString("es-CL")}`,
  );
  console.log(
    `   Vigente: $${Number(customer.balanceVigente).toLocaleString("es-CL")}`,
  );
  console.log(
    `   Vencido: $${Number(customer.balanceVencido).toLocaleString("es-CL")}`,
  );
  console.log();

  // 3. Calcular balances correctos (sin persistir)
  console.log("🧮 CALCULANDO balances correctos...");
  const calculated = await calculateCustomerBalances(customer.id);

  console.log("✓ BALANCES CALCULADOS (correctos):");
  console.log(
    `   Total:   $${calculated.balanceTotal.toLocaleString("es-CL")}`,
  );
  console.log(
    `   Vigente: $${calculated.balanceVigente.toLocaleString("es-CL")}`,
  );
  console.log(
    `   Vencido: $${calculated.balanceVencido.toLocaleString("es-CL")}`,
  );
  console.log();

  // 4. Comparar y mostrar diferencias
  const diffTotal = calculated.balanceTotal - Number(customer.balanceTotal);
  const diffVigente =
    calculated.balanceVigente - Number(customer.balanceVigente);
  const diffVencido =
    calculated.balanceVencido - Number(customer.balanceVencido);

  if (diffTotal !== 0 || diffVigente !== 0 || diffVencido !== 0) {
    console.log("⚠️  INCONSISTENCIA DETECTADA:");
    console.log(`   Diff Total:   $${diffTotal.toLocaleString("es-CL")}`);
    console.log(`   Diff Vigente: $${diffVigente.toLocaleString("es-CL")}`);
    console.log(`   Diff Vencido: $${diffVencido.toLocaleString("es-CL")}`);
    console.log();

    // 5. Aplicar corrección
    console.log("🔧 APLICANDO corrección...");
    await recalculateCustomerBalances(customer.id);

    // 6. Verificar corrección
    const customerAfter = await prisma.customer.findUnique({
      where: { id: customer.id },
    });

    console.log("✅ BALANCES CORREGIDOS:");
    console.log(
      `   Total:   $${Number(customerAfter!.balanceTotal).toLocaleString("es-CL")}`,
    );
    console.log(
      `   Vigente: $${Number(customerAfter!.balanceVigente).toLocaleString("es-CL")}`,
    );
    console.log(
      `   Vencido: $${Number(customerAfter!.balanceVencido).toLocaleString("es-CL")}`,
    );
    console.log();
    console.log("✅ Corrección completada exitosamente");
  } else {
    console.log("✅ No se detectaron inconsistencias");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
