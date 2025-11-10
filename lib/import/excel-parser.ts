import { read, utils } from "xlsx";

/**
 * Resultado del parsing de Excel
 */
export interface ParseResult<T> {
  data: T[];
  errors: ParseError[];
  meta: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

/**
 * Error de parsing o validación
 */
export interface ParseError {
  row: number;
  field?: string;
  message: string;
  value?: unknown;
}

/**
 * Opciones de configuración para el parser
 */
export interface ParseOptions {
  sheetIndex?: number; // Índice de la hoja a leer (default: 0)
  skipEmptyLines?: boolean;
  raw?: boolean; // Si es true, mantiene valores originales. Si es false, convierte todo a string
}

/**
 * Parsea un archivo Excel y devuelve los datos con errores si los hay
 */
export async function parseExcel<T>(
  file: File,
  options: ParseOptions = {},
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    const errors: ParseError[] = [];
    const { sheetIndex = 0, raw = false } = options;

    file
      .arrayBuffer()
      .then((buffer) => {
        try {
          // Leer archivo Excel
          const wb = read(buffer, {
            type: "array",
            cellDates: true, // Parsear fechas automáticamente
            cellNF: false,
            cellText: false,
          });

          // Validar que exista la hoja
          if (!wb.SheetNames[sheetIndex]) {
            return resolve({
              data: [],
              errors: [
                {
                  row: -1,
                  message: `La hoja ${sheetIndex} no existe en el archivo`,
                },
              ],
              meta: {
                totalRows: 0,
                validRows: 0,
                invalidRows: 1,
              },
            });
          }

          // Obtener la hoja especificada
          const ws = wb.Sheets[wb.SheetNames[sheetIndex]];

          // Convertir a JSON (array de objetos)
          // raw: false convierte todo a strings (útil para validación posterior)
          // defval: "" asigna string vacío a celdas vacías
          const data = utils.sheet_to_json<T>(ws, {
            raw,
            defval: "",
            blankrows: false, // No incluir filas completamente vacías
          });

          resolve({
            data,
            errors,
            meta: {
              totalRows: data.length,
              validRows: data.length,
              invalidRows: 0,
            },
          });
        } catch (error) {
          resolve({
            data: [],
            errors: [
              {
                row: -1,
                message: `Error al parsear archivo Excel: ${error instanceof Error ? error.message : "Error desconocido"}`,
              },
            ],
            meta: {
              totalRows: 0,
              validRows: 0,
              invalidRows: 1,
            },
          });
        }
      })
      .catch((error) => {
        resolve({
          data: [],
          errors: [
            {
              row: -1,
              message: `Error al leer archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
            },
          ],
          meta: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 1,
          },
        });
      });
  });
}

/**
 * Valida que un valor no esté vacío
 */
export function isNotEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return true;
}

/**
 * Convierte un string a Decimal (número) validando el formato
 */
export function parseDecimal(value: string): number | null {
  if (!value || value.trim() === "") return null;

  // Remover separadores de miles y reemplazar coma decimal por punto
  const cleaned = value
    .replace(/\./g, "") // Remover puntos (separadores de miles)
    .replace(",", "."); // Reemplazar coma por punto (decimal)

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY, MM/DD/YY, MM/DD/YYYY, ISO, o Date object de Excel
 */
export function parseDate(value: string | Date): Date | null {
  if (!value) return null;

  // Si ya es un objeto Date (Excel lo parsea automáticamente)
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string" || value.trim() === "") return null;

  // Intentar formato DD/MM/YYYY (chileno/europeo - preferido)
  const ddmmyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }

  // Intentar formato MM/DD/YY (Excel default - americano)
  const mmddyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (mmddyyMatch) {
    const [, month, day, year] = mmddyyMatch;
    // Convertir año de 2 dígitos a 4 dígitos (25 → 2025, 24 → 2024)
    const fullYear =
      parseInt(year) >= 50 ? 1900 + parseInt(year) : 2000 + parseInt(year);
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }

  // Intentar formato MM/DD/YYYY (Excel - americano con año completo)
  const mmddyyyyMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }

  // Intentar formato ISO
  const isoDate = new Date(value);
  return isNaN(isoDate.getTime()) ? null : isoDate;
}
