import { Badge } from "@/components/ui/badge";
import {
  INVOICE_STATUS_CONFIG,
  type InvoiceDueDateStatus,
} from "@/lib/utils/invoice-utils";

interface InvoiceStatusBadgeProps {
  /**
   * Estado de la factura basado en fecha de vencimiento
   * - "current": Vigente (más de 7 días hasta vencimiento)
   * - "due-soon": Por vencer (7 días o menos)
   * - "overdue": Vencida (ya pasó la fecha)
   */
  status: InvoiceDueDateStatus;
}

/**
 * Badge que muestra el estado de una factura según su fecha de vencimiento
 *
 * Este componente es presentacional puro - solo muestra el estado calculado.
 * El cálculo del estado debe hacerse server-side usando:
 * - calculateDueDate(issueDate, paymentTermsDays)
 * - getInvoiceDueDateStatus(dueDate)
 *
 * @example
 * // En Server Component
 * const dueDate = calculateDueDate(invoice.issueDate, invoice.paymentTermsDays);
 * const status = getInvoiceDueDateStatus(dueDate);
 *
 * <InvoiceStatusBadge status={status} />
 */
export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = INVOICE_STATUS_CONFIG[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
