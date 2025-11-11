import { z } from "zod";
import { FINANCIAL } from "../constants/financial-constants";

/**
 * Estados posibles de una cuota
 */
export const INSTALLMENT_STATUS = {
  PENDING: "pending", // Pendiente de pago
  PAID: "paid", // Pagada
  OVERDUE: "overdue", // Vencida (dueDate pasó y no está pagada)
} as const;

export type InstallmentStatus =
  (typeof INSTALLMENT_STATUS)[keyof typeof INSTALLMENT_STATUS];

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
 */
export type Installment = {
  id: string;
  paymentId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: InstallmentStatus;
  createdAt: Date;
  updatedAt: Date;
  payment?: PaymentInfo;
};

/**
 * Schema de validación para crear/editar cuotas de pago
 *
 * Installment representa una cuota de un pago dividido en cuotas.
 * Por ejemplo, un pago de $30,000 en 3 cuotas sin interés genera
 * 3 Installments de $10,000 cada una.
 *
 * Reglas de negocio:
 * - installmentNumber debe ser >= 1 (primera cuota = 1)
 * - amount debe ser positivo y con máximo 2 decimales
 * - dueDate debe ser futura (o hoy mínimo)
 * - Si status="paid", paidDate es obligatorio
 * - Si status="pending" o "overdue", paidDate debe ser null
 */
export const installmentSchema = z
  .object({
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
        "El monto debe tener máximo 2 decimales",
      ),

    // Fecha de vencimiento (obligatoria)
    dueDate: z.date({
      required_error: "La fecha de vencimiento es obligatoria",
      invalid_type_error: "Fecha de vencimiento inválida",
    }),

    // Fecha de pago (opcional, solo si status="paid")
    paidDate: z
      .date({
        invalid_type_error: "Fecha de pago inválida",
      })
      .nullable()
      .optional(),

    // Estado de la cuota (opcional, default "pending")
    status: z
      .enum([
        INSTALLMENT_STATUS.PENDING,
        INSTALLMENT_STATUS.PAID,
        INSTALLMENT_STATUS.OVERDUE,
      ])
      .optional()
      .default(INSTALLMENT_STATUS.PENDING),
  })
  .refine(
    (data) => {
      // Si status="paid", paidDate es obligatorio
      if (data.status === INSTALLMENT_STATUS.PAID && !data.paidDate) {
        return false;
      }
      return true;
    },
    {
      message: "La fecha de pago es obligatoria para cuotas pagadas",
      path: ["paidDate"],
    },
  )
  .refine(
    (data) => {
      // Si status="pending" o "overdue", paidDate debe ser null
      if (
        (data.status === INSTALLMENT_STATUS.PENDING ||
          data.status === INSTALLMENT_STATUS.OVERDUE) &&
        data.paidDate
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Las cuotas pendientes o vencidas no pueden tener fecha de pago",
      path: ["paidDate"],
    },
  )
  .refine(
    (data) => {
      // Si hay paidDate, debe ser >= dueDate (o al menos cercana)
      // Permitimos pagar antes del vencimiento, pero no mucho antes
      if (data.paidDate && data.dueDate) {
        // Permitir pagar hasta 1 año antes del vencimiento
        const oneYearBeforeDue = new Date(data.dueDate);
        oneYearBeforeDue.setFullYear(oneYearBeforeDue.getFullYear() - 1);
        return data.paidDate >= oneYearBeforeDue;
      }
      return true;
    },
    {
      message:
        "La fecha de pago no puede ser más de 1 año antes del vencimiento",
      path: ["paidDate"],
    },
  );

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
  paidDate?: Date | null;
  status?: InstallmentStatus;
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
  values: InstallmentFormValues,
): CreateInstallmentPayload {
  return {
    paymentId: values.paymentId,
    installmentNumber: values.installmentNumber,
    amount: values.amount,
    dueDate: values.dueDate,
    paidDate: values.paidDate || null,
    status: values.status || INSTALLMENT_STATUS.PENDING,
  };
}

/**
 * Helper para convertir Installment a form values
 */
export function installmentToFormValues(
  installment: Installment,
): InstallmentFormValues {
  return {
    paymentId: installment.paymentId,
    installmentNumber: installment.installmentNumber,
    amount: installment.amount,
    dueDate: installment.dueDate,
    paidDate: installment.paidDate,
    status: installment.status,
  };
}

/**
 * Helper para marcar una cuota como pagada
 *
 * @param installment - La cuota a marcar como pagada
 * @param paidDate - Fecha de pago (default: hoy)
 * @returns Payload para actualizar la cuota
 */
export function markAsPaid(
  installment: Installment,
  paidDate?: Date,
): UpdateInstallmentPayload {
  return {
    status: INSTALLMENT_STATUS.PAID,
    paidDate: paidDate || new Date(),
  };
}

/**
 * Helper para marcar una cuota como vencida
 *
 * @param _installment - La cuota a marcar como vencida
 * @returns Payload para actualizar la cuota
 */
export function markAsOverdue(
  _installment: Installment,
): UpdateInstallmentPayload {
  return {
    status: INSTALLMENT_STATUS.OVERDUE,
    paidDate: null,
  };
}
