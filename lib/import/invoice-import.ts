import {
  parseDate,
  parseDecimal,
  ParseError,
  isNotEmpty,
} from "./excel-parser";
import { rutHelpers } from "@/lib/rut-validations";
import { calculateTaxAmount, calculateTotal } from "@/lib/utils/invoice-utils";

/**
 * Estructura esperada de una fila del Excel de facturas
 */
export interface InvoiceCSVRow {
  invoiceNumber: string;
  customerRut: string; // RUT del cliente (se buscará el ID)
  subtotal: string; // REQUERIDO - Viene como string del Excel
  taxAmount?: string; // OPCIONAL - Si vacío, se calcula automáticamente (19%)
  currency?: string;
  issueDate: string; // Formato DD/MM/YYYY o ISO
  dueDate: string; // Formato DD/MM/YYYY o ISO
  notes?: string;
}

/**
 * Datos procesados de una factura listos para insertar en DB
 * (sin IDs que se resolverán en el backend)
 */
export interface InvoiceImportData {
  invoiceNumber: string;
  customerRut: string; // Se usará para buscar customerId en backend
  subtotal: number;
  taxAmount: number; // Calculado automáticamente si no se proporciona
  total: number; // Siempre calculado (subtotal + taxAmount)
  currency: string;
  issueDate: Date;
  dueDate: Date;
  notes: string | null;
}

/**
 * Resultado de la validación de una factura
 */
export interface InvoiceValidationResult {
  isValid: boolean;
  data?: InvoiceImportData;
  errors: ParseError[];
}

/**
 * Valida y transforma una fila Excel de factura
 *
 * Lógica de cálculo de montos:
 * 1. subtotal: REQUERIDO (debe ser > 0)
 * 2. taxAmount: OPCIONAL
 *    - Si vacío → se calcula automáticamente (19%)
 *    - Si proporcionado → debe ser exactamente 19% del subtotal O 0 (facturas exentas)
 * 3. total: Siempre calculado (subtotal + taxAmount)
 */
