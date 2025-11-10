import { z } from "zod";

/**
 * Schema de validación para facturas
 * Incluye validación de fechas y consistencia de cálculos
 */
export const invoiceSchema = z
  .object({
    // Número de factura - Obligatorio
    invoiceNumber: z.string().min(1, "El número de factura es requerido"),

    // Fecha de emisión - Obligatorio, no puede ser futura
    issueDate: z.date().max(new Date(), "La fecha no puede ser futura"),

    // Fecha de vencimiento - Obligatorio, debe ser >= issueDate
    dueDate: z.date(),

    // Subtotal - Obligatorio, debe ser positivo
    subtotal: z
      .number({
        required_error: "El subtotal es requerido",
        invalid_type_error: "El subtotal debe ser un número",
      })
      .positive("El subtotal debe ser mayor a 0")
      .min(1, "El subtotal mínimo es $1"),

    // IVA - Obligatorio, puede ser 0 (facturas exentas)
    taxAmount: z
      .number({
        required_error: "El monto de IVA es requerido",
        invalid_type_error: "El IVA debe ser un número",
      })
      .nonnegative("El IVA no puede ser negativo"),

    // Total - Obligatorio, debe ser positivo
    total: z
      .number({
        required_error: "El total es requerido",
        invalid_type_error: "El total debe ser un número",
      })
      .positive("El total debe ser mayor a 0"),

    // ID del cliente - Obligatorio
    customerId: z.string().min(1, "Debe seleccionar un cliente"),

    // ID del estado - Opcional, se calcula automáticamente en backend si no se proporciona
    statusId: z.string().optional(),

    // Días de crédito - Opcional, solo para UI (no se envía al backend)
    termsDay: z
      .number({
        invalid_type_error: "Los días de crédito deben ser un número",
      })
      .int("Los días de crédito deben ser un número entero")
      .nonnegative("Los días de crédito no pueden ser negativos")
      .optional(),
  })
  .refine(
    (data) => {
      // Validación de consistencia: total debe ser subtotal + taxAmount
      // Permitimos una tolerancia de 0.01 por redondeos
      const expectedTotal = data.subtotal + data.taxAmount;
      return Math.abs(data.total - expectedTotal) < 0.01;
    },
    {
      message:
        "El total no coincide con la suma de subtotal + IVA. Verifique los cálculos.",
      path: ["total"],
    },
  )
  .refine(
    (data) => {
      // Validación: dueDate debe ser mayor o igual a issueDate
      return data.dueDate >= data.issueDate;
    },
    {
      message:
        "La fecha de vencimiento debe ser mayor o igual a la fecha de emisión",
      path: ["dueDate"],
    },
  );

/**
 * Tipo inferido del schema para usar en forms
 */
export type InvoiceFormData = z.infer<typeof invoiceSchema>;

/**
 * Schema de validación para actualizar facturas
 * Todos los campos son opcionales
 * Nota: No se puede usar .partial() en schemas con .refine(), por lo que
 * simplemente usamos el schema base para validación y permitimos campos opcionales en el tipo
 */
export const updateInvoiceSchema = z.object({
  id: z.string().uuid("ID de factura inválido"),
  invoiceNumber: z.string().min(1).optional(),
  issueDate: z.date().max(new Date()).optional(),
  dueDate: z.date().optional(),
  subtotal: z.number().positive().min(1).optional(),
  taxAmount: z.number().nonnegative().optional(),
  total: z.number().positive().optional(),
  customerId: z.string().min(1).optional(),
  statusId: z.string().optional(),
  termsDay: z.number().int().nonnegative().optional(),
});

/**
 * Tipo inferido del schema de actualización
 */
export type UpdateInvoiceFormData = z.infer<typeof updateInvoiceSchema>;
