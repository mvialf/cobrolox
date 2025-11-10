"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  type CustomerFormData,
} from "@/lib/validations/customer-validations";
import { Button } from "@/components/ui/button";
import { Form, FormRoot } from "@/components/ui/form";
import { CustomerFields } from "@/components/forms/fields/customer-fields";
import { AddressFields } from "@/components/forms/fields/address-fields";
import { useConfiguration } from "@/hooks/use-configuration";

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  defaultValues?: Partial<CustomerFormData>;
  submitLabel?: string;
  isLoading?: boolean;
}

/**
 * Formulario completo para crear/editar clientes
 * Incluye: datos de identificación, contacto y dirección
 */
export function CustomerForm({
  onSubmit,
  defaultValues,
  submitLabel = "Guardar",
  isLoading = false,
}: CustomerFormProps) {
  // Obtener configuración regional del usuario
  const { configuration } = useConfiguration();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      rut: defaultValues?.rut || "",
      razonSocial: defaultValues?.razonSocial || "",
      tradeName: defaultValues?.tradeName || "",
      businessActivity: defaultValues?.businessActivity || "",
      contact: defaultValues?.contact || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
      street: defaultValues?.street || "",
      apartment: defaultValues?.apartment || "",
      // Usar región de defaultValues si existe, sino usar la configurada en settings
      region: defaultValues?.region || configuration.region || "",
      comuna: defaultValues?.comuna || "",
    },
  });

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Sección: Datos del Cliente */}
        <div className="space-y-4 ">
          <CustomerFields control={form.control} showRut={true} />
          <AddressFields
            control={form.control}
            defaultRegion={defaultValues?.region || configuration.region || ""}
          />
        </div>

        {/* Botón Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Guardando..." : submitLabel}
        </Button>
      </FormRoot>
    </Form>
  );
}
