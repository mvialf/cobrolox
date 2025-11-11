/**
 * Helper para recalcular balances con retry automático
 *
 * Maneja errores transitorios (timeouts, locks DB) con reintentos exponenciales.
 * Si falla después de todos los reintentos, logea como ERROR CRÍTICO y envía alertas.
 */

import { recalculateCustomerBalances } from "./customer-balance";
import { sendBalanceCalculationFailureAlert } from "@/lib/alerts/balance-alerts";

interface RetryLogger {
  debug: (message: string | object, ...args: unknown[]) => void;
  warn: (message: string | object, ...args: unknown[]) => void;
  error: (message: string | object, ...args: unknown[]) => void;
}

export interface RecalculateBalancesOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

/**
 * Recalcula balances del cliente con retry automático
 *
 * @param customerId - ID del cliente
 * @param logger - Logger para tracking
 * @param options - Configuración de reintentos
 * @returns true si se recalculó exitosamente, false si falló
 *
 * @example
 * ```ts
 * const success = await recalculateCustomerBalancesWithRetry(
 *   customerId,
 *   paymentLogger
 * );
 *
 * if (!success) {
 *   // Alerta: balances inconsistentes
 *   await sendAlert({ customerId, issue: 'balance-calculation-failed' });
 * }
 * ```
 */
export async function recalculateCustomerBalancesWithRetry(
  customerId: string,
  logger: RetryLogger,
  options: RecalculateBalancesOptions = {},
): Promise<boolean> {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await recalculateCustomerBalances(customerId);

      if (attempt > 1) {
        logger.debug(
          { customerId, attempt },
          `Customer balances recalculated successfully after ${attempt} attempts`,
        );
      } else {
        logger.debug({ customerId }, "Customer balances recalculated");
      }

      return true; // Éxito
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        // CRÍTICO: Falló después de todos los reintentos
        logger.error(
          {
            err: error,
            customerId,
            attempts: maxRetries,
          },
          "❌ CRITICAL: Failed to recalculate customer balances after all retries. Customer balance data may be INCONSISTENT.",
        );

        // Enviar alertas por todos los canales configurados
        await sendBalanceCalculationFailureAlert({
          customerId,
          error: error instanceof Error ? error.message : String(error),
          attempts: maxRetries,
          timestamp: new Date(),
        });

        // TODO: Considerar registrar en tabla de "pending_balance_recalculations" para retry posterior

        return false; // Fallo definitivo
      }

      // No es el último intento: logear warning y reintentar
      const delayMs = baseDelayMs * attempt; // Backoff exponencial simple

      logger.warn(
        {
          err: error,
          customerId,
          attempt,
          nextRetryInMs: delayMs,
        },
        `Failed to recalculate customer balances, retrying in ${delayMs}ms... (attempt ${attempt}/${maxRetries})`,
      );

      // Esperar antes del siguiente intento
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Nunca debería llegar aquí, pero TypeScript lo requiere
  return false;
}
