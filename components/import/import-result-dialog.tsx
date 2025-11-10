"use client";

import { CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParseError {
  row: number;
  field?: string;
  message: string;
  value?: unknown;
}

interface ImportResult {
  success: boolean;
  imported?: number;
  summary?: {
    total: number;
    valid: number;
    invalid: number;
  };
  errors?: ParseError[];
  duplicates?: string[];
  missingCustomers?: string[];
  message?: string;
  error?: string;
}

interface GroupedError {
  message: string;
  invoiceNumbers: string[];
  field?: string;
  suggestion?: string;
}

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult;
  entityName?: string; // "facturas" | "clientes"
}

/**
 * Agrupa errores por mensaje para mostrarlos de forma más compacta
 *
 * Ejemplo:
 * Input:
 *   - { row: 2, field: "customerRut", message: "Cliente no existe", invoiceNumber: "F-001" }
 *   - { row: 3, field: "customerRut", message: "Cliente no existe", invoiceNumber: "F-002" }
 *
 * Output:
 *   - { message: "Cliente no existe", invoiceNumbers: ["F-001", "F-002"] }
 */
function groupErrorsByMessage(
  errors: ParseError[],
  entityType: string,
): GroupedError[] {
  const groups = new Map<string, GroupedError>();

  errors.forEach((error) => {
    const key = `${error.field}:${error.message}`;

    if (!groups.has(key)) {
      groups.set(key, {
        message: error.message,
        invoiceNumbers: [],
        field: error.field,
        suggestion: getSuggestionForError(error),
      });
    }

    // Extraer el número de factura/entidad de la fila
    const entityNumber = `${entityType}-${error.row}`;
    groups.get(key)!.invoiceNumbers.push(entityNumber);
  });

  return Array.from(groups.values());
}

/**
 * Genera sugerencias automáticas basadas en el tipo de error
 */
function getSuggestionForError(error: ParseError): string | undefined {
  if (error.field === "customerRut" && error.message.includes("no existe")) {
    return 'Importe estos clientes primero en la pestaña "Clientes"';
  }

  if (error.message.includes("duplicado")) {
    return "Elimine las filas duplicadas del archivo Excel";
  }

  return undefined;
}

/**
 * Formatea una lista de identificadores de entidades
 *
 * Ejemplos:
 * - ["F-001"] → "Factura 'F-001'"
 * - ["F-001", "F-002"] → "Facturas 'F-001' y 'F-002'"
 * - ["F-001", "F-002", "F-003"] → "Facturas 'F-001', 'F-002' y 'F-003'"
 * - ["F-001", ..., "F-010"] (10) → "Facturas 'F-001', 'F-002', ... y 8 más"
 */
function formatEntityList(
  entities: string[],
  entityName: string = "Factura",
): string {
  const entityNamePlural = `${entityName}s`;

  if (entities.length === 1) {
    return `${entityName} '${entities[0]}'`;
  }

  if (entities.length === 2) {
    return `${entityNamePlural} '${entities[0]}' y '${entities[1]}'`;
  }

  // Si son muchas, limitar la visualización a las primeras 5
  const maxToShow = 5;
  if (entities.length > maxToShow) {
    const shown = entities
      .slice(0, maxToShow)
      .map((e) => `'${e}'`)
      .join(", ");
    return `${entityNamePlural} ${shown} y ${entities.length - maxToShow} más`;
  }

  // Lista normal (3-5 elementos)
  const last = entities[entities.length - 1];
  const rest = entities
    .slice(0, -1)
    .map((e) => `'${e}'`)
    .join(", ");
  return `${entityNamePlural} ${rest} y '${last}'`;
}

/**
 * Dialog modal para mostrar resultados de importación
 *
 * Características:
 * - Agrupa errores por tipo
 * - Muestra sugerencias de solución
 * - Formato compacto y escaneable
 */
export function ImportResultDialog({
  open,
  onOpenChange,
  result,
  entityName = "Factura",
}: ImportResultDialogProps) {
  const groupedErrors = result.errors
    ? groupErrorsByMessage(result.errors, entityName)
    : [];

  const hasErrors = !result.success || (result.errors?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.success ? (
              <>
                <CheckCircle className="size-5 text-green-600" />
                Importación Completada
              </>
            ) : (
              <>
                <XCircle className="size-5 text-destructive" />
                Error en la Importación
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {result.success
              ? "Resultados del proceso de importación"
              : "No se pudo completar la importación"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Resumen */}
            {result.success && result.summary && (
              <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  {result.imported} de {result.summary.total}{" "}
                  {entityName.toLowerCase()}s importadas correctamente
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {result.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Errores agrupados */}
            {hasErrors && groupedErrors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>
                  Errores encontrados ({result.summary?.invalid ?? 0}{" "}
                  {entityName.toLowerCase()}s no importadas)
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-3 space-y-3">
                    {groupedErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        <strong className="font-semibold">
                          {formatEntityList(error.invoiceNumbers, entityName)}:
                        </strong>{" "}
                        {error.message}
                        {error.suggestion && (
                          <div className="mt-1 text-xs opacity-90">
                            → {error.suggestion}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Duplicados */}
            {result.duplicates && result.duplicates.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>Registros duplicados en el archivo</AlertTitle>
                <AlertDescription>
                  <p className="mb-2 text-sm">
                    Los siguientes números de {entityName.toLowerCase()} están
                    duplicados:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.duplicates.map((dup, i) => (
                      <Badge
                        key={i}
                        variant="destructive"
                        className="font-mono text-xs"
                      >
                        {dup}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Clientes faltantes (específico para invoices) */}
            {result.missingCustomers && result.missingCustomers.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>Clientes no encontrados</AlertTitle>
                <AlertDescription>
                  <p className="mb-2 text-sm">
                    Los siguientes clientes no existen en el sistema:
                  </p>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {result.missingCustomers.map((rut, i) => (
                      <Badge
                        key={i}
                        variant="destructive"
                        className="font-mono text-xs"
                      >
                        {rut}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs opacity-90">
                    → Importe estos clientes primero en la pestaña
                    &quot;Clientes&quot;
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Error general */}
            {result.error && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>Error del servidor</AlertTitle>
                <AlertDescription className="font-mono text-xs">
                  {result.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
