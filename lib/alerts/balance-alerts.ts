/**
 * Sistema de alertas para inconsistencias de balances
 *
 * Soporta múltiples canales:
 * - Slack (Webhook)
 * - Console (fallback)
 */

// ============================================
// TIPOS
// ============================================

export interface BalanceInconsistencyAlert {
  customerId: string;
  customerRut: string;
  customerName: string;
  diff: {
    total: number;
    vigente: number;
    vencido: number;
  };
  timestamp: Date;
  severity: "warning" | "critical";
}

export interface BalanceCalculationFailure {
  customerId: string;
  error: string;
  attempts: number;
  timestamp: Date;
}

// ============================================
// SLACK ALERTS (Webhook)
// ============================================

/**
 * Envía alerta a Slack sobre fallo crítico
 */
export async function sendBalanceCalculationFailureSlack(
  failure: BalanceCalculationFailure,
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️  Slack alert skipped: SLACK_WEBHOOK_URL not configured");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🚨 Balance Calculation Failed",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Customer ID:*\n${failure.customerId}`,
              },
              {
                type: "mrkdwn",
                text: `*Attempts:*\n${failure.attempts}`,
              },
              {
                type: "mrkdwn",
                text: `*Timestamp:*\n${failure.timestamp.toISOString()}`,
              },
              {
                type: "mrkdwn",
                text: `*Error:*\n\`${failure.error.substring(0, 100)}\``,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "⚠️ *Action Required:* Customer balance data may be inconsistent.",
            },
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("✓ Slack alert sent successfully");
      return true;
    } else {
      console.error("✗ Slack webhook failed:", response.statusText);
      return false;
    }
  } catch (error) {
    console.error("✗ Failed to send Slack alert:", error);
    return false;
  }
}

/**
 * Envía reporte diario de inconsistencias a Slack
 */
export async function sendDailyInconsistencyReportSlack(
  inconsistencies: BalanceInconsistencyAlert[],
  stats: {
    totalCustomers: number;
    fixed: number;
    failed: number;
  },
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️  Slack report skipped: SLACK_WEBHOOK_URL not configured");
    return false;
  }

  try {
    const criticalCount = inconsistencies.filter(
      (i) => i.severity === "critical",
    ).length;

    const emoji = criticalCount > 0 ? "🚨" : "✅";
    const title =
      criticalCount > 0
        ? `${emoji} Balance Report: ${criticalCount} CRITICAL inconsistencies`
        : `${emoji} Balance Report: ${inconsistencies.length} inconsistencies fixed`;

    // Top 5 inconsistencias para mostrar
    const topInconsistencies = inconsistencies
      .slice(0, 5)
      .map(
        (inc) =>
          `• ${inc.customerRut} - ${inc.customerName}\n  Diff Vencido: $${Math.abs(inc.diff.vencido).toLocaleString("es-CL")} (${inc.severity === "critical" ? "⚠️ CRITICAL" : "⚠ Warning"})`,
      )
      .join("\n");

    const blocks: any[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Total clientes:*\n${stats.totalCustomers}`,
          },
          {
            type: "mrkdwn",
            text: `*Inconsistencias:*\n${inconsistencies.length}`,
          },
          {
            type: "mrkdwn",
            text: `*Corregidas:*\n${stats.fixed}`,
          },
          {
            type: "mrkdwn",
            text: `*Fallos:*\n${stats.failed > 0 ? `❌ ${stats.failed}` : "✅ 0"}`,
          },
        ],
      },
    ];

    if (inconsistencies.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Top Inconsistencias:*\n${topInconsistencies}${inconsistencies.length > 5 ? `\n... y ${inconsistencies.length - 5} más` : ""}`,
        },
      });
    }

    if (stats.failed > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⚠️ *ATENCIÓN REQUERIDA*\n${stats.failed} cliente(s) NO pudieron ser corregidos automáticamente.\nSe requiere intervención manual.`,
        },
      });
    }

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Job ejecutado: ${new Date().toISOString()}`,
        },
      ],
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    if (response.ok) {
      console.log("✓ Slack report sent successfully");
      return true;
    } else {
      console.error("✗ Slack webhook failed:", response.statusText);
      return false;
    }
  } catch (error) {
    console.error("✗ Failed to send Slack report:", error);
    return false;
  }
}

// ============================================
// MULTI-CHANNEL ALERTS
// ============================================

/**
 * Envía alerta por todos los canales configurados
 */
export async function sendBalanceCalculationFailureAlert(
  failure: BalanceCalculationFailure,
): Promise<void> {
  console.error(
    `🚨 CRITICAL ALERT: Balance calculation failed for customer ${failure.customerId}`,
  );

  // Intentar Slack
  await sendBalanceCalculationFailureSlack(failure);
}

/**
 * Envía reporte diario por todos los canales configurados
 */
export async function sendDailyInconsistencyReport(
  inconsistencies: BalanceInconsistencyAlert[],
  stats: {
    totalCustomers: number;
    fixed: number;
    failed: number;
  },
): Promise<boolean> {
  // Log en console
  console.log("\n📊 REPORTE DIARIO DE BALANCES");
  console.log(`Total clientes: ${stats.totalCustomers}`);
  console.log(`Inconsistencias: ${inconsistencies.length}`);
  console.log(`Corregidas: ${stats.fixed}`);
  console.log(`Fallos: ${stats.failed}`);

  // Enviar a Slack si está configurado
  await sendDailyInconsistencyReportSlack(inconsistencies, stats);

  // Siempre retorna true porque al menos se logueó en console
  return true;
}
