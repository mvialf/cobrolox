import { z } from "zod";
import { FINANCIAL } from "../constants/financial-constants";

// Re-export business logic functions for convenience
export { calculateFIFO } from "../business-logic/payment-fifo";

/**
 * Type para PaymentMethod simplificado
 */
export type PaymentMethodInfo = {
  id: string;
  name: string;
};

/**
 * Type para Customer simplificado
 */
export type CustomerInfo = {
  id: string;
  razonSocial: string;
};

/**
 * Type para Invoice simplificado (para pagos)
 */
export type InvoiceInfo = {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
};

/**
 * Type para PaymentAllocation
 */
export type PaymentAllocation = {
  id: string;
  invoiceId: string;
  allocatedAmount: number;
  invoice?: InvoiceInfo;
};

/**
 * Type completo de Payment (from API)
 */
export type Payment = {
  id: string;
  type: "Invoice" | "Customer";
  amount: number;
  currency: string;
  date: Date;
  reference: string | null;
  notes: string | null;
  selectedInstallments: number | null;
  customerId: string;
  paymentMethodId: string;
  customer?: CustomerInfo;
  paymentMethod?: PaymentMethodInfo;
  allocations: PaymentAllocation[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Schema para una asignación de pago a factura
 */
export const paymentAllocationSchema = z.object({
  invoiceId: z.string().uuid("ID de factura inválido"),
  allocatedAmount: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0")
    .multipleOf(
      FINANCIAL.DECIMAL_PRECISION,
      "El monto debe tener máximo 2 decimales",
    ),
});

/**
 * Type para el payload de creación (API)
 */
export type CreatePaymentPayload = {
  type: "Invoice" | "Customer"; // Tipo de pago: directo a 1 factura o múltiples
  customerId: string;
  amount: number;
  currency: string;
  date: Date;
  paymentMethodId: string;
  reference: string | null;
  notes: string | null;
  selectedInstallments?: number | null;
  allocations: Array<{
    invoiceId: string;
    allocatedAmount: number;
  }>;
};

// ============================================================================
// SCHEMAS ESPECÍFICOS PARA FLUJOS SIMPLIFICADOS
// ============================================================================

/**
 * Schema para "Pago a Factura" (1:1)
 *
 * Flujo simplificado donde el usuario:
 * 1. Busca y selecciona una factura específica
 * 2. El customerId y currency se derivan automáticamente de la factura
 * 3. El monto se asigna 100% a la factura seleccionada
 */
export const paymentToInvoiceSchema = z.object({
  // Factura seleccionada (required)
  invoiceId: z
    .string({
      required_error: "Debe seleccionar una factura",
    })
    .uuid("ID de factura inválido"),

  // Monto del pago
  amount: z.coerce
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser mayor a 0")
    .multipleOf(
      FINANCIAL.DECIMAL_PRECISION,
      "El monto debe tener máximo 2 decimales",
    ),

  // Fecha del pago
  date: z.date({
    required_error: "La fecha es obligatoria",
    invalid_type_error: "Fecha inválida",
  }),

  // Método de pago
  paymentMethodId: z
    .string({
      required_error: "Debe seleccionar un método de pago",
    })
    .uuid("ID de método de pago inválido"),

  // Cuotas sin interés (opcional)
  selectedInstallments: z.coerce
    .number()
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 cuota")
    .optional()
    .nullable(),

  // Notas adicionales (opcional)
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .trim()
    .optional()
    .nullable(),
});

/**
 * Type inferido para el formulario de Pago a Factura
 */
export type PaymentToInvoiceFormValues = z.infer<typeof paymentToInvoiceSchema>;

/**
 * Type para factura con balance calculado (usado en search y FIFO)
 */
export type InvoiceWithBalance = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  paidAmount: number; // Monto ya pagado (suma de allocations)
  balance: number; // Saldo pendiente (total - paidAmount)
  status: {
    id: string;
    name: string;
    color: {
      id: string;
      bgClass: string;
      textClass: string;
    };
  };
  customer: {
    id: string;
    rut: string;
    razonSocial: string;
    tradeName: string | null;
  };
};

/**
 * Type para InvoiceWithBalance serializado (como viene del API)
 *
 * Cuando los datos viajan por JSON, las fechas se convierten a strings ISO.
 * Este type representa la forma serializada.
 */
export type InvoiceWithBalanceSerialized = Omit<
  InvoiceWithBalance,
  "issueDate" | "dueDate"
> & {
  issueDate: string; // ISO 8601 string
  dueDate: string; // ISO 8601 string
};

/**
 * Transforma InvoiceWithBalance serializado (del API) a objetos con Date
 *
 * Soluciona el problema de que JSON serializa Date como strings ISO.
 * Usa después de fetch para convertir strings de vuelta a Date objects.
 *
 * @param invoices - Array de facturas serializadas (dates como strings)
 * @returns Array de facturas con dates como Date objects
 *
 * @example
 * ```ts
 * const res = await fetch('/api/invoices?customerId=123&withBalance=true')
 * const data = await res.json() // dates son strings aquí
 * const invoices = parseInvoicesWithBalance(data) // dates son Date ahora
 * calculateFIFO(1000, invoices) // ✅ Funciona correctamente
 * ```
 */
export function parseInvoicesWithBalance(
  invoices: InvoiceWithBalanceSerialized[],
): InvoiceWithBalance[] {
  return invoices.map((inv) => ({
    ...inv,
    issueDate: new Date(inv.issueDate), // Convertir string ISO → Date
    dueDate: new Date(inv.dueDate), // Convertir string ISO → Date
  }));
}

/**
 * Helper para convertir form values de "Pago a Factura" a payload de API
 *
 * Transforma el schema simplificado 1:1 al schema completo del API
 */
export function paymentToInvoiceToPayload(
  values: PaymentToInvoiceFormValues,
  invoice: InvoiceWithBalance,
): CreatePaymentPayload {
  return {
    type: "Invoice", // ← Tipo 1:1 (pago directo a factura)
    customerId: invoice.customer.id, // ← Derivado de la factura
    amount: values.amount,
    currency: invoice.currency, // ← Derivado de la factura
    date: values.date,
    paymentMethodId: values.paymentMethodId,
    reference: null,
    notes: values.notes || null,
    selectedInstallments: values.selectedInstallments || null,
    allocations: [
      {
        invoiceId: values.invoiceId,
        allocatedAmount: values.amount, // ← 100% del monto (1:1)
      },
    ],
  };
}

// ============================================================================
// SCHEMA PARA "PAGO A CLIENTE" (1:N)
// ============================================================================

/**
 * Schema para "Pago a Cliente" (1:N)
 *
 * Flujo donde el usuario:
 * 1. Selecciona un cliente
 * 2. Ingresa el monto total del pago
 * 3. Distribuye el monto entre múltiples facturas (FIFO o manual)
 * 4. La suma de allocations debe ser exactamente igual al monto total
 */
export const paymentToCustomerSchema = z
  .object({
    // Cliente seleccionado (required)
    customerId: z
      .string({
        required_error: "Debe seleccionar un cliente",
      })
      .uuid("ID de cliente inválido"),

    // Monto total del pago
    amount: z.coerce
      .number({
        required_error: "El monto es obligatorio",
        invalid_type_error: "El monto debe ser un número",
      })
      .positive("El monto debe ser mayor a 0")
      .multipleOf(
        FINANCIAL.DECIMAL_PRECISION,
        "El monto debe tener máximo 2 decimales",
      ),

    // Fecha del pago
    date: z.date({
      required_error: "La fecha es obligatoria",
      invalid_type_error: "Fecha inválida",
    }),

    // Método de pago
    paymentMethodId: z
      .string({
        required_error: "Debe seleccionar un método de pago",
      })
      .uuid("ID de método de pago inválido"),

    // Cuotas sin interés (opcional)
    selectedInstallments: z.coerce
      .number()
      .int("Debe ser un número entero")
      .min(1, "Mínimo 1 cuota")
      .optional()
      .nullable(),

    // Notas adicionales (opcional)
    notes: z
      .string()
      .max(500, "Las notas no pueden exceder 500 caracteres")
      .trim()
      .optional()
      .nullable(),

    // Asignaciones a facturas (array de allocations)
    allocations: z
      .array(
        z.object({
          invoiceId: z.string().uuid("ID de factura inválido"),
          allocatedAmount: z.coerce
            .number()
            .nonnegative("El monto asignado no puede ser negativo")
            .multipleOf(
              FINANCIAL.DECIMAL_PRECISION,
              "El monto debe tener máximo 2 decimales",
            ),
        }),
      )
      .min(1, "Debe asignar el pago a al menos una factura")
      .refine(
        (allocations) => {
          // No duplicados de invoiceId
          const invoiceIds = allocations.map((a) => a.invoiceId);
          return new Set(invoiceIds).size === invoiceIds.length;
        },
        { message: "No puede asignar la misma factura dos veces" },
      )
      .refine(
        (allocations) => {
          // Al menos una allocation debe tener valor > 0
          return allocations.some((a) => a.allocatedAmount > 0);
        },
        {
          message:
            "Debe asignar el pago a al menos una factura con valor mayor a 0",
        },
      ),
  })
  .refine(
    (data) => {
      // Suma de allocations debe ser igual al monto total
      const totalAllocated = data.allocations.reduce(
        (sum, a) => sum + a.allocatedAmount,
        0,
      );
      return Math.abs(totalAllocated - data.amount) < FINANCIAL.TOLERANCE;
    },
    {
      message:
        "La suma de los montos asignados debe ser igual al monto total del pago",
      path: ["allocations"],
    },
  );

/**
 * Type inferido para el formulario de Pago a Cliente
 */
export type PaymentToCustomerFormValues = z.infer<
  typeof paymentToCustomerSchema
>;

/**
 * Helper para convertir form values de "Pago a Cliente" a payload de API
 *
 * Transforma el schema simplificado 1:N al schema completo del API
 */
export function paymentToCustomerToPayload(
  values: PaymentToCustomerFormValues,
  currency: string, // ← Derivado de las facturas (todas deben tener la misma moneda)
): CreatePaymentPayload {
  return {
    type: "Customer", // ← Tipo 1:N (distribución a múltiples facturas)
    customerId: values.customerId,
    amount: values.amount,
    currency, // ← Derivada de las facturas
    date: values.date,
    paymentMethodId: values.paymentMethodId,
    reference: null,
    notes: values.notes || null,
    selectedInstallments: values.selectedInstallments || null,
    allocations: values.allocations,
  };
}
