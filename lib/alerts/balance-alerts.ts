/**
 * Sistema de alertas para inconsistencias de balances
 *
 * Soporta múltiples canales:
 * - Email (Resend)
 * - Slack (Webhook)
 * - Console (fallback)
 */

import { Resend } from "resend";

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
// EMAIL ALERTS (Resend)
// ============================================

/**
 * Envía alerta por email sobre fallo crítico en recálculo de balances
 */
export async function sendBalanceCalculationFailureEmail(
  failure: BalanceCalculationFailure,
): Promise<boolean> {
  // Verificar si está configurado Resend
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !adminEmail) {
    console.warn(
      "⚠️  Email alert skipped: RESEND_API_KEY or ADMIN_EMAIL not configured",
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Cobrolox <onboarding@resend.dev>",
      to: adminEmail,
      subject: `🚨 CRITICAL: Balance Calculation Failed (Customer ${failure.customerId})`,
      html: `
        <h2>🚨 Error Crítico en Cálculo de Balances</h2>

        <p><strong>Se ha detectado un error crítico que requiere atención inmediata.</strong></p>

        <h3>Detalles del Error:</h3>
        <ul>
          <li><strong>Customer ID:</strong> ${failure.customerId}</li>
          <li><strong>Intentos fallidos:</strong> ${failure.attempts}</li>
          <li><strong>Timestamp:</strong> ${failure.timestamp.toISOString()}</li>
          <li><strong>Error:</strong> <code>${failure.error}</code></li>
        </ul>

        <h3>⚠️ Impacto:</h3>
        <p>Los balances del cliente están <strong>potencialmente desactualizados</strong>.
        El estado de cuenta puede mostrar información incorrecta.</p>

        <h3>🔧 Acción Requerida:</h3>
        <ol>
          <li>Revisar logs del servidor para detalles completos del error</li>
          <li>Verificar conectividad con la base de datos</li>
          <li>Ejecutar manualmente el recálculo:
            <pre>npx tsx scripts/fix-customer-balance-76798456-1.ts</pre>
          </li>
          <li>Monitorear si el error persiste</li>
        </ol>

        <hr />
        <p style="color: #666; font-size: 12px;">
          Esta alerta fue generada automáticamente por Cobrolox Balance Monitor.
        </p>
      `,
    });

    console.log("✓ Email alert sent successfully");
    return true;
  } catch (error) {
    console.error("✗ Failed to send email alert:", error);
    return false;
  }
}

/**
 * Envía reporte de inconsistencias detectadas por el job diario
 */
export async function sendDailyInconsistencyReport(
  inconsistencies: BalanceInconsistencyAlert[],
  stats: {
    totalCustomers: number;
    fixed: number;
    failed: number;
  },
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !adminEmail) {
    console.warn(
      "⚠️  Email report skipped: RESEND_API_KEY or ADMIN_EMAIL not configured",
    );
    return false;
  }

  try {
    const resend = new Resend(apiKey);

    const criticalCount = inconsistencies.filter(
      (i) => i.severity === "critical",
    ).length;

    const subject =
      criticalCount > 0
        ? `🚨 Balance Report: ${criticalCount} CRITICAL inconsistencies`
        : `✅ Balance Report: ${inconsistencies.length} inconsistencies fixed`;

    const inconsistenciesHtml = inconsistencies
      .slice(0, 10) // Máximo 10 en el email
      .map(
        (inc) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${inc.customerRut}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${inc.customerName}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
            $${Math.abs(inc.diff.vencido).toLocaleString("es-CL")}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            <span style="color: ${inc.severity === "critical" ? "red" : "orange"};">
              ${inc.severity === "critical" ? "⚠️ CRITICAL" : "⚠ Warning"}
            </span>
          </td>
        </tr>
      `,
      )
      .join("");

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Cobrolox <onboarding@resend.dev>",
      to: adminEmail,
      subject,
      html: `
        <h2>📊 Reporte Diario de Balances</h2>

        <h3>Resumen:</h3>
        <ul>
          <li><strong>Total clientes verificados:</strong> ${stats.totalCustomers}</li>
          <li><strong>Inconsistencias detectadas:</strong> ${inconsistencies.length}</li>
          <li><strong>Corregidas automáticamente:</strong> ${stats.fixed}</li>
          ${stats.failed > 0 ? `<li style="color: red;"><strong>FALLOS:</strong> ${stats.failed}</li>` : ""}
        </ul>

        ${
          inconsistencies.length > 0
            ? `
          <h3>Top Inconsistencias:</h3>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; border: 1px solid #ddd;">RUT</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Cliente</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Diferencia Vencido</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Severidad</th>
              </tr>
            </thead>
            <tbody>
              ${inconsistenciesHtml}
            </tbody>
          </table>
          ${inconsistencies.length > 10 ? `<p><em>... y ${inconsistencies.length - 10} más</em></p>` : ""}
        `
            : `
          <p style="color: green;">✅ No se detectaron inconsistencias.</p>
        `
        }

        ${
          stats.failed > 0
            ? `
          <div style="background: #fee; padding: 15px; border-left: 4px solid red; margin: 20px 0;">
            <h3 style="color: red; margin-top: 0;">⚠️ ATENCIÓN REQUERIDA</h3>
            <p>${stats.failed} cliente(s) NO pudieron ser corregidos automáticamente.</p>
            <p>Se requiere intervención manual.</p>
          </div>
        `
            : ""
        }

        <hr />
        <p style="color: #666; font-size: 12px;">
          Job ejecutado: ${new Date().toISOString()}<br />
          Este reporte fue generado automáticamente.
        </p>
      `,
    });

    console.log("✓ Daily report sent successfully");
    return true;
  } catch (error) {
    console.error("✗ Failed to send daily report:", error);
    return false;
  }
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

  // Intentar email
  await sendBalanceCalculationFailureEmail(failure);

  // Intentar Slack
  await sendBalanceCalculationFailureSlack(failure);

  // TODO: Agregar otros canales (Discord, Telegram, etc.)
}
