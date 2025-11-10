"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  type PaymentToInvoiceFormValues,
  type InvoiceWithBalance,
  paymentToInvoiceToPayload,
} from "@/lib/validations/payment-validations";

import { PaymentToInvoiceForm } from "@/components/forms/payments/payment-to-invoice-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    values: PaymentToInvoiceFormValues,
    invoice: InvoiceWithBalance,
  ) => {
    try {
      setIsSubmitting(true);

      // Convertir form values a payload del API
      const payload = paymentToInvoiceToPayload(values, invoice);

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
        description: `Pago de ${values.amount} registrado a factura ${invoice.invoiceNumber}`,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago a Factura</DialogTitle>
          <DialogDescription>
            {preselectedInvoiceId
              ? "Registre un pago que se asignará completamente a esta factura."
              : "Registre un pago que se asignará completamente a una factura específica."}
          </DialogDescription>
        </DialogHeader>

        <PaymentToInvoiceForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          preselectedInvoiceId={preselectedInvoiceId}
        />
      </DialogContent>
    </Dialog>
  );
}
