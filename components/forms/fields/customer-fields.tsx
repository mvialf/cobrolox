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
import { PhoneInput } from "@/components/ui/phone-input";
import { RutInput } from "@/components/ui/rut-input";
import { type CustomerFormData } from "@/lib/validations/customer-validations";

interface CustomerFieldsProps {
  control: Control<CustomerFormData>;
  showRut?: boolean;
}

/**
 * Componente reutilizable que agrupa los campos básicos de un customer
 * Incluye: RUT (opcional), Razón Social, Contacto, Teléfono y Email
 */
export function CustomerFields({
  control,
  showRut = true,
}: CustomerFieldsProps) {
  return (
    <div className="grid grid-cols-6 gap-4">
      {/* Razón Social */}
      <FormField
        control={control}
        name="razonSocial"
        render={({ field }) => (
          <FormItem className="col-span-4">
            <FormLabel>
              Razón Social <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} autoComplete="organization" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* RUT */}
      {showRut && (
        <FormField
          control={control}
          name="rut"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>
                RUT <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <RutInput
                  value={field.value || ""}
                  onRutChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Nombre de Fantasía */}
      <FormField
        control={control}
        name="tradeName"
        render={({ field }) => (
          <FormItem className="col-span-3">
            <FormLabel>Nombre Comercial</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Actividad Económica */}
      <FormField
        control={control}
        name="businessActivity"
        render={({ field }) => (
          <FormItem className="col-span-3">
            <FormLabel>Actividad Económica</FormLabel>
            <FormControl>
              <Input {...field} value={field.value || ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Persona de Contacto */}
      <FormField
        control={control}
        name="contact"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>
              Contacto <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input {...field} autoComplete="name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Teléfono */}
      <FormField
        control={control}
        name="phone"
        render={({ field }) => (
          <FormItem className="col-span-2">
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
          <FormItem className="col-span-2">
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
    </div>
  );
}
