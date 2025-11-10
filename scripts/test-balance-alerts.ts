/**
 * Script de testing para sistema de alertas de balances
 *
 * Prueba todos los canales de alertas configurados sin modificar datos reales.
 *
 * Uso:
 * ```bash
 * npx tsx scripts/test-balance-alerts.ts
 * ```
 */

import {
  sendBalanceCalculationFailureSlack,
  sendDailyInconsistencyReportSlack,
  type BalanceInconsistencyAlert,
} from "@/lib/alerts/balance-alerts";

async function testAlerts() {
  console.log("🧪 TESTING SISTEMA DE ALERTAS\n");
  console.log("═".repeat(80));

  // 1. Verificar configuración
  console.log("\n📋 1. VERIFICANDO CONFIGURACIÓN\n");

  const hasSlack = !!process.env.SLACK_WEBHOOK_URL;

  console.log(
    `   ✓ SLACK_WEBHOOK_URL:  ${hasSlack ? "✅ Configurado" : "⚠️  No configurado (opcional)"}`,
  );

  if (!hasSlack) {
    console.log("\n⚠️  WARNING: No hay canales de alerta configurados.");
    console.log("   → Las alertas solo se mostrarán en console logs");
    console.log(
      "\n   Para configurar Slack: Agrega SLACK_WEBHOOK_URL a .env\n",
    );
  }

  // 2. Test de alerta crítica
  console.log("\n═".repeat(80));
  console.log(
    "\n🚨 2. PROBANDO ALERTA CRÍTICA (Balance Calculation Failure)\n",
  );

  const testFailure = {
    customerId: "test-customer-123",
    error: "Test error: Simulated database timeout",
    attempts: 3,
    timestamp: new Date(),
  };

  let successCount = 0;
  let totalTests = 0;

  // Test Slack
  if (hasSlack) {
    console.log("   💬 Enviando mensaje de Slack de prueba...");
    totalTests++;
    const slackSent = await sendBalanceCalculationFailureSlack(testFailure);
    if (slackSent) {
      successCount++;
      console.log("   ✅ Slack enviado exitosamente");
      console.log("      → Revisa tu canal de Slack");
    } else {
      console.log("   ❌ Fallo al enviar a Slack");
      console.log("      → Revisa logs arriba para detalles");
    }
  } else {
    console.log("   ⏭️  Slack test skipped (no configurado)");
  }

  // 3. Test de reporte diario
  console.log("\n═".repeat(80));
  console.log("\n📊 3. PROBANDO REPORTE DIARIO\n");

  if (hasSlack) {
    console.log("   💬 Enviando reporte de prueba a Slack...");

    const testInconsistencies: BalanceInconsistencyAlert[] = [
      {
        customerId: "customer-1",
        customerRut: "76.798.456-1",
        customerName: "Comercializadora de ventanas y puertas spa",
        diff: {
          total: 0,
          vigente: -18967,
          vencido: 18967,
        },
        timestamp: new Date(),
        severity: "warning",
      },
      {
        customerId: "customer-2",
        customerRut: "77.673.121-8",
        customerName: "Karpen Chile spa",
        diff: {
          total: 0,
          vigente: -1126930,
          vencido: 1126930,
        },
        timestamp: new Date(),
        severity: "critical",
      },
    ];

    totalTests++;
    const reportSent = await sendDailyInconsistencyReportSlack(
      testInconsistencies,
      {
        totalCustomers: 5,
        fixed: 2,
        failed: 0,
      },
    );

    if (reportSent) {
      successCount++;
      console.log("   ✅ Reporte enviado exitosamente");
      console.log("      → Revisa tu canal de Slack");
      console.log("      → Deberías ver un reporte con 2 inconsistencias");
    } else {
      console.log("   ❌ Fallo al enviar reporte");
      console.log("      → Revisa logs arriba para detalles");
    }
  } else {
    console.log("   ⏭️  Reporte test skipped (Slack no configurado)");
  }

  // 4. Resumen final
  console.log("\n═".repeat(80));
  console.log("\n📊 RESUMEN DE PRUEBAS\n");

  if (totalTests === 0) {
    console.log("   ⚠️  No se ejecutaron pruebas (sin canales configurados)");
    console.log(
      "\n   Para probar las alertas, configura Slack: SLACK_WEBHOOK_URL",
    );
  } else {
    console.log(`   Total de pruebas: ${totalTests}`);
    console.log(`   ✅ Exitosas: ${successCount}`);
    console.log(`   ❌ Fallidas: ${totalTests - successCount}`);

    if (successCount === totalTests) {
      console.log("\n   🎉 ¡TODAS LAS PRUEBAS PASARON!");
      console.log("   → El sistema de alertas está funcionando correctamente");
    } else {
      console.log("\n   ⚠️  Algunas pruebas fallaron");
      console.log("   → Revisa la configuración y logs de errores");
    }
  }

  console.log("\n═".repeat(80));
  console.log("\n✅ Testing completado\n");

  // 5. Instrucciones siguientes
  if (!hasSlack) {
    console.log("💡 PRÓXIMOS PASOS:\n");
    console.log("1. Configura Slack Webhook (opcional):");
    console.log("   → Ir a https://api.slack.com/messaging/webhooks");
    console.log("   → Crear Incoming Webhook");
    console.log("   → Copiar Webhook URL\n");

    console.log("2. Configura variable de entorno en .env:");
    console.log(
      '   SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T.../B.../xxx"\n',
    );

    console.log("3. Vuelve a ejecutar este test:");
    console.log("   npx tsx scripts/test-balance-alerts.ts\n");
  }
}

testAlerts().catch((error) => {
  console.error("❌ Error en testing:", error);
  process.exit(1);
});
