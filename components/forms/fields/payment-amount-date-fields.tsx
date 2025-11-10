"use client";

import * as React from "react";
import { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormGrid } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";

interface PaymentAmountDateFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  currency?: string;
  disabled?: boolean;
  amountLabel?: string;
  dateLabel?: string;
}

/**
 * Componente reutilizable para campos de monto y fecha de pago
 * Incluye: CurrencyInput + date input en FormGrid(2)
 *
 * Usado en formularios de pagos para capturar el monto y fecha del pago.
 */
export function PaymentAmountDateFields({
  control,
  currency,
  disabled = false,
  amountLabel = "Monto del Pago *",
  dateLabel = "Fecha del Pago *",
}: PaymentAmountDateFieldsProps) {
  return (
    <FormGrid columns={2}>
      {/* Monto del Pago */}
      <FormField
        control={control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{amountLabel}</FormLabel>
            <FormControl>
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                currency={currency}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Fecha del Pago */}
      <FormField
        control={control}
        name="date"
        render={({ field }) => {
          // Helper para verificar si es un Date válido
          const isValidDate = (date: unknown): date is Date => {
            return date instanceof Date && !isNaN(date.getTime());
          };

          return (
            <FormItem>
              <FormLabel>{dateLabel}</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={
                    isValidDate(field.value)
                      ? field.value.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) {
                      field.onChange("");
                      return;
                    }

                    // Crear Date en timezone local a mediodía (12:00)
                    // Esto evita problemas de timezone: new Date("2025-11-06") crea medianoche UTC,
                    // que en Chile (UTC-3) sería el día anterior. Al usar componentes del date
                    // y especificar mediodía, se crea en timezone local.
                    const [year, month, day] = value.split("-").map(Number);
                    const localDate = new Date(year, month - 1, day, 12, 0, 0);

                    field.onChange(localDate);
                  }}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </FormGrid>
  );
}
