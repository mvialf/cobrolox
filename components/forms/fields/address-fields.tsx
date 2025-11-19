"use client";

import * as React from "react";
import { Control } from "react-hook-form";
import { Building } from "lucide-react";

import { getRegiones, getComunasByRegion } from "@/lib/regiones-chile";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddressFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultRegion?: string;
  /** Prefijo para nombres de campos (ej: "shipping" -> "shippingStreet") */
  fieldPrefix?: string;
  /** Título de la sección (ej: "Dirección de Despacho") */
  sectionTitle?: string;
  /** Si true, muestra asteriscos en labels. Default: true */
  isRequired?: boolean;
}

/**
 * Componente reutilizable para campos de dirección
 * Incluye: calle, casa/dpto, comuna, región
 */
export function AddressFields({
  control,
  defaultRegion,
  fieldPrefix = "",
  sectionTitle,
  isRequired = true,
}: AddressFieldsProps) {
  const regiones = getRegiones();

  // Helper para construir nombres de campos con prefix
  const fieldName = (name: string) =>
    fieldPrefix
      ? `${fieldPrefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`
      : name;

  // Helper para mostrar asterisco si es requerido
  const requiredMark = isRequired ? " *" : "";

  // Watch región para filtrar comunas
  const [selectedRegion, setSelectedRegion] = React.useState(
    defaultRegion || ""
  );

  // Extraer código de región del texto seleccionado
  const regionCodigo =
    regiones.find(
      (r) => `${r.nombre_corto} (${r.numero_romano})` === selectedRegion
    )?.codigo || "";

  const comunasDisponibles = regionCodigo
    ? getComunasByRegion(regionCodigo)
    : [];

  return (
    <div className="space-y-4">
      {/* Título de sección (opcional) */}
      {sectionTitle && (
        <h3 className="text-sm font-medium text-muted-foreground">
          {sectionTitle}
        </h3>
      )}

      {/* Grid: Calle (5) + Casa/Depto (1) */}
      <div className="grid grid-cols-6 gap-4">
        {/* Calle y numeración */}
        <FormField
          control={control}
          name={fieldName("street")}
          render={({ field }) => (
            <FormItem className="col-span-5 w-full">
              <FormLabel>Calle y numeración{requiredMark}</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Casa/Depto (opcional) */}
        <FormField
          control={control}
          name={fieldName("apartment")}
          render={({ field }) => (
            <FormItem className="col-span-1 w-full">
              <FormLabel>
                <Building className="h-4 w-4" />
              </FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Grid: Región + Comuna */}
      <div className="grid grid-cols-2 gap-4">
        {/* Comuna */}
        <FormField
          control={control}
          name={fieldName("comuna")}
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <FormLabel>Comuna{requiredMark}</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={comunasDisponibles}
                  getOptionValue={(c) => c.nombre}
                  getOptionLabel={(c) => c.nombre}
                  placeholder={
                    regionCodigo
                      ? "Selecciona una comuna..."
                      : "Primero selecciona una región"
                  }
                  searchPlaceholder="Buscar comuna..."
                  emptyMessage="No se encontró la comuna"
                  contentWidth="300px"
                  disabled={!regionCodigo}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Región */}
        <FormField
          control={control}
          name={fieldName("region")}
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <FormLabel>Región{requiredMark}</FormLabel>
              <FormControl>
                <Combobox
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedRegion(value);
                  }}
                  options={regiones.map((r) => ({
                    codigo: r.codigo,
                    displayText: `${r.nombre_corto} (${r.numero_romano})`,
                  }))}
                  getOptionValue={(r) => r.displayText}
                  getOptionLabel={(r) => r.displayText}
                  placeholder="Selecciona una región..."
                  searchPlaceholder="Buscar región..."
                  emptyMessage="No se encontró la región"
                  contentWidth="300px"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
