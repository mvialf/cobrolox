/**
 * Lógica de negocio para cálculo y actualización de balances de clientes
 *
 * - balanceTotal: almacenado en BD, se actualiza on-demand tras pagos/facturas
 * - balanceVigente/balanceVencido: se derivan al consultar (no se almacenan)
 *
 * @module business-logic/customer-balance
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Resultado del cálculo de balances de un cliente
 */
export interface CustomerBalanceResult {
  balanceTotal: number;
  balanceVigente: number;
  balanceVencido: number;
}

/**
 * Recalcula y actualiza balanceTotal de un cliente en la base de datos
 *
 * SINGLE SOURCE OF TRUTH para actualizar balanceTotal.
 * Debe llamarse después de cualquier operación que afecte facturas o pagos.
 *
 * balanceVigente y balanceVencido ya NO se almacenan — se derivan al consultar.
 *
 * @param customerId - ID del cliente a recalcular
 * @returns Balances calculados (total, vigente, vencido)
 */
export async function recalculateCustomerBalances(
  customerId: string
): Promise<CustomerBalanceResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

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

    if (now > invoice.dueDate) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  // Solo persistir balanceTotal (vigente/vencido se derivan al consultar)
  await prisma.customer.update({
    where: { id: customerId },
    data: { balanceTotal },
  });

  return { balanceTotal, balanceVigente, balanceVencido };
}

/**
 * Calcula los balances sin actualizar la BD (útil para preview/testing)
 */
export async function calculateCustomerBalances(
  customerId: string
): Promise<CustomerBalanceResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

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

    if (now > invoice.dueDate) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  return { balanceTotal, balanceVigente, balanceVencido };
}

/**
 * Recalcula balances para múltiples clientes en batch
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
      console.error(`Error recalculating customer ${customerId}:`, error);
      results.push({ balanceTotal: 0, balanceVigente: 0, balanceVencido: 0 });
    }
  }

  return results;
}

/**
 * Recalcula balanceTotal de TODOS los clientes en el sistema
 */
export async function recalculateAllCustomers(): Promise<number> {
  const customers = await prisma.customer.findMany({
    select: { id: true },
  });

  await recalculateMultipleCustomers(customers.map((c) => c.id));

  return customers.length;
}

/**
 * Calcula balanceVigente y balanceVencido derivados para una lista de customer IDs.
 * Usa una sola query SQL raw con aggregation condicional.
 *
 * @returns Map de customerId → { balanceVigente, balanceVencido }
 */
export async function getDerivedBalances(
  customerIds?: string[]
): Promise<Map<string, { balanceVigente: number; balanceVencido: number }>> {
  const result = new Map<
    string,
    { balanceVigente: number; balanceVencido: number }
  >();

  if (customerIds && customerIds.length === 0) return result;

  const whereClause = customerIds
    ? Prisma.sql`AND i."customerId" IN (${Prisma.join(customerIds)})`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<
    Array<{
      customerId: string;
      balanceVigente: number;
      balanceVencido: number;
    }>
  >(Prisma.sql`
    SELECT
      i."customerId",
      COALESCE(SUM(CASE WHEN i."dueDate" > NOW() THEN i.total - i."paidAmount" ELSE 0 END), 0)::float AS "balanceVigente",
      COALESCE(SUM(CASE WHEN i."dueDate" <= NOW() THEN i.total - i."paidAmount" ELSE 0 END), 0)::float AS "balanceVencido"
    FROM "Invoice" i
    WHERE i.total - i."paidAmount" > 0
    ${whereClause}
    GROUP BY i."customerId"
  `);

  for (const row of rows) {
    result.set(row.customerId, {
      balanceVigente: row.balanceVigente,
      balanceVencido: row.balanceVencido,
    });
  }

  return result;
}
