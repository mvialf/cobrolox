/**
 * Job de verificación y corrección automática de balances de clientes
 *
 * Este script debe ejecutarse diariamente (ej: 3am) para:
 * 1. Detectar inconsistencias entre balances almacenados vs calculados
 * 2. Auto-corregir balances inconsistentes
 * 3. Logear reportes para monitoreo
 *
 * Útil para:
 * - Capturar errores silenciosos que no fueron detectados en runtime
 * - Actualizar facturas que pasaron de vigentes → vencidas durante la noche
 * - Mantener consistencia de datos a largo plazo
 *
 * Uso:
 * ```bash
 * # Ejecución manual
 * npx tsx scripts/verify-and-fix-customer-balances.ts
 *
 * # Cron job (diario a las 3am)
 * 0 3 * * * cd /path/to/project && npx tsx scripts/verify-and-fix-customer-balances.ts >> logs/balance-verification.log 2>&1
 * ```
 */

import { prisma } from "@/lib/db";
import {
  calculateCustomerBalances,
  recalculateCustomerBalances,
} from "@/lib/business-logic/customer-balance";
import {
  sendDailyInconsistencyReport,
  type BalanceInconsistencyAlert,
} from "@/lib/alerts/balance-alerts";

interface InconsistencyReport {
  customerId: string;
  rut: string;
  razonSocial: string;
  stored: {
    balanceTotal: number;
    balanceVigente: number;
    balanceVencido: number;
  };
  calculated: {
    balanceTotal: number;
    balanceVigente: number;
    balanceVencido: number;
  };
  diff: {
    total: number;
    vigente: number;
    vencido: number;
  };
}

async function main() {
  const startTime = Date.now();
  console.log("🔍 [BALANCE VERIFICATION JOB] Starting...");
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log("─".repeat(80));

  // 1. Obtener todos los clientes
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      rut: true,
      razonSocial: true,
      balanceTotal: true,
      balanceVigente: true,
      balanceVencido: true,
    },
    orderBy: { razonSocial: "asc" },
  });

  console.log(`📊 Total clientes a verificar: ${customers.length}`);
  console.log();

  // 2. Verificar cada cliente
  const inconsistencies: InconsistencyReport[] = [];
  let processedCount = 0;
  let errorCount = 0;

  for (const customer of customers) {
    processedCount++;

    try {
      // Calcular balances correctos
      const calculated = await calculateCustomerBalances(customer.id);

      // Comparar con valores almacenados
      const stored = {
        balanceTotal: Number(customer.balanceTotal),
        balanceVigente: Number(customer.balanceVigente),
        balanceVencido: Number(customer.balanceVencido),
      };

      const diff = {
        total: calculated.balanceTotal - stored.balanceTotal,
        vigente: calculated.balanceVigente - stored.balanceVigente,
        vencido: calculated.balanceVencido - stored.balanceVencido,
      };

      // Detectar inconsistencia (con tolerancia de $1 por redondeos)
      const hasInconsistency =
        Math.abs(diff.total) > 1 ||
        Math.abs(diff.vigente) > 1 ||
        Math.abs(diff.vencido) > 1;

      if (hasInconsistency) {
        inconsistencies.push({
          customerId: customer.id,
          rut: customer.rut,
          razonSocial: customer.razonSocial,
          stored,
          calculated,
          diff,
        });
      }

      // Progress log cada 10 clientes
      if (processedCount % 10 === 0) {
        console.log(
          `⏳ Progreso: ${processedCount}/${customers.length} (${Math.round((processedCount / customers.length) * 100)}%)`,
        );
      }
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error verificando cliente ${customer.rut} (${customer.razonSocial}):`,
        error,
      );
    }
  }

  console.log();
  console.log("─".repeat(80));
  console.log(
    `✅ Verificación completada: ${processedCount} clientes procesados`,
  );

  if (errorCount > 0) {
    console.warn(`⚠️  Errores encontrados: ${errorCount} clientes`);
  }

  // 3. Reportar inconsistencias
  if (inconsistencies.length === 0) {
    console.log("✅ No se encontraron inconsistencias");
  } else {
    console.log(`⚠️  INCONSISTENCIAS DETECTADAS: ${inconsistencies.length}`);
    console.log();

    // Mostrar detalles de cada inconsistencia
    for (const inc of inconsistencies) {
      console.log(`❌ ${inc.rut} - ${inc.razonSocial}`);
      console.log(
        `   Diff Total:   $${inc.diff.total.toLocaleString("es-CL")}`,
      );
      console.log(
        `   Diff Vigente: $${inc.diff.vigente.toLocaleString("es-CL")}`,
      );
      console.log(
        `   Diff Vencido: $${inc.diff.vencido.toLocaleString("es-CL")}`,
      );
      console.log();
    }

    // 4. Auto-corregir inconsistencias
    console.log("🔧 AUTO-CORRIGIENDO inconsistencias...");
    let fixedCount = 0;
    let fixErrorCount = 0;

    for (const inc of inconsistencies) {
      try {
        await recalculateCustomerBalances(inc.customerId);
        fixedCount++;
        console.log(`✓ Corregido: ${inc.rut} - ${inc.razonSocial}`);
      } catch (error) {
        fixErrorCount++;
        console.error(
          `✗ Error corrigiendo ${inc.rut} - ${inc.razonSocial}:`,
          error,
        );
      }
    }

    console.log();
    console.log(
      `✅ Correcciones completadas: ${fixedCount}/${inconsistencies.length}`,
    );

    if (fixErrorCount > 0) {
      console.error(
        `❌ CRITICAL: ${fixErrorCount} clientes NO pudieron ser corregidos`,
      );
      console.error(
        "   → Se requiere intervención manual o reintentar más tarde",
      );
    }
  }

  // 5. Resumen final
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log();
  console.log("─".repeat(80));
  console.log("📊 RESUMEN FINAL:");
  console.log(`   Clientes procesados: ${processedCount}`);
  console.log(`   Inconsistencias encontradas: ${inconsistencies.length}`);
  console.log(`   Errores de verificación: ${errorCount}`);
  console.log(`   Duración: ${duration}s`);
  console.log(`   Finalizado: ${new Date().toISOString()}`);

  // 6. Enviar reporte por email si hay inconsistencias o errores
  if (inconsistencies.length > 0 || errorCount > 0) {
    console.log();
    console.log("📧 Enviando reporte de inconsistencias...");

    const alerts: BalanceInconsistencyAlert[] = inconsistencies.map((inc) => ({
      customerId: inc.customerId,
      customerRut: inc.rut,
      customerName: inc.razonSocial,
      diff: inc.diff,
      timestamp: new Date(),
      severity:
        Math.abs(inc.diff.total) > 100000 ||
        Math.abs(inc.diff.vencido) > 50000
          ? "critical"
          : "warning",
    }));

    const emailSent = await sendDailyInconsistencyReport(alerts, {
      totalCustomers: processedCount,
      fixed: fixedCount || 0,
      failed: fixErrorCount || 0,
    });

    if (emailSent) {
      console.log("✓ Reporte enviado por email");
    } else {
      console.warn(
        "⚠️  No se pudo enviar el reporte (verifica configuración de RESEND_API_KEY y ADMIN_EMAIL)",
      );
    }
  }

  await prisma.$disconnect();

  // Exit code: 0 si todo OK, 1 si hubo inconsistencias no corregidas
  process.exit(inconsistencies.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("❌ FATAL ERROR:", error);
  process.exit(1);
});
