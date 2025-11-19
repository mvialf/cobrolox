import { z } from "zod";

/**
 * Type para BadgeColor simplificado (usado en PaymentInvoiceStatus)
 */
export type BadgeColorInfo = {
  id: string;
  name: string;
  bgClass: string;
  textClass: string;
};

/**
 * Type completo de PaymentInvoiceStatus (from API)
 */
export type PaymentInvoiceStatus = {
  id: string;
  name: string;
  order: number;
  colorId: string;
  isInitial: boolean;
  isFinal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  color?: BadgeColorInfo;
};

/**
 * Schema de validación para crear/editar estados de pago de factura
 *
 * PaymentInvoiceStatus define los estados de pago de una factura
 * (ej: Sin pagar, Parcialmente pagada, Pagada, etc.)
 *
 * IMPORTANTE: Este es diferente a InvoiceStatus (estado administrativo)
 * - InvoiceStatus: Borrador, Emitida, Vencida, Anulada (estado del documento)
 * - PaymentInvoiceStatus: Sin pagar, Parcialmente pagada, Pagada (estado de cobro)
 *
 * Reglas de negocio:
 * - Solo puede haber UN estado con isInitial=true (estado por defecto)
 * - Solo puede haber UN estado con isFinal=true (estado terminal)
 * - Un estado NO puede ser isInitial Y isFinal simultáneamente
 */
export const paymentInvoiceStatusSchema = z
  .object({
    // Nombre del estado (obligatorio, único)
    name: z
      .string()
      .min(1, "El nombre es obligatorio")
      .max(50, "El nombre no puede exceder 50 caracteres")
      .trim(),

    // Orden de visualización (opcional, default 0)
    order: z
      .number()
      .int("Debe ser un número entero")
      .nonnegative("El orden no puede ser negativo")
      .optional()
      .default(0),

    // ID del color del badge (obligatorio)
    colorId: z
      .string({
        required_error: "Debe seleccionar un color",
      })
      .uuid("ID de color inválido"),

    // ¿Es el estado inicial? (opcional, default false)
    isInitial: z.boolean().optional().default(false),

    // ¿Es el estado final? (opcional, default false)
    isFinal: z.boolean().optional().default(false),

    // Estado activo (opcional, default true)
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // Un estado NO puede ser inicial Y final al mismo tiempo
      return !(data.isInitial && data.isFinal);
    },
    {
      message: "Un estado no puede ser inicial y final al mismo tiempo",
      path: ["isInitial"],
    }
  );

/**
 * Type inferido del schema (para formularios)
 */
export type PaymentInvoiceStatusFormValues = z.infer<
  typeof paymentInvoiceStatusSchema
>;

/**
 * Type para el payload de creación (API)
 */
export type CreatePaymentInvoiceStatusPayload = {
  name: string;
  order?: number;
  colorId: string;
  isInitial?: boolean;
  isFinal?: boolean;
  isActive?: boolean;
};

/**
 * Type para el payload de actualización (API)
 */
export type UpdatePaymentInvoiceStatusPayload =
  Partial<CreatePaymentInvoiceStatusPayload>;

/**
 * Helper para convertir form values a API payload
 */
export function formValuesToPayload(
  values: PaymentInvoiceStatusFormValues
): CreatePaymentInvoiceStatusPayload {
  return {
    name: values.name,
    order: values.order ?? 0,
    colorId: values.colorId,
    isInitial: values.isInitial ?? false,
    isFinal: values.isFinal ?? false,
    isActive: values.isActive ?? true,
  };
}

/**
 * Helper para convertir PaymentInvoiceStatus a form values
 */
export function paymentInvoiceStatusToFormValues(
  status: PaymentInvoiceStatus
): PaymentInvoiceStatusFormValues {
  return {
    name: status.name,
    order: status.order,
    colorId: status.colorId,
    isInitial: status.isInitial,
    isFinal: status.isFinal,
    isActive: status.isActive,
  };
}
