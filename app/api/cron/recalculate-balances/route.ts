import { NextResponse } from "next/server";
import { withLogging } from "@/lib/logger-middleware";
import { recalculateAllCustomers } from "@/lib/business-logic/customer-balance";

/**
 * POST /api/cron/recalculate-balances
 *
 * Cron job que recalcula balances de todos los clientes
 *
 * Este endpoint se ejecuta automáticamente según el schedule configurado en vercel.json
 * Por defecto: diariamente a las 3 AM (hora Chile)
 *
 * IMPORTANTE: Este endpoint debe estar protegido con CRON_SECRET
 * Vercel incluye automáticamente el header Authorization con el valor de CRON_SECRET
 *
 * @see https://vercel.com/docs/cron-jobs
 */
export const POST = withLogging(async (request, logger) => {
  // Verificar autenticación del cron job
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    logger.warn(
      {
        receivedAuth: authHeader ? "present" : "missing",
      },
      "Unauthorized cron job attempt",
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Starting scheduled customer balance recalculation");

  try {
    const startTime = Date.now();

    // Recalcular balances de todos los clientes
    const count = await recalculateAllCustomers();

    const duration = Date.now() - startTime;

    logger.info(
      {
        customersProcessed: count,
        durationMs: duration,
        durationSeconds: Math.round(duration / 1000),
      },
      "Customer balance recalculation completed successfully",
    );

    return NextResponse.json({
      success: true,
      customersProcessed: count,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Error during scheduled balance recalculation",
    );

    return NextResponse.json(
      {
        error: "Error recalculating balances",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
