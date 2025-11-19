"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  invoiceSchema,
  type InvoiceFormData,
} from "@/lib/validations/invoice-validations";
import { calculateTaxAmount, calculateTotal } from "@/lib/utils/invoice-utils";
import { Button } from "@/components/ui/button";
import { Form, FormRoot } from "@/components/ui/form";
import { InvoiceFields } from "@/components/forms/fields/invoice-fields";

interface InvoiceFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  defaultValues?: Partial<InvoiceFormData>;
  submitLabel?: string;
  isLoading?: boolean;
  /** ID del cliente pre-seleccionado (deshabilita selección en modo edición) */
  preselectedCustomerId?: string;
}

/**
 * Formulario completo para crear/editar facturas
 * Incluye cálculo automático de IVA y total en tiempo real
 *
 * Características:
 * - Cálculo automático de IVA (19%) basado en subtotal
 * - Cálculo automático de total (subtotal + IVA)
 * - Opción para facturas exentas de IVA
 * - Validación con Zod schema
 *
 * @example
 * <InvoiceForm
 *   onSubmit={handleSubmit}
 *   submitLabel="Crear Factura"
 * />
 */
export function InvoiceForm({
  onSubmit,
  defaultValues,
  submitLabel = "Guardar",
  isLoading = false,
  preselectedCustomerId,
}: InvoiceFormProps) {
  // Estado para controlar si la factura está exenta de IVA
  const [isExemptFromTax, setIsExemptFromTax] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: defaultValues?.invoiceNumber || "",
      issueDate: defaultValues?.issueDate || new Date(),
      dueDate:
        defaultValues?.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días por defecto
      subtotal: defaultValues?.subtotal || 0,
      taxAmount: defaultValues?.taxAmount || 0,
      total: defaultValues?.total || 0,
      customerId: defaultValues?.customerId || "",
      statusId: defaultValues?.statusId, // Opcional - se calcula en backend si no se proporciona
      termsDay: defaultValues?.termsDay ?? 30, // Valor por defecto: 30 días (solo UI)
    },
  });

  // Watch para detectar cambios en campos clave
  const subtotal = form.watch("subtotal");
  const taxAmount = form.watch("taxAmount");
  const issueDate = form.watch("issueDate");
  const termsDay = form.watch("termsDay");

  /**
   * Efecto para calcular automáticamente la fecha de vencimiento (dueDate)
   * Se ejecuta cada vez que cambia issueDate o termsDay
   */
  useEffect(() => {
    if (issueDate && termsDay !== undefined) {
      // Calcular dueDate = issueDate + termsDay días
      const calculatedDueDate = new Date(
        issueDate.getTime() + termsDay * 24 * 60 * 60 * 1000
      );
      form.setValue("dueDate", calculatedDueDate, { shouldValidate: false });
    }
  }, [issueDate, termsDay, form]);

  /**
   * Efecto para calcular automáticamente IVA y Total
   * Se ejecuta cada vez que cambia el subtotal o el estado de exención
   */
  useEffect(() => {
    // Si no está exenta, calcular IVA automáticamente
    if (!isExemptFromTax && subtotal > 0) {
      const calculatedTax = calculateTaxAmount(subtotal);
      form.setValue("taxAmount", calculatedTax, { shouldValidate: false });
    }

    // Si está exenta y el usuario no ha editado el IVA, ponerlo en 0
    if (isExemptFromTax && taxAmount === calculateTaxAmount(subtotal)) {
      form.setValue("taxAmount", 0, { shouldValidate: false });
    }
  }, [subtotal, isExemptFromTax, form, taxAmount]);

  /**
   * Efecto para calcular automáticamente el Total
   * Se ejecuta cada vez que cambia el subtotal o el taxAmount
   */
  useEffect(() => {
    const currentTax = form.getValues("taxAmount");
    const calculatedTotal = calculateTotal(subtotal, currentTax);
    form.setValue("total", calculatedTotal, { shouldValidate: false });
  }, [subtotal, taxAmount, form]);

  /**
   * Maneja el cambio del checkbox de exención de IVA
   */
  const handleExemptChange = (exempt: boolean) => {
    setIsExemptFromTax(exempt);
    if (exempt) {
      // Si se marca como exenta, permitir edición manual del IVA
      // pero sugerir 0 como valor inicial
      form.setValue("taxAmount", 0, { shouldValidate: false });
    } else {
      // Si se desmarca, recalcular el IVA automáticamente
      const calculatedTax = calculateTaxAmount(subtotal);
      form.setValue("taxAmount", calculatedTax, { shouldValidate: false });
    }
  };

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos de la factura */}
        <div className="space-y-4">
          <InvoiceFields
            control={form.control}
            isExemptFromTax={isExemptFromTax}
            onExemptChange={handleExemptChange}
            preselectedCustomerId={preselectedCustomerId}
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
