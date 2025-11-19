/**
 * Lógica de negocio para cálculo automático de estados de factura
 *
 * Implementa las reglas de negocio para determinar los dos estados ortogonales:
 * - InvoiceStatus (temporal): basado en dueDate
 * - PaymentInvoiceStatus (financiero): basado en balance/paidAmount
 *
 * @module business-logic/invoice-status
 */

import type { InvoiceStatus, PaymentInvoiceStatus } from "@prisma/client";

export interface InvoiceStatusInput {
  balance: number;
  paidAmount: number;
  dueDate: Date;
}

export interface AvailableStatuses {
  invoice: {
    current: InvoiceStatus;
    overdue: InvoiceStatus;
    completed: InvoiceStatus;
  };
  payment: {
    pending: PaymentInvoiceStatus;
    partial: PaymentInvoiceStatus;
    paid: PaymentInvoiceStatus;
  };
}

export interface CalculatedStatuses {
  invoiceStatus: InvoiceStatus;
  paymentInvoiceStatus: PaymentInvoiceStatus;
}

/**
 * Calcula ambos estados de una factura basado en sus datos financieros
 *
 * REGLAS DE NEGOCIO:
 *
 * InvoiceStatus (temporal):
 * 1. balance = 0 → "completed"
 * 2. dueDate < now AND balance > 0 → "overdue"
 * 3. dueDate >= now AND balance > 0 → "current"
 *
 * PaymentInvoiceStatus (financiero):
 * 1. balance = 0 → "paid"
 * 2. paidAmount > 0 AND balance > 0 → "partial-payment"
 * 3. paidAmount = 0 AND balance > 0 → "pending-payment"
 *
 * @param input - Datos financieros de la factura
 * @param statuses - Estados disponibles del sistema
 * @returns Ambos estados calculados
 */
export function calculateInvoiceStatuses(
  input: InvoiceStatusInput,
  statuses: AvailableStatuses
): CalculatedStatuses {
  const { balance, paidAmount, dueDate } = input;
  const now = new Date();

  // Calcular InvoiceStatus (temporal)
  let invoiceStatus: InvoiceStatus;
  if (balance <= 0) {
    invoiceStatus = statuses.invoice.completed;
  } else if (dueDate < now) {
    invoiceStatus = statuses.invoice.overdue;
  } else {
    invoiceStatus = statuses.invoice.current;
  }

  // Calcular PaymentInvoiceStatus (financiero)
  let paymentInvoiceStatus: PaymentInvoiceStatus;
  if (balance <= 0) {
    paymentInvoiceStatus = statuses.payment.paid;
  } else if (paidAmount > 0) {
    paymentInvoiceStatus = statuses.payment.partial;
  } else {
    paymentInvoiceStatus = statuses.payment.pending;
  }

  return {
    invoiceStatus,
    paymentInvoiceStatus,
  };
}

/**
 * Determina si alguno de los estados cambió
 *
 * @param current - Estados actuales
 * @param calculated - Estados calculados
 * @returns true si algún estado cambió
 */
export function hasStatusChanged(
  current: CalculatedStatuses,
  calculated: CalculatedStatuses
): boolean {
  return (
    current.invoiceStatus.id !== calculated.invoiceStatus.id ||
    current.paymentInvoiceStatus.id !== calculated.paymentInvoiceStatus.id
  );
}

/**
 * Obtiene solo el InvoiceStatus de un cálculo completo
 */
export function getInvoiceStatus(
  input: InvoiceStatusInput,
  statuses: AvailableStatuses
): InvoiceStatus {
  return calculateInvoiceStatuses(input, statuses).invoiceStatus;
}

/**
 * Obtiene solo el PaymentInvoiceStatus de un cálculo completo
 */
export function getPaymentStatus(
  input: InvoiceStatusInput,
  statuses: AvailableStatuses
): PaymentInvoiceStatus {
  return calculateInvoiceStatuses(input, statuses).paymentInvoiceStatus;
}
