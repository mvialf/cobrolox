"use client";

import { Pencil } from "lucide-react";
import { CustomerForm } from "@/components/forms/customer/customer-form";
import { type CustomerFormData } from "@/lib/validations/customer-validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCustomer, useUpdateCustomer } from "@/hooks/queries/use-customers";

interface EditCustomerDialogProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog modal para editar un cliente existente
 * Usa React Query para fetch y update
 */
export function EditCustomerDialog({
  customerId,
  open,
  onOpenChange,
}: EditCustomerDialogProps) {
  // ✅ React Query hook para fetch customer
  const { data: customerData, isLoading: isFetching } = useCustomer(
    customerId || undefined,
  );

  // ✅ React Query hook para update customer
  const updateMutation = useUpdateCustomer();

  const handleSubmit = async (data: CustomerFormData) => {
    if (!customerId) return;

    try {
      await updateMutation.mutateAsync({ id: customerId, data });
      onOpenChange(false);
    } catch (error) {
      // Error ya manejado por el hook (toast automático)
      console.error("Error updating customer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {isFetching ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando datos...</div>
            </div>
          ) : customerData ? (
            <CustomerForm
              onSubmit={handleSubmit}
              defaultValues={{
                ...customerData,
                // Convertir null a undefined para el form
                tradeName: customerData.tradeName || undefined,
                email: customerData.email || undefined,
              }}
              submitLabel="Actualizar Cliente"
              isLoading={updateMutation.isPending}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
