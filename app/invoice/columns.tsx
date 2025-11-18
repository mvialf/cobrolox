"use client";

import { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerNameInfo } from "@/components/summarys/customer/customer-name-info";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pencil, Trash2, Eye } from "lucide-react";
import { InvoiceDueDateCell } from "@/components/cells/invoice-due-date-cell";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/invoice-status-constants";
import { InvoiceDetailDialog } from "@/components/dialogs/invoice/invoice-detail-dialog";
import { EditInvoiceDialog } from "@/components/dialogs/invoice/edit-invoice-dialog";
import { useDeleteInvoice } from "@/hooks/queries/use-invoices";
import { formatDate, formatCurrency } from "@/lib/format";

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
function InvoiceActionsCell({
  invoice,
  onInvoiceUpdated,
}: {
  invoice: Invoice;
  onInvoiceUpdated?: () => void;
}) {
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const deleteInvoice = useDeleteInvoice();

  const handleDelete = () => {
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        setShowDeleteAlert(false);
        onInvoiceUpdated?.();
      },
    });
  };

  return (
    <>
      <DataTableDropdown>
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(invoice.invoiceNumber)}
        >
          Copiar número de factura
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Ver detalle */}
        <DropdownMenuItem onClick={() => setShowDetailDialog(true)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </DropdownMenuItem>

        {/* Editar */}
        <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>

        {/* Eliminar */}
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => setShowDeleteAlert(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DataTableDropdown>

      {/* Dialog para ver detalles */}
      <InvoiceDetailDialog
        invoiceId={invoice.id}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      {/* Dialog para editar */}
      <EditInvoiceDialog
        invoiceId={invoice.id}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onInvoiceUpdated={() => {
          setShowEditDialog(false);
          onInvoiceUpdated?.();
        }}
      />

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              factura{" "}
              <span className="font-semibold">{invoice.invoiceNumber}</span>.
              {invoice.balance === 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  Nota: Esta factura está completamente pagada.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteInvoice.isPending}
            >
              {deleteInvoice.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
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
