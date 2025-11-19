import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/payment-invoice-statuses
 *
 * Obtiene todos los estados de pago de factura activos
 *
 * Query params:
 *   - active: filtrar por estados activos (default: true)
 *   - initial: obtener solo el estado inicial (para nuevas facturas)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") !== "false";
    const initialOnly = searchParams.get("initial") === "true";

    const where = {
      ...(activeOnly && { isActive: true }),
      ...(initialOnly && { isInitial: true }),
    };

    const statuses = await prisma.paymentInvoiceStatus.findMany({
      where,
      include: {
        color: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    // Si se solicita el estado inicial y hay varios, retornar solo el primero
    if (initialOnly && statuses.length > 0) {
      return NextResponse.json(statuses[0]);
    }

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Error fetching payment invoice statuses:", error);
    return NextResponse.json(
      { error: "Error al obtener estados de pago de factura" },
      { status: 500 }
    );
  }
}
