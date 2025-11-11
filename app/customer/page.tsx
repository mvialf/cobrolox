"use client";

import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { NewCustomerDialog } from "@/components/dialogs/customer/new-customer-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { columns, type Customer } from "./columns";
import { useCustomers, useDeleteCustomer } from "@/hooks/queries/use-customers";

export default function CustomersPage() {
  // Server-side pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  // ✅ React Query con paginación real
  const { data, isLoading } = useCustomers({
    page: pagination.pageIndex + 1, // TanStack usa 0-index, backend usa 1-index
    limit: pagination.pageSize,
  });
  const deleteMutation = useDeleteCustomer();

  // Extraer data del hook (con fallbacks) y cast a tipo local
  const customers = useMemo(
    () => (data?.customers || []) as Customer[],
    [data?.customers],
  );

  const handleCustomerDeleted = async (customerId: string) => {
    await deleteMutation.mutateAsync(customerId);
  };

  return (
    <AppLayout
      pageTitle="Clientes"
      breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Clientes" }]}
      action={<NewCustomerDialog />}
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Cargando clientes...</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            searchKey="cliente"
            searchPlaceholder="Buscar cliente..."
            manualPagination
            pageCount={data?.pagination?.totalPages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
            meta={{
              handleDelete: handleCustomerDeleted,
              deletingCustomerId: deleteMutation.variables || null,
              onCustomerUpdated: () => {}, // Deprecated: React Query invalida automáticamente
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
