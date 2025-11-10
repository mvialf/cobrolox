"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { InvoiceForm } from "@/components/forms/invoice/invoice-form";
import { type InvoiceFormData } from "@/lib/validations/invoice-validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateInvoice } from "@/hooks/queries/use-invoices";

interface NewInvoiceDialogProps {
  lastInvoiceNumber?: string;
}

/**
 * Dialog modal para crear una nueva factura
 * Se muestra centrado en la pantalla con overlay
 */
export function NewInvoiceDialog({ lastInvoiceNumber }: NewInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateInvoice();

  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setOpen(false);
    } catch (error) {
      // Error ya manejado por el hook (toast automático)
      console.error("Error creating invoice:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Factura</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <InvoiceForm
            onSubmit={handleSubmit}
            submitLabel="Crear Factura"
            isLoading={createMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