export function validateInvoiceRow(
  row: InvoiceCSVRow,
  rowIndex: number
): InvoiceValidationResult {
  const errors: ParseError[] = [];

  // ═══════════════════════════════════════════════════════════════════
  // 1. VALIDAR CAMPOS REQUERIDOS (STRING)
  // ═══════════════════════════════════════════════════════════════════

  if (!isNotEmpty(row.invoiceNumber)) {
    errors.push({
      row: rowIndex,
      field: "invoiceNumber",
      message: "El número de factura es requerido",
      value: row.invoiceNumber,
    });
  }

  if (!isNotEmpty(row.customerRut)) {
    errors.push({
      row: rowIndex,
      field: "customerRut",
      message: "El RUT del cliente es requerido",
      value: row.customerRut,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. PARSEAR Y VALIDAR SUBTOTAL (REQUERIDO)
  // ═══════════════════════════════════════════════════════════════════

  const subtotal = parseDecimal(row.subtotal);
  if (subtotal === null) {
    errors.push({
      row: rowIndex,
      field: "subtotal",
      message: "El subtotal es requerido y debe ser un número válido",
      value: row.subtotal,
    });
  } else if (subtotal <= 0) {
    errors.push({
      row: rowIndex,
      field: "subtotal",
      message: "El subtotal debe ser mayor a 0",
      value: row.subtotal,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. DETERMINAR Y VALIDAR taxAmount
  // ═══════════════════════════════════════════════════════════════════

  let taxAmount: number;
  const tolerance = 0.01; // Tolerancia de ±1 centavo por redondeo

  if (isNotEmpty(row.taxAmount)) {
    // Usuario proporcionó taxAmount manual
    const parsedTax = parseDecimal(row.taxAmount!);

    if (parsedTax === null) {
      errors.push({
        row: rowIndex,
        field: "taxAmount",
        message: "El IVA debe ser un número válido si se proporciona",
        value: row.taxAmount,
      });
      taxAmount = 0; // Fallback para continuar validación
    } else if (parsedTax < 0) {
      errors.push({
        row: rowIndex,
        field: "taxAmount",
        message: "El IVA no puede ser negativo",
        value: row.taxAmount,
      });
      taxAmount = 0; // Fallback
    } else {
      taxAmount = parsedTax;

      // Validar que taxAmount sea exactamente 19% del subtotal O 0 (exenta)
      if (subtotal !== null) {
        const expectedTax = calculateTaxAmount(subtotal);

        // Caso 1: Factura exenta (IVA = 0)
        const isExempt = Math.abs(taxAmount) < tolerance;

        // Caso 2: IVA correcto (19%)
        const isCorrectTax = Math.abs(taxAmount - expectedTax) < tolerance;

        if (!isExempt && !isCorrectTax) {
          errors.push({
            row: rowIndex,
            field: "taxAmount",
            message: `IVA inválido (${taxAmount}). Debe ser 0 (factura exenta) o ${expectedTax.toFixed(2)} (19% del subtotal)`,
            value: row.taxAmount,
          });
        }
      }
    }
  } else {
    // NO proporcionó taxAmount → Calcular automáticamente (19%)
    if (subtotal !== null) {
      taxAmount = calculateTaxAmount(subtotal);
    } else {
      taxAmount = 0; // Fallback si subtotal es inválido
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. CALCULAR TOTAL AUTOMÁTICAMENTE
  // ═══════════════════════════════════════════════════════════════════

  const total = subtotal !== null ? calculateTotal(subtotal, taxAmount) : 0;

  // ═══════════════════════════════════════════════════════════════════
  // 5. PARSEAR Y VALIDAR FECHAS
  // ═══════════════════════════════════════════════════════════════════

  const issueDate = parseDate(row.issueDate);
  if (issueDate === null) {
    errors.push({
      row: rowIndex,
      field: "issueDate",
      message: "La fecha de emisión es requerida. Formato: DD/MM/YYYY o ISO",
      value: row.issueDate,
    });
  } else if (issueDate > new Date()) {
    errors.push({
      row: rowIndex,
      field: "issueDate",
      message: "La fecha de emisión no puede ser futura",
      value: row.issueDate,
    });
  }

  const dueDate = parseDate(row.dueDate);
  if (dueDate === null) {
    errors.push({
      row: rowIndex,
      field: "dueDate",
      message:
        "La fecha de vencimiento es requerida. Formato: DD/MM/YYYY o ISO",
      value: row.dueDate,
    });
  }

  // Validar que dueDate >= issueDate
  if (issueDate !== null && dueDate !== null && dueDate < issueDate) {
    errors.push({
      row: rowIndex,
      field: "dueDate",
      message:
        "La fecha de vencimiento debe ser mayor o igual a la fecha de emisión",
      value: row.dueDate,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. NORMALIZAR Y VALIDAR RUT DEL CLIENTE
  // ═══════════════════════════════════════════════════════════════════

  const cleanRut = rutHelpers.clean(row.customerRut);
  const formattedRut = rutHelpers.format(cleanRut);

  if (!rutHelpers.validate(cleanRut)) {
    errors.push({
      row: rowIndex,
      field: "customerRut",
      message: "RUT del cliente inválido",
      value: row.customerRut,
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. RETORNAR RESULTADO
  // ═══════════════════════════════════════════════════════════════════

  // Si hay errores, retornar temprano
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Datos válidos listos para procesar
  const importData: InvoiceImportData = {
    invoiceNumber: row.invoiceNumber.trim(),
    customerRut: formattedRut, // RUT normalizado y formateado
    subtotal: subtotal!,
    taxAmount,
    total,
    currency: row.currency?.trim() || "CLP",
    issueDate: issueDate!,
    dueDate: dueDate!,
    notes: row.notes?.trim() || null,
  };

  return {
    isValid: true,
    data: importData,
    errors: [],
  };
}

/**
 * Valida un lote completo de facturas del Excel
 */
export function validateInvoiceBatch(rows: InvoiceCSVRow[]): {
  validInvoices: InvoiceImportData[];
  errors: ParseError[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
} {
  const validInvoices: InvoiceImportData[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    const result = validateInvoiceRow(row, index + 2); // +2 porque la fila 1 es el header

    if (result.isValid && result.data) {
      validInvoices.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  });

  return {
    validInvoices,
    errors,
    summary: {
      total: rows.length,
      valid: validInvoices.length,
      invalid: rows.length - validInvoices.length,
    },
  };
}

/**
 * Datos de ejemplo para template Excel de facturas
 *
 * IMPORTANTE:
 * - Las fechas se envían como Date objects para que Excel las formatee automáticamente
 * - El RUT puede venir en cualquier formato (con/sin puntos/guión), se normalizará automáticamente
 * - taxAmount es OPCIONAL: si se deja vacío, se calcula automáticamente (19%)
 * - Para facturas exentas, debe especificar taxAmount = 0
 *
 * Ejemplos incluidos:
 * - F-001: Factura normal (sin taxAmount, se calcula automáticamente)
 * - F-002: Factura exenta (taxAmount = 0)
 */
export const INVOICE_TEMPLATE_DATA = [
  [
    "invoiceNumber",
    "customerRut",
    "subtotal",
    "taxAmount",
    "issueDate",
    "dueDate",
    "notes",
  ],
  [
    "F-001",
    "12.345.678-9", // RUT con formato (también acepta sin formato)
    "100000",
    "", // Vacío → Se calcula automáticamente (19%) = 19000
    new Date(2025, 0, 1), // 1 de enero de 2025
    new Date(2025, 0, 31), // 31 de enero de 2025
    "",
  ],
  [
    "F-002",
    "98.765.432-1", // RUT con formato
    "200000",
    "0", // Factura exenta de IVA
    new Date(2025, 0, 15), // 15 de enero de 2025
    new Date(2025, 1, 15), // 15 de febrero de 2025
    "Factura exenta de IVA",
  ],
];
