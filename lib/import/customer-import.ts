import { customerSchema } from "@/lib/validations/customer-validations";
import { rutHelpers } from "@/lib/rut-validations";
import { ParseError, isNotEmpty } from "./excel-parser";
import type { Customer } from "@prisma/client";

/**
 * Estructura esperada de una fila del Excel de clientes
 */
export interface CustomerCSVRow {
  rut: string;
  razonSocial: string;
  tradeName?: string;
  businessActivity?: string;
  contact: string;
  phone: string;
  email?: string;
  street: string;
  apartment?: string;
  region: string;
  comuna: string;
}

/**
 * Datos procesados de un cliente listos para insertar en DB
 */
export type CustomerImportData = Omit<
  Customer,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "balanceTotal"
  | "balanceVigente"
  | "balanceVencido"
>;

/**
 * Resultado de la validación de un cliente
 */
export interface CustomerValidationResult {
  isValid: boolean;
  data?: CustomerImportData;
  errors: ParseError[];
}

/**
 * Valida y transforma una fila Excel de cliente
 */
export function validateCustomerRow(
  row: CustomerCSVRow,
  rowIndex: number,
): CustomerValidationResult {
  const errors: ParseError[] = [];

  // Validar campos requeridos
  if (!isNotEmpty(row.rut)) {
    errors.push({
      row: rowIndex,
      field: "rut",
      message: "El RUT es requerido",
      value: row.rut,
    });
  }

  if (!isNotEmpty(row.razonSocial)) {
    errors.push({
      row: rowIndex,
      field: "razonSocial",
      message: "La razón social es requerida",
      value: row.razonSocial,
    });
  }

  if (!isNotEmpty(row.contact)) {
    errors.push({
      row: rowIndex,
      field: "contact",
      message: "El contacto es requerido",
      value: row.contact,
    });
  }

  if (!isNotEmpty(row.phone)) {
    errors.push({
      row: rowIndex,
      field: "phone",
      message: "El teléfono es requerido",
      value: row.phone,
    });
  }

  if (!isNotEmpty(row.street)) {
    errors.push({
      row: rowIndex,
      field: "street",
      message: "La calle es requerida",
      value: row.street,
    });
  }

  if (!isNotEmpty(row.region)) {
    errors.push({
      row: rowIndex,
      field: "region",
      message: "La región es requerida",
      value: row.region,
    });
  }

  if (!isNotEmpty(row.comuna)) {
    errors.push({
      row: rowIndex,
      field: "comuna",
      message: "La comuna es requerida",
      value: row.comuna,
    });
  }

  // Si hay errores de campos requeridos, retornar temprano
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Formatear y limpiar RUT
  const cleanRut = rutHelpers.clean(row.rut);
  const formattedRut = rutHelpers.format(cleanRut);

  // Preparar datos para validación con Zod
  const dataToValidate = {
    rut: formattedRut,
    razonSocial: row.razonSocial.trim(),
    tradeName: row.tradeName?.trim() || "",
    businessActivity: row.businessActivity?.trim() || "",
    contact: row.contact.trim(),
    phone: row.phone.trim(),
    email: row.email?.trim() || "",
    street: row.street.trim(),
    apartment: row.apartment?.trim() || "",
    region: row.region.trim(),
    comuna: row.comuna.trim(),
  };

  // Validar con el schema de Zod
  const result = customerSchema.safeParse(dataToValidate);

  if (!result.success) {
    // Convertir errores de Zod a ParseError
    result.error.errors.forEach((err) => {
      errors.push({
        row: rowIndex,
        field: err.path[0]?.toString(),
        message: err.message,
        value: dataToValidate[err.path[0] as keyof typeof dataToValidate],
      });
    });

    return { isValid: false, errors };
  }

  // Datos válidos listos para DB
  const importData: CustomerImportData = {
    rut: formattedRut,
    razonSocial: result.data.razonSocial,
    tradeName: result.data.tradeName || null,
    businessActivity: result.data.businessActivity || null,
    contact: result.data.contact,
    phone: result.data.phone,
    email: result.data.email || null,
    street: result.data.street,
    apartment: result.data.apartment || null,
    region: result.data.region,
    comuna: result.data.comuna,
  };

  return {
    isValid: true,
    data: importData,
    errors: [],
  };
}

/**
 * Valida un lote completo de clientes del Excel
 */
export function validateCustomerBatch(rows: CustomerCSVRow[]): {
  validCustomers: CustomerImportData[];
  errors: ParseError[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
} {
  const validCustomers: CustomerImportData[] = [];
  const errors: ParseError[] = [];

  rows.forEach((row, index) => {
    const result = validateCustomerRow(row, index + 2); // +2 porque la fila 1 es el header

    if (result.isValid && result.data) {
      validCustomers.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  });

  return {
    validCustomers,
    errors,
    summary: {
      total: rows.length,
      valid: validCustomers.length,
      invalid: rows.length - validCustomers.length,
    },
  };
}

/**
 * Datos de ejemplo para template Excel de clientes
 */
export const CUSTOMER_TEMPLATE_DATA = [
  [
    "rut",
    "razonSocial",
    "tradeName",
    "businessActivity",
    "contact",
    "phone",
    "email",
    "street",
    "apartment",
    "region",
    "comuna",
  ],
  [
    "12.345.678-9",
    "Empresa Demo SpA",
    "Demo",
    "Servicios",
    "Juan Pérez",
    "+56912345678",
    "contacto@demo.cl",
    "Av. Principal 123",
    "Of. 401",
    "Región Metropolitana",
    "Santiago",
  ],
  [
    "98.765.432-1",
    "Comercial ABC Ltda.",
    "ABC",
    "Comercio",
    "María González",
    "+56987654321",
    "info@abc.cl",
    "Calle Ejemplo 456",
    "",
    "Valparaíso",
    "Viña del Mar",
  ],
];
