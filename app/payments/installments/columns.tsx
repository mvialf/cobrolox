"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTableDropdown } from "@/components/data-table";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table";
import { formatCurrency, formatDate } from "@/lib/format";

export interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  payment: {
    id: string;
    amount: number;
    currency: string;
    date: string;
    reference: string | null;
    status: string;
    selectedInstallments: number | null;
    customer: {
      id: string;
      name: string;
    };
    paymentMethod: {
      id: string;
      name: string;
    };
    allocations: Array<{
      id: string;
      allocatedAmount: number;
      project: {
        id: string;
        projectNumber: string;
        projectName: string | null;
      };
    }>;
  };
}

interface ColumnsProps {
  locale?: string;
}

function InstallmentActionsCell({ installment }: { installment: Installment }) {
  return (
    <DataTableDropdown>
      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => navigator.clipboard.writeText(installment.id)}
      >
        Copiar ID de cuota
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigator.clipboard.writeText(installment.payment.id)}
      >
        Copiar ID de pago
      </DropdownMenuItem>
    </DataTableDropdown>
  );
}

export const createColumns = ({
  locale = "es-CL",
}: ColumnsProps = {}): ColumnDef<Installment>[] => [
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vencimiento" />
    ),
    cell: ({ row }) => {
      const { isOverdue } = row.original;

      return (
        <div className={isOverdue ? "text-red-600 font-medium" : ""}>
          {formatDate(row.getValue("dueDate"), "short", locale)}
          {isOverdue && <div className="text-xs">Vencido</div>}
        </div>
      );
    },
  },
  {
    accessorKey: "payment.customer.name",
    id: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.payment.customer.name}</span>
    ),
  },
  {
    id: "projects",
    header: "Proyectos",
    cell: ({ row }) => {
      const payment = row.original.payment;
      return (
        <div className="flex flex-col gap-1">
          {payment.allocations.map((alloc) => (
            <div key={alloc.id} className="text-sm">
              <span className="font-medium">{alloc.project.projectNumber}</span>
              {alloc.project.projectName && (
                <span className="text-muted-foreground">
                  {" "}
                  - {alloc.project.projectName}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "installmentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cuota" />
    ),
    cell: ({ row }) => {
      const total = row.original.payment.selectedInstallments || 1;
      return (
        <div className="text-center">
          <div className="font-medium">
            {row.getValue("installmentNumber")} / {total}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Monto" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const currency = row.original.payment.currency;
      return (
        <div className="text-right font-medium">
          {formatCurrency(amount, currency)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estado" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "paid" ? "success" : "secondary"}>
          {status === "paid" ? "Pagado" : "Pendiente"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "payment.paymentMethod.name",
    id: "paymentMethodName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Método de Pago" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.payment.paymentMethod.name}</span>
    ),
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const methodA = rowA.original.payment.paymentMethod.name;
      const methodB = rowB.original.payment.paymentMethod.name;
      return methodA.localeCompare(methodB);
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <InstallmentActionsCell installment={row.original} />,
  },
];
