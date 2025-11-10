/**
 * Lógica de negocio para cálculo de balance de proyectos
 *
 * Calcula el balance pendiente (monto total - pagos asignados)
 *
 * @module business-logic/project-balance
 */

/**
 * Calcula el balance pendiente de un proyecto
 *
 * Balance = Total del proyecto - Suma de pagos asignados activos
 *
 * @param params - Parámetros del cálculo
 * @param params.totalAmount - Monto total del proyecto (puede ser null si no está definido)
 * @param params.allocations - Array de allocations de pagos al proyecto (opcional)
 * @returns Objeto con el balance calculado
 *
 * @example
 * ```ts
 * // Proyecto de $1,000,000 con $700,000 pagados
 * const result = calculateProjectBalance({
 *   totalAmount: 1000000,
 *   allocations: [
 *     { allocatedAmount: 500000 },
 *     { allocatedAmount: 200000 }
 *   ]
 * })
 * // => { balance: 300000 }
 * ```
 *
 * @example Edge cases
 * ```ts
 * // Caso 1: Sin allocations
 * calculateProjectBalance({ totalAmount: 1000000, allocations: [] })
 * // => { balance: 1000000 }
 *
 * // Caso 2: TotalAmount null
 * calculateProjectBalance({ totalAmount: null, allocations: [] })
 * // => { balance: 0 }
 *
 * // Caso 3: Proyecto completamente pagado
 * calculateProjectBalance({
 *   totalAmount: 1000000,
 *   allocations: [{ allocatedAmount: 1000000 }]
 * })
 * // => { balance: 0 }
 * ```
 */
export function calculateProjectBalance(params: {
  totalAmount: number | null;
  allocations?: Array<{ allocatedAmount: number }>;
}): { balance: number } {
  // Si no hay monto total definido, el balance es 0
  const total = params.totalAmount || 0;

  // Sumar todos los pagos asignados al proyecto
  const paid =
    params.allocations?.reduce((sum, a) => sum + a.allocatedAmount, 0) || 0;

  // Balance = Total - Pagado
  const balance = total - paid;

  return { balance };
}
