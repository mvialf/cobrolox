"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { InvoiceForm } from "@/components/forms/invoice/invoice-form";
import { type InvoiceFormData } from "@/lib/validations/invoice-validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface InvoiceWithPayments {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  statusId: string;
  notes: string | null;
  allocatedAmount: number;
  balance: number;
  status: {
    id: string;
    name: string;
    isFinal: boolean;
  };
}

interface EditInvoiceDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceUpdated: () => void;
}

/**
 * Dialog modal para editar una factura existente
 *
 * Reglas de negocio:
 * - NO permite editar si tiene pagos aplicados (allocatedAmount > 0)
 * - NO permite editar si está en estado final (Pagada/Anulada)
 * - Muestra mensaje claro cuando no es editable
 *
 * Características:
 * - Fetch de datos al abrir con cálculo de allocatedAmount
 * - Validación de permisos antes de mostrar form
 * - Reutiliza InvoiceForm con datos prellenados
 * - Toast de éxito/error apropiados
 */
export function EditInvoiceDialog({
  invoiceId,
  open,
  onOpenChange,
  onInvoiceUpdated,
}: EditInvoiceDialogProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceWithPayments | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch invoice data cuando se abre el dialog
  useEffect(() => {
    if (!invoiceId || !open) {
      setInvoiceData(null);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(`/api/invoices/${invoiceId}`);

        if (!response.ok) {
          throw new Error("Error al cargar factura");
        }

        const data = await response.json();
        setInvoiceData(data);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Error al cargar datos de la factura");
        onOpenChange(false);
      } finally {
        setIsFetching(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, open, onOpenChange]);

  // Validar si la factura es editable
  const isEditable = invoiceData
    ? invoiceData.allocatedAmount === 0 && !invoiceData.status.isFinal
    : false;

  const getNotEditableReason = (): string | null => {
    if (!invoiceData) return null;

    if (invoiceData.allocatedAmount > 0) {
      return "Esta factura tiene pagos aplicados y no puede ser editada. Elimine los pagos primero.";
    }

    if (invoiceData.status.isFinal) {
      return `Esta factura está en estado "${invoiceData.status.name}" y no puede ser editada.`;
    }

    return null;
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    if (!invoiceId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar factura");
      }

      toast.success("Factura actualizada correctamente");
      onInvoiceUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar factura",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Factura
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando datos...</div>
            </div>
          ) : invoiceData ? (
            isEditable ? (
              <InvoiceForm
                onSubmit={handleSubmit}
                defaultValues={{
                  invoiceNumber: invoiceData.invoiceNumber,
                  issueDate: new Date(invoiceData.issueDate),
                  dueDate: new Date(invoiceData.dueDate),
                  subtotal: Number(invoiceData.subtotal),
                  taxAmount: Number(invoiceData.taxAmount),
                  total: Number(invoiceData.total),
                  customerId: invoiceData.customerId,
                  statusId: invoiceData.statusId,
                  termsDay: Math.ceil(
                    (new Date(invoiceData.dueDate).getTime() -
                      new Date(invoiceData.issueDate).getTime()) /
                      (1000 * 60 * 60 * 24),
                  ),
                }}
                preselectedCustomerId={invoiceData.customerId}
                submitLabel="Actualizar Factura"
                isLoading={isLoading}
              />
            ) : (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive font-medium">
                  {getNotEditableReason()}
                </p>
              </div>
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
