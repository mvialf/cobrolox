/**
 * Lógica de negocio para distribución FIFO de pagos
 *
 * Implementa el principio contable First-In-First-Out (FIFO):
 * Las facturas más antiguas se pagan primero (por fecha de emisión).
 *
 * @module business-logic/payment-fifo
 */

import { FINANCIAL } from "../constants/financial-constants";
import type { InvoiceWithBalance } from "@/lib/validations/payment-validations";

/**
 * Type para el resultado de distribución FIFO
 */
export interface FIFOAllocation {
  invoiceId: string;
  invoiceNumber: string;
  balance: number;
  allocatedAmount: number;
  isFullyPaid: boolean;
}

/**
 * Calcula la distribución FIFO de un pago entre facturas con balance pendiente
 *
 * Implementa el principio contable First-In-First-Out (FIFO):
 * - Ordena facturas por fecha de emisión (más antigua primero)
 * - Distribuye el monto total empezando por la factura más vieja
 * - Cada factura recibe el mínimo entre su balance y el monto restante
 *
 * @param totalAmount - Monto total del pago a distribuir
 * @param invoices - Array de facturas con balance ya calculado (del API)
 * @returns Array de allocations con detalle de distribución
 *
 * @example
 * ```ts
 * const invoices = [
 *   {
 *     id: 'INV-3',
 *     invoiceNumber: 'F-003',
 *     issueDate: new Date('2025-03-01'),
 *     total: 500000,
 *     paidAmount: 300000,
 *     balance: 200000
 *   },
 *   {
 *     id: 'INV-1',
 *     invoiceNumber: 'F-001',
 *     issueDate: new Date('2025-01-01'),
 *     total: 1000000,
 *     paidAmount: 700000,
 *     balance: 300000
 *   },
 *   {
 *     id: 'INV-2',
 *     invoiceNumber: 'F-002',
 *     issueDate: new Date('2025-02-01'),
 *     total: 800000,
 *     paidAmount: 400000,
 *     balance: 400000
 *   }
 * ]
 *
 * // Pago de $500,000 a distribuir
 * const allocations = calculateFIFO(500000, invoices)
 *
 * // Resultado (ordenado por fecha de emisión):
 * // [
 * //   { invoiceId: 'INV-1', invoiceNumber: 'F-001', balance: 300000, allocatedAmount: 300000, isFullyPaid: true },
 * //   { invoiceId: 'INV-2', invoiceNumber: 'F-002', balance: 400000, allocatedAmount: 200000, isFullyPaid: false }
 * // ]
 * // F-003 no recibe pago porque se acabó el dinero
 * ```
 *
 * @example Edge cases
 * ```ts
 * // Caso 1: Monto mayor que todos los balances
 * calculateFIFO(2000000, invoices)
 * // => Todas las facturas quedan en balance 0, sobra dinero
 *
 * // Caso 2: Factura ya pagada
 * calculateFIFO(100000, [
 *   { ...invoice, total: 100000, paidAmount: 100000, balance: 0 }
 * ])
 * // => Skip automático (balance = 0)
 *
 * // Caso 3: Sin facturas
 * calculateFIFO(100000, [])
 * // => Array vacío []
 * ```
 */
export function calculateFIFO(
  totalAmount: number,
  invoices: InvoiceWithBalance[],
): FIFOAllocation[] {
  // 1. Ordenar facturas por fecha de emisión (más antigua primero)
  const sorted = [...invoices].sort(
    (a, b) => a.issueDate.getTime() - b.issueDate.getTime(),
  );

  const allocations: FIFOAllocation[] = [];
  let remaining = totalAmount;

  // 2. Iterar TODAS las facturas (incluyendo las que recibirán $0)
  for (const invoice of sorted) {
    // 3. El balance ya viene calculado del API
    const balance = invoice.balance;

    // 4. Si la factura ya está pagada completamente, skip (no incluir en resultado)
    if (balance <= 0) continue;

    // 5. Asignar el menor entre lo que queda y el balance de la factura
    // Si remaining <= 0, asigna $0 (en lugar de hacer break)
    const allocated = remaining > 0 ? Math.min(balance, remaining) : 0;

    allocations.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      balance,
      allocatedAmount: allocated, // ← Puede ser $0
      isFullyPaid: allocated >= balance,
    });

    // 6. Solo restar si hay dinero asignado
    if (allocated > 0) {
      remaining -= allocated;
    }
  }

  return allocations; // ← Ahora incluye facturas con allocatedAmount: 0
}

/**
 * Valida que la suma de allocations manuales sea exactamente igual al monto total
 *
 * Usa tolerancia de centavos para evitar problemas de punto flotante.
 * Ver {@link FINANCIAL.TOLERANCE} para el valor de tolerancia.
 *
 * @param totalAmount - Monto total esperado del pago
 * @param allocations - Array de allocations manuales
 * @returns true si la suma coincide (dentro de la tolerancia)
 *
 * @example
 * ```ts
 * // Caso 1: Suma exacta
 * validateAllocationsSum(1000, [
 *   { allocatedAmount: 600 },
 *   { allocatedAmount: 400 }
 * ])
 * // => true (suma = 1000)
 *
 * // Caso 2: Diferencia dentro de tolerancia
 * validateAllocationsSum(1000, [
 *   { allocatedAmount: 600.01 },
 *   { allocatedAmount: 399.99 }
 * ])
 * // => true (suma = 1000.00, diferencia = 0)
 *
 * // Caso 3: Diferencia significativa
 * validateAllocationsSum(1000, [
 *   { allocatedAmount: 600 },
 *   { allocatedAmount: 350 }
 * ])
 * // => false (suma = 950, diferencia = 50)
 * ```
 *
 * @see {@link docs/project/analysis/frontend-calculations.md#6} - Análisis exhaustivo
 */
export function validateAllocationsSum(
  totalAmount: number,
  allocations: Array<{ allocatedAmount: number }>,
): boolean {
  const sum = allocations.reduce((acc, a) => acc + a.allocatedAmount, 0);
  return Math.abs(sum - totalAmount) < FINANCIAL.TOLERANCE;
}

/**
 * Filtra facturas que tienen balance pendiente (para FIFO)
 *
 * Útil para obtener solo facturas elegibles para FIFO antes de calcular distribución.
 * Nota: Si obtienes facturas del API con `pendingOnly=true`, este filtro ya está aplicado.
 *
 * @param invoices - Array de facturas con balance calculado
 * @returns Solo facturas con balance > 0
 *
 * @example
 * ```ts
 * const allInvoices = [
 *   { ...inv1, total: 1000, paidAmount: 500, balance: 500 },  // balance: 500
 *   { ...inv2, total: 800, paidAmount: 800, balance: 0 },     // balance: 0 (pagada)
 *   { ...inv3, total: 1200, paidAmount: 0, balance: 1200 }    // balance: 1200
 * ]
 *
 * const eligible = filterInvoicesWithBalance(allInvoices)
 * // => [inv1, inv3] (solo con balance > 0)
 * ```
 */
export function filterInvoicesWithBalance(
  invoices: InvoiceWithBalance[],
): InvoiceWithBalance[] {
  return invoices.filter((invoice) => invoice.balance > 0);
}
