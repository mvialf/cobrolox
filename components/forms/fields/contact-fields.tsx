"use client";

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
import { PhoneInput } from "@/components/ui/phone-input";

interface ContactFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

/**
 * Componente reutilizable que agrupa los campos de contacto en un grid de 3 columnas
 * Incluye: Nombre de Contacto (opcional), Teléfono (obligatorio) y Email (opcional)
 */
export function ContactFields({ control }: ContactFieldsProps) {
  return (
    <FormGrid columns={3}>
      {/* Nombre de Contacto - Opcional */}
      <FormField
        control={control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Contacto</FormLabel>
            <FormControl>
              <Input {...field} autoComplete="name" value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Teléfono - Obligatorio */}
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Teléfono <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <PhoneInput {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Email - Opcional */}
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                autoComplete="email"
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormGrid>
  );
}
