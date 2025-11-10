import * as React from "react";

interface AdminForceResetEmailProps {
  resetUrl: string;
  userName?: string;
  adminName?: string;
}

/**
 * Template de email para reset de contraseña forzado por administrador
 * Compatible con Resend y otros servicios de email
 */
export const AdminForceResetEmail: React.FC<AdminForceResetEmailProps> = ({
  resetUrl,
  userName,
  adminName,
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
            Cambio de contraseña requerido
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
            {adminName
              ? `${adminName}, el administrador del sistema,`
              : "El administrador del sistema"}{" "}
            ha solicitado que restablezcas tu contraseña en Cobrolox por razones
            de seguridad.
          </p>

          <p
            style={{
              color: "#52525b",
              fontSize: "16px",
              lineHeight: "24px",
              margin: "0 0 32px 0",
            }}
          >
            Para crear tu nueva contraseña, haz clic en el siguiente botón:
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
              Crear nueva contraseña
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
              backgroundColor: "#fef3c7",
              borderLeft: "4px solid #f59e0b",
              padding: "16px",
              marginTop: "32px",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                color: "#92400e",
                fontSize: "14px",
                lineHeight: "20px",
                margin: 0,
                fontWeight: "600",
              }}
            >
              ⚠️ Importante
            </p>
            <p
              style={{
                color: "#92400e",
                fontSize: "14px",
                lineHeight: "20px",
                margin: "8px 0 0 0",
              }}
            >
              Este enlace expirará en 1 hora. Si tienes dudas sobre esta
              solicitud, contacta al administrador del sistema antes de
              proceder.
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
export function renderAdminForceResetEmail(
  props: AdminForceResetEmailProps,
): string {
  const { resetUrl, userName, adminName } = props;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cambio de contraseña requerido - Cobrolox</title>
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
          Cambio de contraseña requerido
        </h2>

        <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
          ${userName ? `Hola ${userName},` : "Hola,"}
        </p>

        <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
          ${adminName ? `${adminName}, el administrador del sistema,` : "El administrador del sistema"}
          ha solicitado que restablezcas tu contraseña en Cobrolox por razones de seguridad.
        </p>

        <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 32px 0;">
          Para crear tu nueva contraseña, haz clic en el siguiente botón:
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px;">
            Crear nueva contraseña
          </a>
        </div>

        <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 32px 0 0 0;">
          O copia y pega este enlace en tu navegador:
        </p>

        <p style="color: #3b82f6; font-size: 14px; line-height: 20px; margin: 8px 0 0 0; word-break: break-all;">
          ${resetUrl}
        </p>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-top: 32px; border-radius: 4px;">
          <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0; font-weight: 600;">
            ⚠️ Importante
          </p>
          <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 8px 0 0 0;">
            Este enlace expirará en 1 hora. Si tienes dudas sobre esta solicitud,
            contacta al administrador del sistema antes de proceder.
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
