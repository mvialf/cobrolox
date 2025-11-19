/**
 * Business Logic: Invoice Balance Management
 *
 * Este módulo centraliza la lógica para calcular y actualizar
 * el balance de facturas. Se ejecuta cuando:
 * - Se crea un Payment con PaymentAllocations
 * - Se elimina un Payment (elimina allocations en cascade)
 *
 * IMPORTANTE: Este helper mantiene sincronizados los campos:
 * - Invoice.balance = total - paidAmount
 * - Invoice.paidAmount = SUM(allocations.allocatedAmount)
 *
 * @module business-logic/invoice-balance
 */

import { prisma } from "@/lib/db";

/**
 * Recalcula y actualiza el balance de una factura
 *
 * Esta función:
 * 1. Lee la factura con sus allocations
 * 2. Calcula paidAmount = SUM(allocations)
 * 3. Calcula balance = total - paidAmount
 * 4. Actualiza ambos campos en DB
 *
 * NOTA: Usa transaction para evitar race conditions si 2 payments
 * se crean simultáneamente para la misma invoice.
 *
 * @param invoiceId - ID de la factura a actualizar
 * @throws Error si la factura no existe
 *
 * @example
 * ```typescript
 * // Después de crear un Payment:
 * await updateInvoiceBalance(invoice.id)
 * ```
 */
export async function updateInvoiceBalance(invoiceId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Fetch invoice con allocations
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { allocations: true },
    });

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // Calcular paidAmount (suma de allocations)
    const paidAmount = invoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );

    // Calcular balance (total - pagado)
    const balance = Number(invoice.total) - paidAmount;

    // Actualizar en DB
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount,
        balance,
      },
    });
  });
}

/**
 * Actualiza el balance de múltiples facturas en paralelo
 *
 * Útil cuando un Payment tiene allocations a varias facturas.
 * Ejecuta updateInvoiceBalance para cada factura en paralelo.
 *
 * @param invoiceIds - Array de IDs de facturas a actualizar
 *
 * @example
 * ```typescript
 * // Después de crear un Payment multi-factura:
 * const invoiceIds = allocations.map(a => a.invoiceId)
 * await updateInvoicesBalance(invoiceIds)
 * ```
 */
export async function updateInvoicesBalance(
  invoiceIds: string[]
): Promise<void> {
  await Promise.all(invoiceIds.map((id) => updateInvoiceBalance(id)));
}

/**
 * Calcula el balance de una factura sin guardarlo en DB
 *
 * Útil para:
 * - Validaciones pre-save
 * - Testing
 * - Verificación de consistencia
 *
 * @param invoice - Factura con allocations incluidas
 * @returns balance calculado (total - paidAmount)
 *
 * @example
 * ```typescript
 * const invoice = await prisma.invoice.findUnique({
 *   where: { id },
 *   include: { allocations: true }
 * })
 *
 * const calculatedBalance = calculateInvoiceBalance(invoice)
 * console.log('Balance:', calculatedBalance)
 * ```
 */
export function calculateInvoiceBalance(invoice: {
  total: number | string;
  allocations: Array<{ allocatedAmount: number | string }>;
}): number {
  const paidAmount = invoice.allocations.reduce(
    (sum, alloc) => sum + Number(alloc.allocatedAmount),
    0
  );

  return Number(invoice.total) - paidAmount;
}
