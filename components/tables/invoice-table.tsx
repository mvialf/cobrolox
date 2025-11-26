"use client";

import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS } from "@/lib/constants/invoice-status-constants";
import { CaptureInvoiceDueDateCell } from "@/components/cells/capture-invoice-due-date-cell";

/**
 * Badge de estado para contexto de captura
 * Usa colores capture-* para consistencia en capturas
 */
function CaptureStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  // Mapeo de estados a clases capture-*
  const getStatusClasses = () => {
    switch (status) {
      case "overdue":
        return "bg-capture-badge-red text-capture-badge-red-foreground";
      case "current":
        return "bg-capture-badge-green text-capture-badge-green-foreground";
      case "completed":
        return "bg-capture-badge-gray text-capture-badge-gray-foreground";
      default:
        return "bg-capture-badge-gray text-capture-badge-gray-foreground";
    }
  };

  return (
    <Badge className={`${getStatusClasses()} border-0`}>{label}</Badge>
  );
}

// Tipo para la factura en la tabla
export interface InvoiceTableData {
  id: string;
  invoiceNumber: string;
  total: number;
  balance: number;
  dueDate: string | Date;
  invoiceStatus: {
    name: string;
    color: {
      bgClass: string;
      textClass: string;
    };
  };
  paymentInvoiceStatus?: {
    name: string;
    color: {
      bgClass: string;
      textClass: string;
    };
  };
}

interface InvoiceTableProps {
  invoices: InvoiceTableData[];
}

// Función helper para formatear moneda chilena
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full border border-capture-border shadow-capture-shadow rounded-xl">
        <thead className="bg-capture-border rounded-t-xl">
          <tr className="">
            <th className="py-2 px-1 text-capture-foreground bg-transparent text-center text-md">
              DTE
            </th>
            <th className="py-2 pl-2 pr-1 text-capture-foreground bg-transparent text-center text-md">
              Valor
            </th>
            <th className="py-2 pl-1 pr-2 text-capture-foreground bg-transparent text-center text-md">
              Saldo
            </th>
            <th className="py-2 px-1 text-capture-foreground bg-transparent text-center text-md">
              Vencimiento
            </th>
            <th className="py-2 px-1 text-capture-foreground bg-transparent text-center text-md">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center text-capture-muted"
              >
                No hay facturas para mostrar
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => {
              const statusName = invoice.invoiceStatus
                .name as keyof typeof INVOICE_STATUS_LABELS;
              const statusLabel =
                INVOICE_STATUS_LABELS[statusName] || invoice.invoiceStatus.name;

              return (
                <tr key={invoice.id} className="bg-capture-card">
                  {/* Factura */}
                  <td className="py-3 px-2 text-end text-sm text-capture-foreground">
                    {invoice.invoiceNumber}
                  </td>

                  {/* Valor */}
                  <td className="py-3 pl-2 pr-1 text-end text-sm text-capture-foreground">
                    {formatCurrency(invoice.total)}
                  </td>

                  {/* Saldo */}
                  <td className="py-3 pl-1 pr-2 text-end text-sm text-capture-foreground">
                    {invoice.balance === 0 ? (
                      <span className="text-capture-muted">Pagada</span>
                    ) : (
                      <span className="text-sm">
                        {formatCurrency(invoice.balance)}
                      </span>
                    )}
                  </td>

                  {/* Vencimiento */}
                  <td className="py-3 px-2 text-end text-sm">
                    <CaptureInvoiceDueDateCell
                      dueDate={invoice.dueDate}
                      isPaid={invoice.balance === 0}
                    />
                  </td>

                  {/* Estado */}
                  <td className="py-3 pr-2 text-center">
                    <div className="flex justify-center">
                      <CaptureStatusBadge
                        status={invoice.invoiceStatus.name}
                        label={statusLabel}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
