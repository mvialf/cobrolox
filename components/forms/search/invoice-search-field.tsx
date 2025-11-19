"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { type Control, useController } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  parseInvoicesWithBalance,
  type InvoiceWithBalance,
} from "@/lib/validations/payment-validations";

interface InvoiceSearchFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name?: string;
  label?: string;
  disabled?: boolean;
  onInvoiceSelect?: (invoice: InvoiceWithBalance | null) => void;
  preselectedInvoiceId?: string;
}

/**
 * Campo de búsqueda de facturas con saldo pendiente
 *
 * Características:
 * - Combobox con búsqueda
 * - Muestra solo facturas con balance > 0
 * - Formato: "F-001 | Cliente ABC | $100.000"
 * - Callback cuando se selecciona una factura
 */
export function InvoiceSearchField({
  control,
  name = "invoiceId",
  label = "Factura",
  disabled = false,
  onInvoiceSelect,
  preselectedInvoiceId,
}: InvoiceSearchFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { field } = useController({
    name,
    control,
  });

  // Fetch facturas pendientes
  const { data, isLoading } = useQuery({
    queryKey: ["invoices-pending", search],
    queryFn: async () => {
      const params = new URLSearchParams({
        withBalance: "true",
        pendingOnly: "true",
        limit: "100",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/invoices?${params}`);
      if (!res.ok) throw new Error("Error al cargar facturas");
      const data = await res.json();
      return parseInvoicesWithBalance(data.invoices || []);
    },
  });

  const invoices = data || [];

  // Si hay preselectedInvoiceId, cargar esa factura específica
  const { data: preselectedInvoice } = useQuery({
    queryKey: ["invoice", preselectedInvoiceId],
    queryFn: async () => {
      if (!preselectedInvoiceId) return null;
      const res = await fetch(
        `/api/invoices?id=${preselectedInvoiceId}&withBalance=true`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.invoices && data.invoices.length > 0) {
        return parseInvoicesWithBalance(data.invoices)[0];
      }
      return null;
    },
    enabled: !!preselectedInvoiceId,
  });

  // Auto-seleccionar factura pre-seleccionada
  useEffect(() => {
    if (preselectedInvoice) {
      // Solo actualizar el campo si es diferente al valor actual
      if (field.value !== preselectedInvoice.id) {
        field.onChange(preselectedInvoice.id);
      }
      // SIEMPRE notificar la selección (incluso si el valor ya existe desde defaultValues)
      // Esto asegura que el formulario padre actualice su estado (selectedInvoice, amount, etc.)
      onInvoiceSelect?.(preselectedInvoice);
    }
    // Solo ejecutar cuando preselectedInvoice.id cambia, no cuando field/onInvoiceSelect se recrean
    // field.onChange es estable, onInvoiceSelect siempre usa la versión más reciente del closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedInvoice?.id]);

  const selectedInvoice =
    preselectedInvoice ||
    invoices.find((inv) => inv.id === field.value) ||
    null;

  return (
    <FormField
      control={control}
      name={name}
      render={() => (
        <FormItem className="flex flex-col">
          <FormLabel>{label} *</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled || !!preselectedInvoiceId}
                  className={cn(
                    "justify-between",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {selectedInvoice ? (
                    <span className="truncate">
                      {selectedInvoice.invoiceNumber} |{" "}
                      {selectedInvoice.customer.razonSocial} |{" "}
                      {formatCurrency(
                        selectedInvoice.balance,
                        selectedInvoice.currency,
                      )}
                    </span>
                  ) : (
                    "Seleccione una factura..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar factura..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoading ? "Buscando..." : "No se encontraron facturas"}
                  </CommandEmpty>
                  <CommandGroup>
                    {invoices.map((invoice) => (
                      <CommandItem
                        key={invoice.id}
                        value={invoice.id}
                        onSelect={() => {
                          field.onChange(invoice.id);
                          onInvoiceSelect?.(invoice);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            invoice.id === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">
                            {invoice.invoiceNumber}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {invoice.customer.razonSocial} |{" "}
                            {formatCurrency(invoice.balance, invoice.currency)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
