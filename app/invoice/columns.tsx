"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  DataTableDropdown,
  DataTableColumnHeader,
} from "@/components/data-table";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CustomerNameInfo } from "@/components/summarys/customer/customer-name-info";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pencil, Trash2, Eye } from "lucide-react";
import { InvoiceDueDateCell } from "@/components/cells/invoice-due-date-cell";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/invoice-status-constants";

// Tipo para la factura en el DataTable
export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balance: number;
  customer: {
    id: string;
    rut: string;
    razonSocial: string;
    tradeName: string | null;
  };
  invoiceStatus: {
    id: string;
    name: string;
    color: {
      bgClass: string;
      textClass: string;
    };
  };
  paymentInvoiceStatus: {
    id: string;
    name: string;
    color: {
      bgClass: string;
      textClass: string;
    };
  };
}

// Componente para las acciones de cada factura
function InvoiceActionsCell({ invoice }: { invoice: Invoice }) {
  return (
    <DataTableDropdown>
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuItem
        onClick={() => navigator.clipboard.writeText(invoice.invoiceNumber)}
      >
        Copiar número de factura
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      {/* Ver detalle */}
      <DropdownMenuItem>
        <Eye className="mr-2 h-4 w-4" />
        Ver detalle
      </DropdownMenuItem>

      {/* Editar */}
      <DropdownMenuItem>
        <Pencil className="mr-2 h-4 w-4" />
        Editar
      </DropdownMenuItem>

      {/* Eliminar */}
      <DropdownMenuItem className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </DropdownMenuItem>
    </DataTableDropdown>
  );
}

// Función helper para formatear moneda chilena
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
}

// Función helper para formatear fechas en formato dd/mm/yyyy
function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

export const columns: ColumnDef<Invoice>[] = [
  {
    id: "factura",
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Factura" />
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },

  {
    id: "cliente",
    accessorKey: "customer.razonSocial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => (
      <CustomerNameInfo
        rut={row.original.customer.rut}
        razonSocial={row.original.customer.razonSocial}
        tradeName={row.original.customer.tradeName ?? undefined}
      />
    ),
    meta: {
      cellClassName: "whitespace-normal min-w-48 max-w-xs",
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, _id, value) => {
      return value.includes(row.original.customer.id);
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.total)}
      </div>
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.balance === 0 ? (
          <span className="text-muted-foreground">Pagada</span>
        ) : (
          formatCurrency(row.original.balance)
        )}
      </div>
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },
  {
    id: "fechaEmision",
    accessorKey: "issueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Emisión" />
    ),
    cell: ({ row }) => formatDate(row.original.issueDate),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },
  {
    id: "fechaVencimiento",
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vencimiento" />
    ),
    cell: ({ row }) => (
      <InvoiceDueDateCell
        dueDate={row.original.dueDate}
        isPaid={row.original.balance === 0}
      />
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },
  {
    id: "estado",
    accessorKey: "invoiceStatus.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const statusName = row.original.invoiceStatus
        .name as keyof typeof INVOICE_STATUS_LABELS;
      const label =
        INVOICE_STATUS_LABELS[statusName] || row.original.invoiceStatus.name;
      return (
        <StatusBadge
          bgClass={row.original.invoiceStatus.color.bgClass}
          label={label}
        />
      );
    },
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, _id, value) => {
      return value.includes(row.original.invoiceStatus.name);
    },
  },
  {
    id: "pago",
    accessorKey: "paymentInvoiceStatus.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pago" />
    ),
    cell: ({ row }) => {
      const statusName = row.original.paymentInvoiceStatus
        .name as keyof typeof PAYMENT_STATUS_LABELS;
      const label =
        PAYMENT_STATUS_LABELS[statusName] ||
        row.original.paymentInvoiceStatus.name;
      return (
        <StatusBadge
          bgClass={row.original.paymentInvoiceStatus.color.bgClass}
          label={label}
        />
      );
    },
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, _id, value) => {
      return value.includes(row.original.paymentInvoiceStatus.name);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <InvoiceActionsCell invoice={row.original} />,
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
  },
];
