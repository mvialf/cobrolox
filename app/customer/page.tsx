"use client";

import { useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { NewCustomerDialog } from "@/components/dialogs/customer/new-customer-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { columns, type Customer } from "./columns";
import { useCustomers, useDeleteCustomer } from "@/hooks/queries/use-customers";

export default function CustomersPage() {
  // ✅ React Query hooks reemplazan state management manual
  const { data, isLoading } = useCustomers({ limit: 1000 });
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
