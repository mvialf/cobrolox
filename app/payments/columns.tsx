"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Eye, XCircle, Loader2 } from "lucide-react";
import { DataTableDropdown } from "@/components/data-table";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableColumnHeader } from "@/components/data-table";
import { formatDate } from "@/lib/format";
import Link from "next/link";

export interface Payment {
  id: string;
  type: "Invoice" | "Customer"; // ← Tipo de pago
  amount: number;
  currency: string;
  date: Date | string; // Compatible con API response
  reference: string | null;
  customer?: {
    id: string;
    razonSocial: string;
  };
  paymentMethod?: {
    id: string;
    name: string;
  };
  allocations: Array<{
    id: string;
    allocatedAmount: number;
    invoice: {
      id: string;
      invoiceNumber: string;
      total: number;
    };
  }>;
}

// ============================================================================
// TABLE META TYPE (Type-safe access)
// ============================================================================

/**
 * Type-safe interface para table.options.meta
 * Permite pasar callbacks y estado desde la página a las columnas
 */
interface PaymentsTableMeta {
  handleDelete?: (paymentId: string) => void;
  deletingPaymentId?: string | null;
}

/**
 * Helper type-safe para extraer meta del table sin usar `as any`
 */
function getPaymentsTableMeta(table: any): PaymentsTableMeta {
  return (table.options.meta || {}) as PaymentsTableMeta;
}

interface ColumnsProps {
  onViewDetails?: (payment: Payment) => void;
}

export const createColumns = ({
  onViewDetails,
}: ColumnsProps = {}): ColumnDef<Payment>[] => [
  // Cliente/Factura (fusionado)
  {
    id: "associated",
    accessorFn: (row) => {
      // Para sorting: extraer nombre relevante
      if (row.type === "Customer") {
        return row.customer?.razonSocial || "";
      }
      if (row.type === "Invoice" && row.allocations.length === 1) {
        return row.allocations[0].invoice.invoiceNumber;
      }
      return "";
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente/Factura" />
    ),
    cell: ({ row }) => {
      const payment = row.original;

      // Customer payment → customer name
      if (payment.type === "Customer") {
        return (
          <div className="space-y-1">
            <span className="font-medium">
              {payment.customer?.razonSocial || "-"}
            </span>
            <div className="text-xs text-muted-foreground">
              {payment.allocations.length} factura
              {payment.allocations.length !== 1 ? "s" : ""}
            </div>
          </div>
        );
      }

      // Invoice payment 1:1 → Link a factura
      if (payment.type === "Invoice" && payment.allocations.length === 1) {
        const invoice = payment.allocations[0].invoice;
        return (
          <div className="space-y-1">
            <Link
              href={`/invoice/${invoice.id}`}
              className="font-medium text-primary hover:underline"
            >
              {invoice.invoiceNumber}
            </Link>
            <div className="text-sm text-muted-foreground">
              {payment.customer?.razonSocial}
            </div>
          </div>
        );
      }

      // Fallback
      return <span className="text-muted-foreground">-</span>;
    },
    enableSorting: true,
  },

  // Tipo
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as "Invoice" | "Customer";

      return (
        <StatusBadge
          bgClass={type === "Invoice" ? "bg-blue-500" : "bg-purple-500"}
          label={type === "Invoice" ? "Factura directa" : "Múltiples facturas"}
        />
      );
    },
    enableSorting: true,
    filterFn: (row, _id, filterValue) => {
      const type = row.getValue("type") as string;
      return filterValue.includes(type);
    },
  },

  // Método de Pago
  {
    accessorKey: "paymentMethod.name",
    id: "paymentMethodName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Método" />
    ),
    cell: ({ row }) => row.original.paymentMethod?.name || "-",
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const methodA = rowA.original.paymentMethod?.name || "";
      const methodB = rowB.original.paymentMethod?.name || "";
      return methodA.localeCompare(methodB);
    },
    filterFn: (row, _id, filterValue) => {
      const methodName = row.original.paymentMethod?.name;
      return methodName ? filterValue.includes(methodName) : false;
    },
  },

  // Monto
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Monto"
        className="justify-end"
      />
    ),
    cell: ({ row }) => {
      const payment = row.original;
      const formatted = new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: payment.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(payment.amount);
      return <div className="text-right font-semibold">{formatted}</div>;
    },
    enableSorting: true,
  },

  // Fecha
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fecha" />
    ),
    cell: ({ row }) => {
      return formatDate(row.getValue("date"), "short", "es-CL");
    },
    enableSorting: true,
  },

  // Acciones
  {
    id: "actions",
    cell: ({ row, table }) => {
      const payment = row.original;
      const isCustomerPayment = payment.type === "Customer";

      // ✅ Extraer callbacks del table meta (type-safe)
      const { handleDelete, deletingPaymentId } = getPaymentsTableMeta(table);

      const onDelete = async () => {
        if (
          !confirm(
            `¿Estás seguro de eliminar este pago de ${payment.customer?.razonSocial || "este cliente"}?`,
          )
        ) {
          return;
        }
        handleDelete?.(payment.id);
      };

      const isDeleting = deletingPaymentId === payment.id;

      return (
        <DataTableDropdown>
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

          {/* Ver detalles: SOLO para pagos 1:N */}
          {isCustomerPayment && (
            <>
              <DropdownMenuItem onClick={() => onViewDetails?.(payment)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Eliminar pago */}
          <DropdownMenuItem
            className="text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Eliminar pago
              </>
            )}
          </DropdownMenuItem>
        </DataTableDropdown>
      );
    },
  },
];
