"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CustomerForm } from "@/components/forms/customer/customer-form";
import { type CustomerFormData } from "@/lib/validations/customer-validations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateCustomer } from "@/hooks/queries/use-customers";

/**
 * Dialog modal para crear un nuevo cliente
 * Se muestra centrado en la pantalla con overlay
 */
export function NewCustomerDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateCustomer();

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setOpen(false);
    } catch (error) {
      // Error ya manejado por el hook (toast automático)
      console.error("Error creating customer:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <CustomerForm
            onSubmit={handleSubmit}
            submitLabel="Crear Cliente"
            isLoading={createMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
