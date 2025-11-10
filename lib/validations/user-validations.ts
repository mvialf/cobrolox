import { z } from "zod";

/**
 * Validación para reset de contraseña por admin
 */
export const adminResetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID es requerido"),
  newPassword: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede exceder 128 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
});

export type AdminResetPasswordData = z.infer<typeof adminResetPasswordSchema>;
