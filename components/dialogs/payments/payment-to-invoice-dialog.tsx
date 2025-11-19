"use client";

import { useRouter } from "next/navigation";

import {
  type PaymentToInvoiceFormValues,
  type InvoiceWithBalance,
  paymentToInvoiceToPayload,
} from "@/lib/validations/payment-validations";
import { useCreatePayment } from "@/hooks/queries/use-payments";

import { PaymentToInvoiceForm } from "@/components/forms/payments/payment-to-invoice-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedInvoiceId?: string; // ← NUEVO: Factura pre-seleccionada desde tabla
}

/**
 * Dialog para registro de "Pago a Factura" (1:1)
 *
 * Maneja:
 * - Apertura/cierre del dialog
 * - Submit del formulario
 * - POST a /api/payments
 * - Toast de success/error
 * - Callback onSuccess (para refetch)
 *
 * Si viene `preselectedInvoiceId`, la factura estará pre-seleccionada
 * y el usuario no podrá cambiarla (flujo desde tabla de facturas)
 */
export function PaymentToInvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedInvoiceId,
}: PaymentToInvoiceDialogProps) {
  const router = useRouter();
  const createPayment = useCreatePayment();

  const handleSubmit = async (
    values: PaymentToInvoiceFormValues,
    invoice: InvoiceWithBalance
  ) => {
    try {
      // Convertir form values a payload del API
      const payload = paymentToInvoiceToPayload(values, invoice);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago a Factura</DialogTitle>
        </DialogHeader>

        <PaymentToInvoiceForm
          onSubmit={handleSubmit}
          isSubmitting={createPayment.isPending}
          preselectedInvoiceId={preselectedInvoiceId}
        />
      </DialogContent>
    </Dialog>
  );
}
