/**
 * Utilidades para cálculos y formateo de facturas
 */

import { addDays, differenceInDays, isAfter } from "date-fns";

/**
 * Tasa de IVA en Chile (19%)
 */
export const TAX_RATE_CHILE = 0.19;

/**
 * Estados posibles de una factura basados en fecha de vencimiento
 */
export type InvoiceDueDateStatus = "current" | "due-soon" | "overdue";

/**
 * Configuración de variantes y labels para cada estado de factura
 */
export const INVOICE_STATUS_CONFIG = {
  current: {
    variant: "default" as const,
    label: "Vigente",
  },
  "due-soon": {
    variant: "outline" as const,
    label: "Por vencer",
  },
  overdue: {
    variant: "destructive" as const,
    label: "Vencida",
  },
} satisfies Record<
  InvoiceDueDateStatus,
  { variant: "default" | "outline" | "destructive"; label: string }
>;

/**
 * Calcula el monto del IVA (19%) a partir del subtotal
 * Redondea a valor entero (CLP no tiene decimales/centavos)
 *
 * @param subtotal - Monto sin impuestos
 * @returns Monto del IVA redondeado a valor entero
 *
 * @example
 * calculateTaxAmount(1000) // 190
 * calculateTaxAmount(230490) // 43793 (no 43793.1)
 */
export function calculateTaxAmount(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE_CHILE);
}

/**
 * Calcula el total sumando subtotal + IVA
 * Redondea a valor entero (CLP no tiene decimales/centavos)
 *
 * @param subtotal - Monto sin impuestos
 * @param taxAmount - Monto del IVA
 * @returns Total redondeado a valor entero
 *
 * @example
 * calculateTotal(1000, 190) // 1190
 * calculateTotal(230490, 43793) // 274283 (no 274283.1)
 */
export function calculateTotal(subtotal: number, taxAmount: number): number {
  return Math.round(subtotal + taxAmount);
}

/**
 * Formatea un número como moneda chilena (CLP)
 *
 * @param amount - Monto a formatear
 * @returns String formateado con símbolo $ y separador de miles
 *
 * @example
 * formatCurrency(1190000) // "$ 1.190.000"
 * formatCurrency(1190.50) // "$ 1.191"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calcula la fecha de vencimiento de una factura
 * Suma los días de plazo a la fecha de emisión
 *
 * @param issueDate - Fecha de emisión de la factura
 * @param paymentTermsDays - Días de plazo para pago (ej: 30, 60, 90)
 * @returns Fecha de vencimiento calculada
 *
 * @example
 * calculateDueDate(new Date('2025-01-01'), 30) // 2025-01-31
 * calculateDueDate(new Date('2025-01-15'), 60) // 2025-03-16
 */
export function calculateDueDate(
  issueDate: Date,
  paymentTermsDays: number
): Date {
  return addDays(issueDate, paymentTermsDays);
  // TODO futuro: Ajustar por días hábiles y feriados chilenos (Código de Comercio art. 7)
}

/**
 * Determina el estado de una factura basado en su fecha de vencimiento
 *
 * Estados:
 * - "current": Vigente (faltan más de warningThresholdDays)
 * - "due-soon": Por vencer (faltan warningThresholdDays o menos)
 * - "overdue": Vencida (ya pasó la fecha)
 *
 * @param dueDate - Fecha de vencimiento de la factura
 * @param warningThresholdDays - Días antes del vencimiento para considerar "por vencer" (default: 7)
 * @returns Estado de la factura
 *
 * @example
 * // Factura vence en 15 días
 * getInvoiceDueDateStatus(addDays(new Date(), 15)) // "current"
 *
 * // Factura vence en 5 días
 * getInvoiceDueDateStatus(addDays(new Date(), 5)) // "due-soon"
 *
 * // Factura vencida hace 3 días
 * getInvoiceDueDateStatus(subDays(new Date(), 3)) // "overdue"
 */
export function getInvoiceDueDateStatus(
  dueDate: Date,
  warningThresholdDays = 7
): InvoiceDueDateStatus {
  const today = new Date();

  // Si ya pasó la fecha de vencimiento
  if (isAfter(today, dueDate)) {
    return "overdue";
  }

  // Calcular días hasta el vencimiento
  const daysUntilDue = differenceInDays(dueDate, today);

  // Si faltan pocos días, está por vencer
  if (daysUntilDue <= warningThresholdDays) {
    return "due-soon";
  }

  // En cualquier otro caso, está vigente
  return "current";
}
