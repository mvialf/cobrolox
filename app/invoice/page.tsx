"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DataTable } from "@/components/data-table/data-table";
import { NewInvoiceDialog } from "@/components/dialogs/invoice/new-invoice-dialog";
import { columns, type Invoice } from "./columns";
import { useInvoices } from "@/hooks/queries/use-invoices";

export default function InvoicesPage() {
  const [showCompleted, setShowCompleted] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const { data, isLoading } = useInvoices({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    withBalance: true,
    includeCompleted: showCompleted,
  });

  const invoices = (data?.invoices || []) as unknown as Invoice[];

  // Filtros globales y lastInvoiceNumber del API (no de la página visible)
  const lastInvoiceNumber = data?.meta?.lastInvoiceNumber ?? undefined;

  const filterableColumns = [
    {
      id: "cliente",
      title: "Cliente",
      options: data?.filters?.customers ?? [],
    },
    {
      id: "estado",
      title: "Estado",
      options: data?.filters?.invoiceStatuses ?? [],
    },
    {
      id: "pago",
      title: "Pago",
      options: data?.filters?.paymentStatuses ?? [],
    },
  ];

  return (
    <AppLayout
      pageTitle="Facturas"
      breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Facturas" }]}
      action={<NewInvoiceDialog lastInvoiceNumber={lastInvoiceNumber} />}
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Cargando facturas...</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={invoices}
            searchKey="factura"
            searchPlaceholder="Buscar factura..."
            filterableColumns={filterableColumns}
            showCompleted={showCompleted}
            onToggleCompleted={setShowCompleted}
            initialColumnVisibility={{ pago: false }}
            manualPagination
            pageCount={data?.pagination.totalPages ?? 0}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        )}
      </div>
    </AppLayout>
  );
}
