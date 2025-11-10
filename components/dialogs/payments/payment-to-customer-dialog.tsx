"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  type PaymentToCustomerFormValues,
  paymentToCustomerToPayload,
} from "@/lib/validations/payment-validations";

import { PaymentToCustomerForm } from "@/components/forms/payments/payment-to-customer-form";
import {
  ScrollableDialog,
  ScrollableDialogContent,
  ScrollableDialogHeader,
  ScrollableDialogTitle,
  ScrollableDialogBody,
  ScrollableDialogFooter,
} from "@/components/ui/scrollable-dialog";
import { Button } from "@/components/ui/button";

interface PaymentToCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedCustomerId?: string; // ← NUEVO: Si viene, el cliente está pre-seleccionado
}

/**
 * Dialog para registro de "Pago a Cliente" (1:N)
 *
 * Maneja:
 * - Apertura/cierre del dialog
 * - Submit del formulario
 * - POST a /api/payments
 * - Toast de success/error
 * - Callback onSuccess (para refetch)
 */
export function PaymentToCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedCustomerId,
}: PaymentToCustomerDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    values: PaymentToCustomerFormValues,
    currency: string,
  ) => {
    try {
      setIsSubmitting(true);

      // Convertir form values a payload del API
      const payload = paymentToCustomerToPayload(values, currency);

      // POST /api/payments
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al registrar el pago");
      }

      // Success
      toast.success("Pago registrado exitosamente", {
        description: `Pago de ${currency} ${values.amount.toLocaleString()} distribuido entre ${values.allocations.length} proyecto${values.allocations.length !== 1 ? "s" : ""}`,
      });

      // Cerrar dialog
      onOpenChange(false);

      // Callback para refetch (si existe)
      onSuccess?.();

      // Refresh para actualizar data
      router.refresh();
    } catch (error: unknown) {
      console.error("Error submitting payment:", error);
      toast.error("Error al registrar el pago", {
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollableDialog open={open} onOpenChange={onOpenChange}>
      <ScrollableDialogContent className="w-2xl">
        <ScrollableDialogHeader>
          <ScrollableDialogTitle>
            Registrar Pago a Cliente
          </ScrollableDialogTitle>
        </ScrollableDialogHeader>

        <ScrollableDialogBody>
          <PaymentToCustomerForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            preselectedCustomerId={preselectedCustomerId}
            formId="payment-to-customer-form"
          />
        </ScrollableDialogBody>

        <ScrollableDialogFooter>
          <Button
            type="submit"
            form="payment-to-customer-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registrando..." : "Registrar Pago"}
          </Button>
        </ScrollableDialogFooter>
      </ScrollableDialogContent>
    </ScrollableDialog>
  );
}
