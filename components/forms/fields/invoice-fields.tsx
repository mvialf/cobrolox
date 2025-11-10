"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/utils/invoice-utils";
import { type InvoiceFormData } from "@/lib/validations/invoice-validations";
import { InvoiceCreditField } from "@/components/forms/fields/invoice-credit-field";
import { InvoiceCustomerField } from "@/components/forms/fields/invoice-customer-field";

interface InvoiceFieldsProps {
  control: Control<InvoiceFormData>;
  isExemptFromTax?: boolean;
  onExemptChange?: (exempt: boolean) => void;
  /** ID del cliente pre-seleccionado (modo read-only en edición) */
  preselectedCustomerId?: string;
}

/**
 * Componente reutilizable que agrupa los campos básicos de una factura
 * Incluye: Número, Fecha, Subtotal, IVA y Total
 * Los campos IVA y Total son calculados automáticamente por el form padre
 */
export function InvoiceFields({
  control,
  isExemptFromTax = false,
  onExemptChange,
  preselectedCustomerId,
}: InvoiceFieldsProps) {
  // Obtener fecha máxima en formato yyyy-MM-dd para input type="date"
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-6 gap-4">
      {/* Número de Factura */}
      <FormField
        control={control}
        name="invoiceNumber"
        render={({ field }) => (
          <FormItem className="col-span-4">
            <FormLabel>
              Número de Factura <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} autoComplete="off" />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Fecha de Emisión */}
      <FormField
        control={control}
        name="issueDate"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>
              Fecha de Emisión <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                max={today}
                value={
                  field.value instanceof Date
                    ? field.value.toISOString().split("T")[0]
                    : field.value || ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    field.onChange(null);
                    return;
                  }

                  // Crear Date en timezone local a mediodía (12:00)
                  // Esto evita problemas de timezone: new Date("2025-11-06") crea medianoche UTC,
                  // que en Chile (UTC-3) sería el día anterior.
                  const [year, month, day] = value.split("-").map(Number);
                  const localDate = new Date(year, month - 1, day, 12, 0, 0);

                  field.onChange(localDate);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Cliente */}
      <InvoiceCustomerField
        control={control}
        preselectedCustomerId={preselectedCustomerId}
        className="col-span-6"
      />

      {/* Subtotal */}
      <FormField
        control={control}
        name="subtotal"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>
              Subtotal (sin IVA) <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <CurrencyInput
                value={field.value || 0}
                onChange={field.onChange}
                min={1}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* IVA (Calculado automáticamente) */}
      <FormField
        control={control}
        name="taxAmount"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>IVA (19%)</FormLabel>
            <FormControl>
              <CurrencyInput
                value={field.value || 0}
                onChange={field.onChange}
                disabled={!isExemptFromTax}
                className={
                  !isExemptFromTax ? "bg-muted cursor-not-allowed" : ""
                }
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Total (Calculado automáticamente) */}
      <FormField
        control={control}
        name="total"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>
              Total <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={
                  field.value ? formatCurrency(field.value) : formatCurrency(0)
                }
                disabled
                className="bg-muted font-semibold cursor-not-allowed"
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Días de Crédito */}
      <InvoiceCreditField control={control} className="col-span-2" />

      {/* Checkbox: Factura Exenta de IVA */}
      {onExemptChange && (
        <div className="col-span-6 flex items-center space-x-2">
          <Checkbox
            id="exempt-from-tax"
            checked={isExemptFromTax}
            onCheckedChange={(checked) => {
              onExemptChange(checked === true);
            }}
          />
          <label
            htmlFor="exempt-from-tax"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Factura exenta de IVA (permite editar el monto de IVA manualmente)
          </label>
        </div>
      )}
    </div>
  );
}
