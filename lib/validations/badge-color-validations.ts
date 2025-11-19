import { z } from "zod";

/**
 * Type completo de BadgeColor (from API)
 */
export type BadgeColor = {
  id: string;
  name: string;
  key: string;
  bgClass: string;
  textClass: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Schema de validación para crear/editar colores de badges
 *
 * BadgeColor define los colores disponibles para badges de estado
 * en el sistema (InvoiceStatus, PaymentInvoiceStatus, etc.)
 */
export const badgeColorSchema = z.object({
  // Nombre del color (obligatorio, único)
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),

  // Key identificadora (obligatoria, única, lowercase)
  key: z
    .string()
    .min(1, "La clave es obligatoria")
    .max(30, "La clave no puede exceder 30 caracteres")
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9-_]+$/,
      "La clave solo puede contener letras minúsculas, números, guiones y guiones bajos"
    ),

  // Clase CSS de fondo (obligatoria)
  bgClass: z
    .string()
    .min(1, "La clase de fondo es obligatoria")
    .max(100, "La clase de fondo no puede exceder 100 caracteres")
    .trim()
    .refine(
      (val) => val.startsWith("bg-") || val.includes("background"),
      "La clase de fondo debe ser una clase CSS válida (ej: bg-blue-500)"
    ),

  // Clase CSS de texto (opcional, default "text-white")
  textClass: z
    .string()
    .max(100, "La clase de texto no puede exceder 100 caracteres")
    .trim()
    .optional()
    .default("text-white"),

  // Orden de visualización (opcional, default 0)
  order: z
    .number()
    .int("Debe ser un número entero")
    .nonnegative("El orden no puede ser negativo")
    .optional()
    .default(0),

  // Estado activo (opcional, default true)
  isActive: z.boolean().optional().default(true),
});

/**
 * Type inferido del schema (para formularios)
 */
export type BadgeColorFormValues = z.infer<typeof badgeColorSchema>;

/**
 * Type para el payload de creación (API)
 */
export type CreateBadgeColorPayload = {
  name: string;
  key: string;
  bgClass: string;
  textClass?: string;
  order?: number;
  isActive?: boolean;
};

/**
 * Type para el payload de actualización (API)
 */
export type UpdateBadgeColorPayload = Partial<CreateBadgeColorPayload>;

/**
 * Helper para convertir form values a API payload
 */
export function formValuesToPayload(
  values: BadgeColorFormValues
): CreateBadgeColorPayload {
  return {
    name: values.name,
    key: values.key,
    bgClass: values.bgClass,
    textClass: values.textClass || "text-white",
    order: values.order ?? 0,
    isActive: values.isActive ?? true,
  };
}

/**
 * Helper para convertir BadgeColor a form values
 */
export function badgeColorToFormValues(
  badgeColor: BadgeColor
): BadgeColorFormValues {
  return {
    name: badgeColor.name,
    key: badgeColor.key,
    bgClass: badgeColor.bgClass,
    textClass: badgeColor.textClass,
    order: badgeColor.order,
    isActive: badgeColor.isActive,
  };
}
