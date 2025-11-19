import { z } from "zod";
import { rutHelpers } from "@/lib/rut-validations";

/**
 * Schema de validación para clientes con campos completos
 */
export const customerSchema = z.object({
  // RUT - Obligatorio
  rut: z
    .string()
    .min(1, "El RUT es requerido")
    .refine(
      (val) => rutHelpers.validate(val),
      "RUT inválido. Formato: 12.345.678-9"
    ),

  // Razón Social - Obligatorio
  razonSocial: z
    .string()
    .min(2, "La razón social debe tener al menos 2 caracteres"),

  // Nombre de Fantasía - Opcional
  tradeName: z.string().optional().or(z.literal("")),

  // Actividad Económica - Opcional
  businessActivity: z.string().optional().or(z.literal("")),

  // Persona de Contacto - Obligatorio
  contact: z
    .string()
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres"),

  // Teléfono - Obligatorio
  phone: z.string().min(1, "El teléfono es requerido"),

  // Email - Opcional
  email: z
    .string()
    .email("Correo electrónico inválido")
    .optional()
    .or(z.literal("")),

  // Dirección - Calle y numeración - Obligatorio
  street: z
    .string()
    .min(3, "La calle y numeración debe tener al menos 3 caracteres"),

  // Casa/Depto - Opcional
  apartment: z.string().optional().or(z.literal("")),

  // Región - Obligatorio
  region: z.string().min(1, "La región es requerida"),

  // Comuna - Obligatorio
  comuna: z.string().min(1, "La comuna es requerida"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
