"use client";

import { useState } from "react";
import { type ColumnDef, type Table } from "@tanstack/react-table";
import { Pencil, Trash2, DollarSign, Loader2, FileText } from "lucide-react";
import {
  DataTableDropdown,
  DataTableColumnHeader,
} from "@/components/data-table";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PaymentToCustomerDialog } from "@/components/dialogs/payments/payment-to-customer-dialog";
import { EditCustomerDialog } from "@/components/dialogs/customer/edit-customer-dialog";
import { CustomerAccountDialog } from "@/components/dialogs/customer/customer-account-dialog";
import { ConfirmDeleteDialog } from "@/components/dialogs/confirm-delete-dialog";
import { CustomerNameInfo } from "@/components/summarys/customer/customer-name-info";
import { formatCurrency } from "@/lib/format";

export interface Customer {
  id: string;
  rut: string;
  razonSocial: string;
  tradeName: string | null; // Nombre de fantasía
  contact: string; // Persona de contacto
  phone: string; // Obligatorio
  email: string | null; // Opcional
  // Columnas de balance (calculadas y almacenadas)
  balanceTotal: number; // Suma de todos los balances
  balanceVigente: number; // Balance de facturas vigentes
  balanceVencido: number; // Balance de facturas vencidas
}

// ============================================================================
// TABLE META TYPE (Type-safe access)
// ============================================================================

/**
 * Type-safe interface para table.options.meta
 * Permite pasar callbacks y estado desde la página a las columnas
 */
interface CustomersTableMeta {
  handleDelete?: (customerId: string) => void;
  deletingCustomerId?: string | null;
  onCustomerUpdated?: () => void;
}

/**
 * Helper type-safe para extraer meta del table
 */
function getCustomersTableMeta(table: Table<Customer>): CustomersTableMeta {
  return (table.options.meta || {}) as CustomersTableMeta;
}

// Componente para las acciones de cada customer
function CustomerActionsCell({
  customer,
  table,
}: {
  customer: Customer;
  table: Table<Customer>;
}) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );

  // Extraer callbacks del table meta (type-safe)
  const { handleDelete, deletingCustomerId, onCustomerUpdated } =
    getCustomersTableMeta(table);

  const onEdit = () => {
    setEditingCustomerId(customer.id);
    setEditDialogOpen(true);
  };

  const onDelete = () => {
    handleDelete?.(customer.id);
  };

  const isDeleting = deletingCustomerId === customer.id;

  return (
    <>
      <DataTableDropdown>
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() =>
            customer.email && navigator.clipboard.writeText(customer.email)
          }
          disabled={!customer.email}
        >
          Copiar correo
        </DropdownMenuItem>

        {/* Ver Estado de Cuenta */}
        <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Estado de Cuenta
        </DropdownMenuItem>

        {/* Registrar pago */}
        <DropdownMenuItem onClick={() => setPaymentDialogOpen(true)}>
          <DollarSign className="mr-2 h-4 w-4" />
          Registrar pago
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Editar */}
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>

        {/* Eliminar */}
        <ConfirmDeleteDialog onConfirm={onDelete}>
          <DropdownMenuItem
            className="text-destructive"
            disabled={isDeleting}
            onSelect={(e) => e.preventDefault()}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </>
            )}
          </DropdownMenuItem>
        </ConfirmDeleteDialog>
      </DataTableDropdown>

      {/* Dialog para registrar pago */}
      <PaymentToCustomerDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        preselectedCustomerId={customer.id}
        onSuccess={() => {
          // Actualizar tabla después de registrar pago
          // Esto recarga los clientes con sus balances actualizados
          onCustomerUpdated?.();
        }}
      />

      {/* Dialog para editar cliente */}
      <EditCustomerDialog
        customerId={editingCustomerId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Dialog para ver estado de cuenta */}
      <CustomerAccountDialog
        customer={customer}
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      />
    </>
  );
}

export const columns: ColumnDef<Customer>[] = [
  {
    id: "cliente",
    accessorKey: "razonSocial",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => (
      <CustomerNameInfo
        rut={row.original.rut}
        razonSocial={row.original.razonSocial}
        tradeName={row.original.tradeName ?? undefined}
      />
    ),
    meta: {
      cellClassName: "whitespace-normal min-w-48 max-w-xs",
    },
    enableSorting: true,
  },
  {
    accessorKey: "contact",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contacto" />
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Teléfono" />
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Correo" />
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const emailA = rowA.original.email || "";
      const emailB = rowB.original.email || "";
      return emailA.localeCompare(emailB);
    },
  },
  {
    accessorKey: "balanceTotal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.balanceTotal)}
      </div>
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      return rowA.original.balanceTotal - rowB.original.balanceTotal;
    },
  },
  {
    accessorKey: "balanceVigente",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vigente" />
    ),
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground">
        {formatCurrency(row.original.balanceVigente)}
      </div>
    ),
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      return rowA.original.balanceVigente - rowB.original.balanceVigente;
    },
  },
  {
    accessorKey: "balanceVencido",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vencido" />
    ),
    cell: ({ row }) => {
      const amount = row.original.balanceVencido;
      const hasOverdue = amount > 0;
      return (
        <div
          className={`text-right font-medium ${hasOverdue ? "text-destructive" : "text-muted-foreground"}`}
        >
          {formatCurrency(amount)}
        </div>
      );
    },
    meta: {
      headerClassName: "w-0",
      cellClassName: "w-0",
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      return rowA.original.balanceVencido - rowB.original.balanceVencido;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => (
      <CustomerActionsCell customer={row.original} table={table} />
    ),
  },
];
