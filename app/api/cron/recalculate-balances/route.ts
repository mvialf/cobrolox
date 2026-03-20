import { NextResponse } from "next/server";
import { withLogging } from "@/lib/logger-middleware";
import { recalculateAllCustomers } from "@/lib/business-logic/customer-balance";

/**
 * POST /api/cron/recalculate-balances
 *
 * Safety net: recalcula balanceTotal de todos los clientes.
 * balanceVigente/balanceVencido se derivan al consultar (no se almacenan).
 *
 * Se ejecuta como cron via GitHub Actions o manualmente.
 */
export const POST = withLogging(async (request, logger) => {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    logger.warn(
      { receivedAuth: authHeader ? "present" : "missing" },
      "Unauthorized cron job attempt"
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Starting scheduled balanceTotal recalculation");

  try {
    const startTime = Date.now();
    const count = await recalculateAllCustomers();
    const duration = Date.now() - startTime;

    logger.info(
      {
        customersProcessed: count,
        durationMs: duration,
        durationSeconds: Math.round(duration / 1000),
      },
      "Customer balanceTotal recalculation completed"
    );

    return NextResponse.json({
      success: true,
      customersProcessed: count,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Error during scheduled balance recalculation");

    return NextResponse.json(
      {
        error: "Error recalculating balances",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});
