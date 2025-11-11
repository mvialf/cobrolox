/**
 * Cache en memoria para estados del sistema (InvoiceStatus + PaymentInvoiceStatus)
 *
 * Los estados son seed data que NO cambian en runtime.
 * Este cache elimina 6 queries por cada request a /api/invoices.
 *
 * @module cache/invoice-statuses
 */

import { prisma } from "@/lib/db";
import {
  INVOICE_STATUS,
  PAYMENT_STATUS,
} from "@/lib/constants/invoice-status-constants";
import type { AvailableStatuses } from "@/lib/business-logic/invoice-status";

let cachedStatuses: AvailableStatuses | null = null;

/**
 * Obtiene los estados del sistema (con cache)
 *
 * Primera llamada: Ejecuta 6 queries a DB
 * Siguientes llamadas: Retorna cache (0 queries)
 *
 * @returns Estados disponibles del sistema
 */
export async function getInvoiceStatuses(): Promise<AvailableStatuses> {
  if (cachedStatuses) {
    return cachedStatuses;
  }

  // Fetch en paralelo (igual que antes, pero solo 1 vez)
  const [currentStatus, overdueStatus, completedStatus] = await Promise.all([
    prisma.invoiceStatus.findUnique({
      where: { name: INVOICE_STATUS.CURRENT },
      include: { color: true },
    }),
    prisma.invoiceStatus.findUnique({
      where: { name: INVOICE_STATUS.OVERDUE },
      include: { color: true },
    }),
    prisma.invoiceStatus.findUnique({
      where: { name: INVOICE_STATUS.COMPLETED },
      include: { color: true },
    }),
  ]);

  const [pendingPayment, partialPayment, paidPayment] = await Promise.all([
    prisma.paymentInvoiceStatus.findUnique({
      where: { name: PAYMENT_STATUS.PENDING },
      include: { color: true },
    }),
    prisma.paymentInvoiceStatus.findUnique({
      where: { name: PAYMENT_STATUS.PARTIAL },
      include: { color: true },
    }),
    prisma.paymentInvoiceStatus.findUnique({
      where: { name: PAYMENT_STATUS.PAID },
      include: { color: true },
    }),
  ]);

  if (
    !currentStatus ||
    !overdueStatus ||
    !completedStatus ||
    !pendingPayment ||
    !partialPayment ||
    !paidPayment
  ) {
    throw new Error("Estados del sistema no configurados correctamente");
  }

  cachedStatuses = {
    invoice: {
      current: currentStatus,
      overdue: overdueStatus,
      completed: completedStatus,
    },
    payment: {
      pending: pendingPayment,
      partial: partialPayment,
      paid: paidPayment,
    },
  };

  return cachedStatuses;
}

/**
 * Invalida el cache (útil para tests o si se agregan estados nuevos)
 *
 * NOTA: En producción, esto requeriría reiniciar el servidor.
 * Si los estados cambian frecuentemente, considerar Redis o similar.
 */
export function clearStatusCache() {
  cachedStatuses = null;
}
