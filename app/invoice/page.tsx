"use client";

import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { DataTable } from "@/components/data-table/data-table";
import { NewInvoiceDialog } from "@/components/dialogs/invoice/new-invoice-dialog";
import { columns, type Invoice } from "./columns";
import { useInvoices } from "@/hooks/queries/use-invoices";

export default function InvoicesPage() {
  const [showCompleted, setShowCompleted] = useState(false);

  // ✅ React Query hook reemplaza state management manual
  const { data, isLoading } = useInvoices({
    withBalance: true,
    includeCompleted: showCompleted,
    limit: 1000,
  });

  // El tipo devuelto por la API coincide con el tipo Invoice del DataTable
  const invoices = useMemo(
    () => (data?.invoices || []) as unknown as Invoice[],
    [data?.invoices],
  );

  // Obtener el último número de factura
  const lastInvoiceNumber =
    invoices.length > 0 ? invoices[0].invoiceNumber : undefined;

  // Extraer opciones únicas para los filtros
  const filterableColumns = useMemo(() => {
    // Clientes únicos
    const uniqueCustomers = Array.from(
      new Map(
        invoices.map((inv) => [
          inv.customer.id,
          {
            value: inv.customer.id,
            label: inv.customer.razonSocial,
          },
        ]),
      ).values(),
    ).sort((a, b) => a.label.localeCompare(b.label));

    // Estados de factura únicos (Vigente, Vencida, Completada)
    const uniqueInvoiceStatuses = Array.from(
      new Set(invoices.map((inv) => inv.invoiceStatus.name)),
    )
      .map((statusName) => ({
        value: statusName,
        label: statusName,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Estados de pago únicos (Pago Pendiente, Pago Parcial, Pagada)
    const uniquePaymentStatuses = Array.from(
      new Set(invoices.map((inv) => inv.paymentInvoiceStatus.name)),
    )
      .map((statusName) => ({
        value: statusName,
        label: statusName,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [
      {
        id: "cliente",
        title: "Cliente",
        options: uniqueCustomers,
      },
      {
        id: "estado",
        title: "Estado",
        options: uniqueInvoiceStatuses,
      },
      {
        id: "pago",
        title: "Pago",
        options: uniquePaymentStatuses,
      },
    ];
  }, [invoices]);

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
          />
        )}
      </div>
    </AppLayout>
  );
}
