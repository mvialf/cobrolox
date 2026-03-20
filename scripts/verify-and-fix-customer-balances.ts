/**
 * Job de verificación y corrección de balanceTotal de clientes
 *
 * Detecta y corrige inconsistencias en balanceTotal (el único balance almacenado).
 * balanceVigente/balanceVencido se derivan al consultar y no requieren verificación.
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
  storedTotal: number;
  calculatedTotal: number;
  diffTotal: number;
}

async function main() {
  const startTime = Date.now();
  console.log("[BALANCE VERIFICATION JOB] Starting...");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      rut: true,
      razonSocial: true,
      balanceTotal: true,
    },
    orderBy: { razonSocial: "asc" },
  });

  console.log(`Total clientes a verificar: ${customers.length}\n`);

  const inconsistencies: InconsistencyReport[] = [];
  let processedCount = 0;
  let errorCount = 0;

  for (const customer of customers) {
    processedCount++;

    try {
      const calculated = await calculateCustomerBalances(customer.id);
      const storedTotal = Number(customer.balanceTotal);
      const diffTotal = calculated.balanceTotal - storedTotal;

      if (Math.abs(diffTotal) > 1) {
        inconsistencies.push({
          customerId: customer.id,
          rut: customer.rut,
          razonSocial: customer.razonSocial,
          storedTotal,
          calculatedTotal: calculated.balanceTotal,
          diffTotal,
        });
      }

      if (processedCount % 10 === 0) {
        console.log(
          `Progreso: ${processedCount}/${customers.length} (${Math.round((processedCount / customers.length) * 100)}%)`
        );
      }
    } catch (error) {
      errorCount++;
      console.error(
        `Error verificando cliente ${customer.rut} (${customer.razonSocial}):`,
        error
      );
    }
  }

  console.log(`\nVerificacion completada: ${processedCount} clientes`);

  if (errorCount > 0) {
    console.warn(`Errores encontrados: ${errorCount} clientes`);
  }

  let fixedCount = 0;
  let fixErrorCount = 0;

  if (inconsistencies.length === 0) {
    console.log("No se encontraron inconsistencias");
  } else {
    console.log(`INCONSISTENCIAS DETECTADAS: ${inconsistencies.length}\n`);

    for (const inc of inconsistencies) {
      console.log(`${inc.rut} - ${inc.razonSocial}`);
      console.log(
        `   Diff Total: $${inc.diffTotal.toLocaleString("es-CL")}\n`
      );
    }

    console.log("AUTO-CORRIGIENDO inconsistencias...");

    for (const inc of inconsistencies) {
      try {
        await recalculateCustomerBalances(inc.customerId);
        fixedCount++;
        console.log(`Corregido: ${inc.rut} - ${inc.razonSocial}`);
      } catch (error) {
        fixErrorCount++;
        console.error(
          `Error corrigiendo ${inc.rut} - ${inc.razonSocial}:`,
          error
        );
      }
    }

    console.log(
      `\nCorrecciones: ${fixedCount}/${inconsistencies.length}`
    );

    if (fixErrorCount > 0) {
      console.error(
        `CRITICAL: ${fixErrorCount} clientes NO pudieron ser corregidos`
      );
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\nRESUMEN:");
  console.log(`   Clientes procesados: ${processedCount}`);
  console.log(`   Inconsistencias: ${inconsistencies.length}`);
  console.log(`   Errores: ${errorCount}`);
  console.log(`   Duracion: ${duration}s`);

  if (inconsistencies.length > 0 || errorCount > 0) {
    const alerts: BalanceInconsistencyAlert[] = inconsistencies.map((inc) => ({
      customerId: inc.customerId,
      customerRut: inc.rut,
      customerName: inc.razonSocial,
      diff: { total: inc.diffTotal, vigente: 0, vencido: 0 },
      timestamp: new Date(),
      severity: Math.abs(inc.diffTotal) > 100000 ? "critical" : "warning",
    }));

    const reportSent = await sendDailyInconsistencyReport(alerts, {
      totalCustomers: processedCount,
      fixed: fixedCount,
      failed: fixErrorCount,
    });

    if (reportSent) {
      console.log("Reporte enviado");
    } else {
      console.warn("No se pudo enviar el reporte");
    }
  }

  await prisma.$disconnect();
  process.exit(inconsistencies.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
