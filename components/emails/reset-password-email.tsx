import * as React from "react";

interface ResetPasswordEmailProps {
  resetUrl: string;
  userName?: string;
}

/**
 * Template de email para recuperación de contraseña
 * Compatible con Resend y otros servicios de email
 */
export const ResetPasswordEmail: React.FC<ResetPasswordEmailProps> = ({
  resetUrl,
  userName,
}) => {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: "#f6f9fc",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#18181b",
            padding: "32px 40px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: "600",
              margin: 0,
            }}
          >
            Cobrolox
          </h1>
        </div>

        {/* Body */}
        <div style={{ padding: "40px" }}>
          <h2
            style={{
              color: "#18181b",
              fontSize: "20px",
              fontWeight: "600",
              marginTop: 0,
              marginBottom: "16px",
            }}
          >
            Recupera tu contraseña
          </h2>

          <p
            style={{
              color: "#52525b",
              fontSize: "16px",
              lineHeight: "24px",
              margin: "0 0 24px 0",
            }}
          >
            {userName ? `Hola ${userName},` : "Hola,"}
          </p>

          <p
            style={{
              color: "#52525b",
              fontSize: "16px",
              lineHeight: "24px",
              margin: "0 0 24px 0",
            }}
          >
            Recibimos una solicitud para restablecer la contraseña de tu cuenta
            en Cobrolox. Si no realizaste esta solicitud, puedes ignorar este
            correo.
          </p>

          <p
            style={{
              color: "#52525b",
              fontSize: "16px",
              lineHeight: "24px",
              margin: "0 0 32px 0",
            }}
          >
            Para restablecer tu contraseña, haz clic en el siguiente botón:
          </p>

          {/* CTA Button */}
          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <a
              href={resetUrl}
              style={{
                display: "inline-block",
                backgroundColor: "#18181b",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "600",
                textDecoration: "none",
                padding: "12px 32px",
                borderRadius: "6px",
              }}
            >
              Restablecer contraseña
            </a>
          </div>

          <p
            style={{
              color: "#71717a",
              fontSize: "14px",
              lineHeight: "20px",
              margin: "32px 0 0 0",
            }}
          >
            O copia y pega este enlace en tu navegador:
          </p>

          <p
            style={{
              color: "#3b82f6",
              fontSize: "14px",
              lineHeight: "20px",
              margin: "8px 0 0 0",
              wordBreak: "break-all",
            }}
          >
            {resetUrl}
          </p>

          <div
            style={{
              borderTop: "1px solid #e4e4e7",
              marginTop: "32px",
              paddingTop: "24px",
            }}
          >
            <p
              style={{
                color: "#71717a",
                fontSize: "14px",
                lineHeight: "20px",
                margin: 0,
              }}
            >
              <strong>Nota de seguridad:</strong> Este enlace expirará en 1
              hora. Si no solicitaste este cambio, te recomendamos cambiar tu
              contraseña de inmediato.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: "#f4f4f5",
            padding: "24px 40px",
            borderTop: "1px solid #e4e4e7",
          }}
        >
          <p
            style={{
              color: "#71717a",
              fontSize: "12px",
              lineHeight: "18px",
              margin: 0,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} Cobrolox - Sistema de gestión de
            cobros
          </p>
          <p
            style={{
              color: "#71717a",
              fontSize: "12px",
              lineHeight: "18px",
              margin: "8px 0 0 0",
              textAlign: "center",
            }}
          >
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Genera el HTML del email como string
 * Para usar con Resend u otros servicios que requieren HTML string
 */
export function renderResetPasswordEmail(
  props: ResetPasswordEmailProps,
): string {
  const { resetUrl, userName } = props;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña - Cobrolox</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
  <div style="padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

      <!-- Header -->
      <div style="background-color: #18181b; padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">
          Cobrolox
        </h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px;">
        <h2 style="color: #18181b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">
          Recupera tu contraseña
        </h2>

        <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
          ${userName ? `Hola ${userName},` : "Hola,"}
        </p>

        <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en Cobrolox.
          Si no realizaste esta solicitud, puedes ignorar este correo.
        </p>

        <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
          Para restablecer tu contraseña, haz clic en el siguiente botón:
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px;">
            Restablecer contraseña
          </a>
        </div>

        <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 32px 0 0 0;">
          O copia y pega este enlace en tu navegador:
        </p>

        <p style="color: #3b82f6; font-size: 14px; line-height: 20px; margin: 8px 0 0 0; word-break: break-all;">
          ${resetUrl}
        </p>

        <div style="border-top: 1px solid #e4e4e7; margin-top: 32px; padding-top: 24px;">
          <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 0;">
            <strong>Nota de seguridad:</strong> Este enlace expirará en 1 hora.
            Si no solicitaste este cambio, te recomendamos cambiar tu contraseña de inmediato.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f4f4f5; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
        <p style="color: #71717a; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
          © ${new Date().getFullYear()} Cobrolox - Sistema de gestión de cobros
        </p>
        <p style="color: #71717a; font-size: 12px; line-height: 18px; margin: 8px 0 0 0; text-align: center;">
          Este es un correo automático, por favor no responder.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `.trim();
}
