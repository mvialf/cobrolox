/**
 * Constantes para el sistema de estados de factura
 *
 * Este módulo define dos sistemas ortogonales de estados:
 * 1. InvoiceStatus: Estado temporal basado en fecha de vencimiento
 * 2. PaymentInvoiceStatus: Estado financiero basado en pagos recibidos
 *
 * @module invoice-status-constants
 */

/**
 * Valores de InvoiceStatus (estado temporal)
 * Basado en la relación entre dueDate y balance
 */
export const INVOICE_STATUS = {
  /** Factura vigente (dueDate > now AND balance > 0) */
  CURRENT: "current",
  /** Factura vencida (dueDate < now AND balance > 0) */
  OVERDUE: "overdue",
  /** Factura completada (balance = 0) */
  COMPLETED: "completed",
} as const;

/**
 * Valores de PaymentInvoiceStatus (estado financiero)
 * Basado en la relación entre paidAmount y balance
 */
export const PAYMENT_STATUS = {
  /** Sin pagos (paidAmount = 0 AND balance > 0) */
  PENDING: "pending-payment",
  /** Con pagos parciales (paidAmount > 0 AND balance > 0) */
  PARTIAL: "partial-payment",
  /** Totalmente pagada (balance = 0) */
  PAID: "paid",
} as const;

/**
 * Labels en español para InvoiceStatus (UI)
 */
export const INVOICE_STATUS_LABELS: Record<
  (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS],
  string
> = {
  [INVOICE_STATUS.CURRENT]: "Vigente",
  [INVOICE_STATUS.OVERDUE]: "Vencida",
  [INVOICE_STATUS.COMPLETED]: "Completada",
};

/**
 * Labels en español para PaymentInvoiceStatus (UI)
 */
export const PAYMENT_STATUS_LABELS: Record<
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS],
  string
> = {
  [PAYMENT_STATUS.PENDING]: "Pago Pendiente",
  [PAYMENT_STATUS.PARTIAL]: "Pago Parcial",
  [PAYMENT_STATUS.PAID]: "Pagada",
};

/**
 * Type helpers
 */
export type InvoiceStatusValue =
  (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];
export type PaymentStatusValue =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
