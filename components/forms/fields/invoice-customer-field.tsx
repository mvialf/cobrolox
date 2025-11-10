"use client";

import * as React from "react";
import { Control } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { useDebounce } from "@/hooks/use-debounce";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { CustomerNameInfo } from "@/components/summarys/customer/customer-name-info";
import { type InvoiceFormData } from "@/lib/validations/invoice-validations";

/**
 * Tipo de datos de Customer extendido con todos los campos fiscales necesarios para facturas
 */
interface CustomerFiscal {
  id: string;
  rut: string;
  razonSocial: string;
  tradeName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface InvoiceCustomerFieldProps {
  control: Control<InvoiceFormData>;
  preselectedCustomerId?: string;
  onCustomerSelect?: (customer: CustomerFiscal | null) => void;
  required?: boolean;
  className?: string;
}

/**
 * Componente especializado para selección de cliente en facturas
 *
 * Diferencias con CustomerSearchField:
 * - Muestra CustomerNameInfo (RUT + Razón Social) en vez de CustomerNameSummary (contacto)
 * - Enfocado en datos fiscales necesarios para facturación
 * - Busca en rut, razonSocial, tradeName (además de email/phone)
 *
 * Arquitectura:
 * - Reutiliza la misma API /api/customers que ya busca en los campos correctos
 * - Maneja server-side search con debounce
 * - Soporta modo pre-seleccionado (read-only) y modo búsqueda
 *
 * @example
 * <InvoiceCustomerField
 *   control={form.control}
 *   onCustomerSelect={(customer) => console.log(customer.rut)}
 * />
 */
export function InvoiceCustomerField({
  control,
  preselectedCustomerId,
  onCustomerSelect,
  required = true,
  className,
}: InvoiceCustomerFieldProps) {
  // State para búsqueda de clientes
  const [customerSearch, setCustomerSearch] = React.useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  // State para cliente seleccionado
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<CustomerFiscal | null>(null);

  // Fetch cliente pre-seleccionado (si viene el ID)
  const { data: preselectedCustomer, isLoading: loadingPreselected } = useQuery(
    {
      queryKey: ["customer", preselectedCustomerId],
      queryFn: async () => {
        const res = await fetch(`/api/customers/${preselectedCustomerId}`);
        if (!res.ok) throw new Error("Error al cargar el cliente");
        return res.json() as Promise<CustomerFiscal>;
      },
      enabled: !!preselectedCustomerId,
    },
  );

  // Fetch clientes (server-side search) - solo si NO hay cliente pre-seleccionado
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-search-invoice", debouncedCustomerSearch],
    queryFn: async () => {
      const res = await fetch(
        `/api/customers?search=${debouncedCustomerSearch}&limit=20`,
      );
      if (!res.ok) throw new Error("Error al buscar clientes");
      const data = await res.json();
      return (data.customers || []) as CustomerFiscal[];
    },
    enabled: !preselectedCustomerId && debouncedCustomerSearch.length >= 2,
  });

  // Cuando cambia el cliente seleccionado o llega el cliente pre-seleccionado
  React.useEffect(() => {
    // Si hay cliente pre-seleccionado y ya se cargó
    if (preselectedCustomerId && preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
      onCustomerSelect?.(preselectedCustomer);
    }
  }, [preselectedCustomerId, preselectedCustomer, onCustomerSelect]);

  // Callback cuando se selecciona un cliente del Combobox
  const handleCustomerChange = (customerId: string) => {
    const customer = customersData?.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      onCustomerSelect?.(customer);
    } else {
      setSelectedCustomer(null);
      onCustomerSelect?.(null);
    }
  };

  return (
    <>
      {/* 1. Cliente: Mostrar CustomerNameInfo si está pre-seleccionado, sino Combobox */}
      {preselectedCustomerId ? (
        // Cliente pre-seleccionado (no editable)
        <div className={`space-y-2 ${className || ""}`}>
          <FormLabel>Cliente</FormLabel>
          {loadingPreselected ? (
            <div className="text-sm text-muted-foreground">
              Cargando cliente...
            </div>
          ) : selectedCustomer ? (
            <div className="rounded-lg border bg-muted/50 p-3">
              <CustomerNameInfo
                rut={selectedCustomer.rut}
                razonSocial={selectedCustomer.razonSocial}
                tradeName={selectedCustomer.tradeName || undefined}
              />
            </div>
          ) : (
            <div className="text-sm text-destructive">
              Error al cargar el cliente
            </div>
          )}
        </div>
      ) : (
        // Combobox normal (búsqueda de clientes)
        <FormField
          control={control}
          name="customerId"
          render={({ field }) => (
            <FormItem className={className}>
              <FormLabel>
                Cliente{" "}
                {required && <span className="text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Combobox<CustomerFiscal>
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleCustomerChange(value);
                  }}
                  options={customersData || []}
                  getOptionValue={(c) => c.id}
                  getOptionLabel={(c) => {
                    // Mostrar: RUT - Razón Social (o Nombre Fantasía si existe)
                    const displayName = c.tradeName || c.razonSocial;
                    return `${c.rut} - ${displayName}`;
                  }}
                  renderOption={(c) => (
                    <CustomerNameInfo
                      rut={c.rut}
                      razonSocial={c.razonSocial}
                      tradeName={c.tradeName || undefined}
                    />
                  )}
                  placeholder="Buscar cliente..."
                  searchPlaceholder="Escribe RUT, razón social o nombre..."
                  emptyMessage={
                    debouncedCustomerSearch.length < 2
                      ? "Escribe al menos 2 caracteres para buscar"
                      : "No se encontraron clientes"
                  }
                  loading={loadingCustomers}
                  loadingText="Buscando clientes..."
                  contentWidth="450px"
                  onSearchChange={setCustomerSearch}
                  disableFiltering={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
