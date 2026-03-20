import { z } from "zod";
import { FINANCIAL } from "../constants/financial-constants";

/**
 * Type para Payment simplificado (usado en Installment)
 */
export type PaymentInfo = {
  id: string;
  amount: number;
  date: Date;
};

/**
 * Type completo de Installment (from API)
 *
 * status e isOverdue se derivan de dueDate en el backend,
 * no se almacenan en la BD.
 */
export type Installment = {
  id: string;
  paymentId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: "paid" | "pending"; // derivado de dueDate
  isOverdue: boolean; // derivado de dueDate
  createdAt: Date;
  updatedAt: Date;
  payment?: PaymentInfo;
};

/**
 * Schema de validación para crear/editar cuotas de pago
 *
 * Installment representa una cuota de un pago dividido en cuotas.
 * El status se deriva de dueDate (no se almacena).
 */
export const installmentSchema = z.object({
  // ID del pago padre (obligatorio)
  paymentId: z
    .string({
      required_error: "El ID del pago es obligatorio",
    })
    .uuid("ID de pago inválido"),

  // Número de cuota (obligatorio, >= 1)
  installmentNumber: z
    .number({
      required_error: "El número de cuota es obligatorio",
      invalid_type_error: "El número de cuota debe ser un número",
    })
    .int("El número de cuota debe ser un entero")
    .min(1, "El número de cuota debe ser al menos 1"),

  // Monto de la cuota (obligatorio, positivo)
  amount: z.coerce
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser mayor a 0")
    .multipleOf(
      FINANCIAL.DECIMAL_PRECISION,
      "El monto debe tener máximo 2 decimales"
    ),

  // Fecha de vencimiento (obligatoria)
  dueDate: z.date({
    required_error: "La fecha de vencimiento es obligatoria",
    invalid_type_error: "Fecha de vencimiento inválida",
  }),
});

/**
 * Type inferido del schema (para formularios)
 */
export type InstallmentFormValues = z.infer<typeof installmentSchema>;

/**
 * Type para el payload de creación (API)
 */
export type CreateInstallmentPayload = {
  paymentId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
};

/**
 * Type para el payload de actualización (API)
 */
export type UpdateInstallmentPayload = Partial<
  Omit<CreateInstallmentPayload, "paymentId" | "installmentNumber">
>;

/**
 * Helper para convertir form values a API payload
 */
export function formValuesToPayload(
  values: InstallmentFormValues
): CreateInstallmentPayload {
  return {
    paymentId: values.paymentId,
    installmentNumber: values.installmentNumber,
    amount: values.amount,
    dueDate: values.dueDate,
  };
}

/**
 * Helper para convertir Installment a form values
 */
export function installmentToFormValues(
  installment: Installment
): InstallmentFormValues {
  return {
    paymentId: installment.paymentId,
    installmentNumber: installment.installmentNumber,
    amount: installment.amount,
    dueDate: installment.dueDate,
  };
}
