import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Better Auth Configuration
 *
 * Sistema de autenticación usando Better Auth con:
 * - Email/Password authentication
 * - Password reset functionality
 * - Session management
 * - Sistema de invitaciones (solo usuarios invitados pueden registrarse)
 * - Prisma adapter para PostgreSQL (Neon)
 *
 * @see https://www.better-auth.com/docs
 */
export const auth = betterAuth({
  appName: "Cobrolox",

  // Database adapter (Prisma + PostgreSQL)
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Hooks para validar invitaciones en signup
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Solo validar en signup con email/password
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const email = ctx.body?.email as string;
      const invitationToken = ctx.body?.invitationToken as string;

      // Validar que se proporcione el token de invitación
      if (!invitationToken) {
        throw new APIError("UNAUTHORIZED", {
          message:
            "Se requiere una invitación para registrarse. Contacta al administrador.",
        });
      }

      // Buscar la invitación en la base de datos
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
      });

      // Validar que la invitación existe
      if (!invitation) {
        throw new APIError("UNAUTHORIZED", {
          message: "Invitación inválida. Verifica el link de invitación.",
        });
      }

      // Validar que la invitación no haya sido usada
      if (invitation.usedAt) {
        throw new APIError("UNAUTHORIZED", {
          message: "Esta invitación ya ha sido utilizada.",
        });
      }

      // Validar que la invitación no esté expirada
      if (invitation.expiresAt < new Date()) {
        throw new APIError("UNAUTHORIZED", {
          message:
            "Esta invitación ha expirado. Solicita una nueva invitación.",
        });
      }

      // Validar que el email coincida con la invitación
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        throw new APIError("UNAUTHORIZED", {
          message:
            "El email no coincide con la invitación. Usa el email correcto.",
        });
      }

      // Todo está bien, permitir que continúe el signup
      return { context: ctx };
    }),

    // Marcar la invitación como usada después del signup exitoso
    after: createAuthMiddleware(async (ctx) => {
      // Solo para signup exitoso
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const invitationToken = ctx.body?.invitationToken as string;

      if (invitationToken) {
        // Marcar la invitación como usada
        await prisma.invitation.update({
          where: { token: invitationToken },
          data: { usedAt: new Date() },
        });
      }

      return { context: ctx };
    }),
  },

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Por ahora false para facilitar testing
    autoSignIn: true, // Auto login después de signup
    minPasswordLength: 8,
    maxPasswordLength: 128,

    // Password reset configuration
    sendResetPassword: async ({ user, url, token }, _request) => {
      try {
        // Log para desarrollo (opcional - remover en producción)
        if (process.env.NODE_ENV === "development") {
          console.log("===================================");
          console.log("PASSWORD RESET REQUEST");
          console.log("User:", user.email);
          console.log("Reset URL:", url);
          console.log("===================================");
        }

        // Enviar email usando módulo centralizado
        const { data, error } = await sendPasswordResetEmail({
          email: user.email,
          resetUrl: url,
          userName: user.name,
        });

        if (error) {
          console.error("Error al enviar email de reset:", error);
          throw new Error(
            `Failed to send password reset email: ${error.message}`,
          );
        }

        console.log("Email de reset enviado exitosamente:", data?.id);
      } catch (error) {
        console.error("Error en sendResetPassword:", error);
        // Re-lanzar el error para que Better Auth lo maneje
        throw error;
      }
    },

    // Callback después de reset exitoso
    onPasswordReset: async ({ user }, _request) => {
      console.log(`Password reset exitoso para: ${user.email}`);
    },

    // Token expiration (1 hora)
    resetPasswordTokenExpiresIn: 3600, // segundos
  },

  // Email verification (opcional, por ahora deshabilitado)
  // emailVerification: {
  //   sendVerificationEmail: async ({ user, url, token }, request) => {
  //     // Enviar email de verificación
  //   }
  // },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar cada 24 horas
  },

  // Security settings
  advanced: {
    cookiePrefix: "cobrolox-auth",
    database: {
      generateId: () => crypto.randomUUID(), // UUID v4
    },
  },
});

// Type helpers para usar en toda la app
// Better Auth infiere los tipos automáticamente desde la configuración
