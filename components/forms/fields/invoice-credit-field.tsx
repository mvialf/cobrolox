"use client";

import { useState } from "react";
import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { type InvoiceFormData } from "@/lib/validations/invoice-validations";

interface InvoiceCreditFieldProps {
  control: Control<InvoiceFormData>;
  required?: boolean;
  className?: string;
}

/**
 * Componente reutilizable para el campo de términos de crédito de una factura
 * Permite seleccionar días de crédito comunes (0, 30, 60, 90) o ingresar un valor personalizado
 */
export function InvoiceCreditField({
  control,
  required = true,
  className,
}: InvoiceCreditFieldProps) {
  const [isCustom, setIsCustom] = useState(false);

  const commonTerms = [
    { value: "0", label: "Contado (0 días)" },
    { value: "30", label: "30 días" },
    { value: "60", label: "60 días" },
    { value: "90", label: "90 días" },
  ];

  return (
    <FormField
      control={control}
      name="termsDay"
      render={({ field }) => {
        // Verificar si el valor actual es personalizado
        const currentValue = field.value?.toString() || "0";
        const isCommonTerm = commonTerms.some(
          (term) => term.value === currentValue,
        );

        // Si el valor no está en los términos comunes y no está en modo personalizado, activar modo personalizado
        if (!isCommonTerm && !isCustom && field.value !== undefined) {
          setIsCustom(true);
        }

        return (
          <FormItem className={className}>
            <FormLabel>
              Días de Crédito{" "}
              {required && <span className="text-destructive">*</span>}
            </FormLabel>
            {isCustom ? (
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseInt(value, 10));
                    }}
                    className="flex-1"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    field.onChange(30); // Valor por defecto al salir del modo personalizado
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 border rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <Select
                value={currentValue}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setIsCustom(true);
                    field.onChange(0);
                  } else {
                    field.onChange(parseInt(value, 10));
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar plazo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commonTerms.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Personalizado...</SelectItem>
                </SelectContent>
              </Select>
            )}

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
