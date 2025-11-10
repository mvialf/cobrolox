"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import {
  paymentToInvoiceSchema,
  type PaymentToInvoiceFormValues,
  type InvoiceWithBalance,
} from "@/lib/validations/payment-validations";
import { formatCurrency } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethodFields } from "@/components/forms/fields/payment-method-fields";
import { PaymentAmountDateFields } from "@/components/forms/fields/payment-amount-date-fields";
import { InvoiceSearchField } from "@/components/forms/search/invoice-search-field";

// ✅ Constantes fuera del componente para evitar re-renders infinitos
const EMPTY_PAYMENT_METHODS: Array<{
  id: string;
  name: string;
  hasInstallments: boolean;
  maxInstallments: number | null;
}> = [];

interface PaymentToInvoiceFormProps {
  onSubmit: (
    values: PaymentToInvoiceFormValues,
    invoice: InvoiceWithBalance,
  ) => void | Promise<void>;
  isSubmitting?: boolean;
  preselectedInvoiceId?: string;
}

/**
 * Formulario para "Pago a Factura" (1:1)
 *
 * Flujo donde el usuario:
 * 1. Selecciona una factura (o viene pre-seleccionada)
 * 2. El sistema auto-completa el monto con el saldo pendiente
 * 3. El usuario puede ajustar el monto si desea pagar parcialmente
 * 4. Selecciona método de pago y cuotas
 * 5. Registra el pago que se asigna 100% a esa factura
 */
export function PaymentToInvoiceForm({
  onSubmit,
  isSubmitting = false,
  preselectedInvoiceId,
}: PaymentToInvoiceFormProps) {
  // State para factura seleccionada
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceWithBalance | null>(null);

  // Form setup
  const defaultValues = useMemo(
    () => ({
      invoiceId: preselectedInvoiceId || "",
      amount: 0,
      date: new Date(),
      paymentMethodId: "",
      notes: "",
    }),
    [preselectedInvoiceId],
  );

  const form = useForm<PaymentToInvoiceFormValues>({
    resolver: zodResolver(paymentToInvoiceSchema),
    defaultValues,
  });

  // Fetch payment methods
  const { data: paymentMethodsData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error("Error al cargar métodos de pago");
      const data = await res.json();
      return data.paymentMethods || [];
    },
  });

  const paymentMethods = useMemo(
    () => paymentMethodsData || EMPTY_PAYMENT_METHODS,
    [paymentMethodsData],
  );

  // Auto-seleccionar el primer método de pago activo como default
  const currentPaymentMethodId = form.watch("paymentMethodId");

  useEffect(() => {
    if (!currentPaymentMethodId && paymentMethods.length > 0) {
      // El primer método activo (ya viene ordenado por active DESC, order ASC)
      const defaultMethod =
        paymentMethods.find((m: { active?: boolean }) => m.active) ||
        paymentMethods[0];
      if (defaultMethod) {
        form.setValue("paymentMethodId", defaultMethod.id);
      }
    }
  }, [paymentMethods, currentPaymentMethodId, form]);

  // Watch amount para validación
  const watchedAmount = form.watch("amount");

  // Handler: Reset installments cuando cambia método de pago
  const handlePaymentMethodChange = useCallback(() => {
    form.setValue("selectedInstallments", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler: Cuando se selecciona una factura, auto-completar monto
  const handleInvoiceSelect = useCallback(
    (invoice: InvoiceWithBalance | null) => {
      setSelectedInvoice(invoice);
      if (invoice) {
        form.setValue("amount", invoice.balance);
      } else {
        form.setValue("amount", 0);
      }
    },
    [form],
  );

  // Validación: Monto no puede exceder el balance
  const isAmountExceedingBalance =
    selectedInvoice &&
    watchedAmount > selectedInvoice.balance &&
    watchedAmount > 0;

  // Submit handler
  const handleSubmit = (values: PaymentToInvoiceFormValues) => {
    if (!selectedInvoice) {
      form.setError("invoiceId", {
        message: "Debe seleccionar una factura",
      });
      return;
    }

    if (values.amount <= 0) {
      form.setError("amount", {
        message: "El monto debe ser mayor a 0",
      });
      return;
    }

    if (values.amount > selectedInvoice.balance) {
      form.setError("amount", {
        message: "El monto no puede exceder el saldo pendiente de la factura",
      });
      return;
    }

    onSubmit(values, selectedInvoice);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        {/* 1. Factura: Búsqueda o Pre-seleccionada */}
        <InvoiceSearchField
          control={form.control}
          name="invoiceId"
          label="Factura"
          preselectedInvoiceId={preselectedInvoiceId}
          onInvoiceSelect={handleInvoiceSelect}
        />

        {/* Info de Factura Seleccionada */}
        {selectedInvoice && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="font-medium">
                {selectedInvoice.customer.razonSocial}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total Factura:
              </span>
              <span className="font-medium">
                {formatCurrency(
                  selectedInvoice.total,
                  selectedInvoice.currency,
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ya Pagado:</span>
              <span className="font-medium">
                {formatCurrency(
                  selectedInvoice.paidAmount,
                  selectedInvoice.currency,
                )}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-semibold">Saldo Pendiente:</span>
              <span className="font-bold text-lg">
                {formatCurrency(
                  selectedInvoice.balance,
                  selectedInvoice.currency,
                )}
              </span>
            </div>
          </div>
        )}

        {/* 2. Monto y Fecha */}
        <PaymentAmountDateFields
          control={form.control}
          currency={selectedInvoice?.currency}
          disabled={!selectedInvoice}
          amountLabel="Monto a Pagar *"
        />

        {/* Warning si el monto excede el balance */}
        {isAmountExceedingBalance && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El monto ingresado (
              {formatCurrency(watchedAmount, selectedInvoice.currency)}) excede
              el saldo pendiente de la factura (
              {formatCurrency(
                selectedInvoice.balance,
                selectedInvoice.currency,
              )}
              )
            </AlertDescription>
          </Alert>
        )}

        {/* 3. Método de Pago + Cuotas */}
        <PaymentMethodFields
          control={form.control}
          paymentMethods={paymentMethods}
          onPaymentMethodChange={handlePaymentMethodChange}
        />

        {/* 4. Notas (opcional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales sobre el pago..."
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit button */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedInvoice ||
              watchedAmount <= 0 ||
              !!isAmountExceedingBalance
            }
          >
            {isSubmitting ? "Registrando..." : "Registrar Pago"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
