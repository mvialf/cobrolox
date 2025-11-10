import { Resend } from "resend";
import { renderResetPasswordEmail } from "@/components/emails/reset-password-email";

/**
 * Email Service
 *
 * Módulo centralizado para envío de emails usando Resend.
 * Implementa lazy initialization para no cargar Resend innecesariamente.
 */

// Singleton client - se inicializa solo cuando se necesita
let resendClient: Resend | null = null;

/**
 * Obtiene instancia de Resend (lazy initialization)
 *
 * @throws Error si RESEND_API_KEY no está configurada
 */
function getEmailClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY no está configurada en variables de entorno. " +
          "Obtén tu API key en https://resend.com/api-keys y agrégala al .env.local",
      );
    }

    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * Envía email de recuperación de contraseña
 *
 * @param params - Parámetros del email
 * @param params.email - Email del destinatario
 * @param params.resetUrl - URL para resetear contraseña
 * @param params.userName - Nombre del usuario (opcional)
 * @returns Resultado del envío desde Resend API
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  resetUrl: string;
  userName: string | null;
}) {
  const { email, resetUrl, userName } = params;

  // Generar HTML del email usando template
  // Convertir null a undefined para coincidir con el tipo esperado
  const emailHtml = renderResetPasswordEmail({
    resetUrl,
    userName: userName ?? undefined,
  });

  // Obtener email "from" de env o usar default
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Cobrolox <mvial@cristaluxspa.cl>";

  // Obtener cliente Resend (lazy init)
  const client = getEmailClient();

  // Enviar email
  const result = await client.emails.send({
    from: fromEmail,
    to: email,
    subject: "Recupera tu contraseña - Cobrolox",
    html: emailHtml,
  });

  return result;
}
