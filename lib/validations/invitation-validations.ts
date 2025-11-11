import { z } from "zod";

/**
 * Schema de validación para crear una invitación
 */
export const createInvitationSchema = z.object({
  // Email del usuario invitado - Obligatorio
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Correo electrónico inválido"),

  // Rol del usuario invitado - Obligatorio
  role: z.enum(["user", "admin"], {
    required_error: "El rol es requerido",
    invalid_type_error: "Rol inválido",
  }),
});

/**
 * Schema de validación para aceptar una invitación
 */
export const acceptInvitationSchema = z.object({
  // Token de la invitación
  token: z.string().min(1, "El token es requerido"),

  // Nombre del usuario
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),

  // Contraseña (mínimo 8 caracteres)
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

/**
 * Schema de validación para validar token de invitación
 */
export const validateTokenSchema = z.object({
  token: z.string().min(1, "El token es requerido"),
});

// Tipos inferidos
export type CreateInvitationFormData = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;
export type ValidateTokenFormData = z.infer<typeof validateTokenSchema>;

/**
 * Estados posibles de una invitación
 * Calculados en base a usedAt, cancelledAt y expiresAt
 */
export type InvitationStatus =
  | "PENDING" // No usada, no cancelada, no expirada
  | "ACCEPTED" // usedAt tiene valor
  | "EXPIRED" // No usada, no cancelada, pero expiresAt <= now
  | "CANCELLED"; // cancelledAt tiene valor

/**
 * Helper para calcular el estado de una invitación
 */
export function getInvitationStatus(invitation: {
  usedAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date;
}): InvitationStatus {
  if (invitation.cancelledAt) return "CANCELLED";
  if (invitation.usedAt) return "ACCEPTED";
  if (invitation.expiresAt <= new Date()) return "EXPIRED";
  return "PENDING";
}
