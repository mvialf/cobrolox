/**
 * Lógica de negocio para cálculo y actualización de balances de clientes
 *
 * Calcula tres tipos de balance almacenados en Customer:
 * - balanceTotal: Suma de todos los balances de facturas
 * - balanceVigente: Suma de balance de facturas no vencidas
 * - balanceVencido: Suma de balance de facturas vencidas
 *
 * @module business-logic/customer-balance
 */

import { prisma } from "@/lib/db";
import { isAfter } from "date-fns";

/**
 * Resultado del cálculo de balances de un cliente
 */
export interface CustomerBalanceResult {
  balanceTotal: number;
  balanceVigente: number;
  balanceVencido: number;
}

/**
 * Recalcula y actualiza los balances de un cliente en la base de datos
 *
 * SINGLE SOURCE OF TRUTH para actualizar balances de clientes.
 * Debe llamarse después de cualquier operación que afecte facturas o pagos:
 * - Crear/modificar/eliminar Invoice
 * - Crear/modificar/eliminar Payment
 * - Crear/modificar/eliminar PaymentAllocation
 *
 * Implementa la siguiente lógica:
 * 1. Obtiene todas las facturas del cliente
 * 2. Para cada factura:
 *    - Calcula balance = total - paidAmount (suma de allocations)
 *    - Determina si está vigente o vencida (comparando dueDate con now)
 * 3. Suma los balances en tres categorías: total, vigente, vencido
 * 4. Actualiza las columnas del Customer en la BD
 *
 * @param customerId - ID del cliente a recalcular
 * @returns Balances calculados
 *
 * @example
 * ```ts
 * // Después de crear una factura
 * await prisma.invoice.create({ data: {...} })
 * await recalculateCustomerBalances(customerId)
 *
 * // Después de crear un pago con allocations
 * await prisma.payment.create({
 *   data: {
 *     ...paymentData,
 *     allocations: { create: [...] }
 *   }
 * })
 * await recalculateCustomerBalances(customerId)
 * ```
 *
 * @example Edge cases
 * ```ts
 * // Cliente sin facturas
 * await recalculateCustomerBalances('customer-id')
 * // => { balanceTotal: 0, balanceVigente: 0, balanceVencido: 0 }
 *
 * // Cliente con facturas pagadas completamente
 * // (todas con balance = 0)
 * await recalculateCustomerBalances('customer-id')
 * // => { balanceTotal: 0, balanceVigente: 0, balanceVencido: 0 }
 *
 * // Cliente con facturas vigentes y vencidas
 * // Factura 1: balance 500, dueDate futuro → vigente
 * // Factura 2: balance 300, dueDate pasado → vencido
 * await recalculateCustomerBalances('customer-id')
 * // => { balanceTotal: 800, balanceVigente: 500, balanceVencido: 300 }
 * ```
 *
 * @throws Error si el cliente no existe
 */
export async function recalculateCustomerBalances(
  customerId: string
): Promise<CustomerBalanceResult> {
  // 1. Verificar que el cliente existe
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  // 2. Obtener todas las facturas del cliente con sus allocations
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    select: {
      id: true,
      total: true,
      dueDate: true,
      allocations: {
        select: {
          allocatedAmount: true,
        },
      },
    },
  });

  // 3. Calcular balances
  const now = new Date();
  let balanceTotal = 0;
  let balanceVigente = 0;
  let balanceVencido = 0;

  for (const invoice of invoices) {
    // Calcular balance de esta factura (reutiliza lógica de /api/invoices)
    const total = Number(invoice.total);
    const paidAmount = invoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );
    const balance = total - paidAmount;

    // Si no hay balance pendiente, skip
    if (balance <= 0) continue;

    // Sumar al total
    balanceTotal += balance;

    // Determinar si está vencida o vigente
    // Factura vencida: dueDate < now
    const isOverdue = isAfter(now, invoice.dueDate);

    if (isOverdue) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  // 4. Actualizar Customer en la BD
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      balanceTotal,
      balanceVigente,
      balanceVencido,
    },
  });

  return {
    balanceTotal,
    balanceVigente,
    balanceVencido,
  };
}

/**
 * Calcula los balances sin actualizar la BD (útil para preview/testing)
 *
 * @param customerId - ID del cliente
 * @returns Balances calculados sin persistir
 *
 * @example
 * ```ts
 * // Preview de balances antes de actualizar
 * const preview = await calculateCustomerBalances('customer-id')
 * console.log(`Total: ${preview.balanceTotal}`)
 * ```
 */
export async function calculateCustomerBalances(
  customerId: string
): Promise<CustomerBalanceResult> {
  // Verificar que el cliente existe
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  // Obtener facturas con allocations
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    select: {
      id: true,
      total: true,
      dueDate: true,
      allocations: {
        select: {
          allocatedAmount: true,
        },
      },
    },
  });

  // Calcular balances (misma lógica que recalculateCustomerBalances)
  const now = new Date();
  let balanceTotal = 0;
  let balanceVigente = 0;
  let balanceVencido = 0;

  for (const invoice of invoices) {
    const total = Number(invoice.total);
    const paidAmount = invoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );
    const balance = total - paidAmount;

    if (balance <= 0) continue;

    balanceTotal += balance;

    const isOverdue = isAfter(now, invoice.dueDate);

    if (isOverdue) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  return {
    balanceTotal,
    balanceVigente,
    balanceVencido,
  };
}

/**
 * Recalcula balances para múltiples clientes en batch
 *
 * Útil para:
 * - Job nocturno que recalcula todos los clientes
 * - Recalcular después de operaciones masivas
 * - Migration scripts
 *
 * @param customerIds - Array de IDs de clientes
 * @returns Array de resultados (uno por cliente)
 *
 * @example
 * ```ts
 * // Recalcular varios clientes después de importar pagos masivos
 * const affectedCustomerIds = ['id1', 'id2', 'id3']
 * await recalculateMultipleCustomers(affectedCustomerIds)
 * ```
 */
export async function recalculateMultipleCustomers(
  customerIds: string[]
): Promise<CustomerBalanceResult[]> {
  const results: CustomerBalanceResult[] = [];

  for (const customerId of customerIds) {
    try {
      const result = await recalculateCustomerBalances(customerId);
      results.push(result);
    } catch (error) {
      // Log error pero continuar con los demás
      console.error(`Error recalculating customer ${customerId}:`, error);
      // Push un resultado con ceros para mantener el orden
      results.push({
        balanceTotal: 0,
        balanceVigente: 0,
        balanceVencido: 0,
      });
    }
  }

  return results;
}

/**
 * Recalcula balances de TODOS los clientes en el sistema
 *
 * ADVERTENCIA: Esta operación puede ser pesada en sistemas grandes.
 * Considerar ejecutar en background o en horarios de bajo tráfico.
 *
 * Útil para:
 * - Migration inicial después de agregar columnas de balance
 * - Job diario para recalcular facturas que pasaron de vigentes → vencidas
 * - Cleanup/maintenance
 *
 * @returns Número de clientes procesados
 *
 * @example
 * ```ts
 * // Script de migración
 * const processed = await recalculateAllCustomers()
 * console.log(`Processed ${processed} customers`)
 * ```
 */
export async function recalculateAllCustomers(): Promise<number> {
  const customers = await prisma.customer.findMany({
    select: { id: true },
  });

  await recalculateMultipleCustomers(customers.map((c) => c.id));

  return customers.length;
}
