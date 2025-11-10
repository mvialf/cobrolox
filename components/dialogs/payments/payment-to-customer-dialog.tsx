"use client";

import { useRouter } from "next/navigation";

import {
  type PaymentToCustomerFormValues,
  paymentToCustomerToPayload,
} from "@/lib/validations/payment-validations";
import { useCreatePayment } from "@/hooks/queries/use-payments";

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
  const createPayment = useCreatePayment();

  const handleSubmit = async (
    values: PaymentToCustomerFormValues,
    currency: string,
  ) => {
    try {
      // Convertir form values a payload del API
      const payload = paymentToCustomerToPayload(values, currency);

      // Usar hook de React Query que maneja:
      // - POST a /api/payments
      // - Invalidación automática de queries relacionadas
      // - Toast de éxito/error
      // - Estado de loading
      await createPayment.mutateAsync(payload);

      // Cerrar dialog
      onOpenChange(false);

      // Callback para refetch (si existe)
      onSuccess?.();

      // Refresh para actualizar Server Components (si los hay)
      router.refresh();
    } catch (error: unknown) {
      // El error ya fue manejado por useCreatePayment (toast automático)
      console.error("Error submitting payment:", error);
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
            isSubmitting={createPayment.isPending}
            preselectedCustomerId={preselectedCustomerId}
            formId="payment-to-customer-form"
          />
        </ScrollableDialogBody>

        <ScrollableDialogFooter>
          <Button
            type="submit"
            form="payment-to-customer-form"
            disabled={createPayment.isPending}
          >
            {createPayment.isPending ? "Registrando..." : "Registrar Pago"}
          </Button>
        </ScrollableDialogFooter>
      </ScrollableDialogContent>
    </ScrollableDialog>
  );
}
