import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/customers/list
 * Obtiene lista simple de customers para Combobox
 *
 * @returns Array de customers con { id, rut, razonSocial, phone }
 */
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        rut: true,
        razonSocial: true,
        phone: true,
      },
      orderBy: {
        razonSocial: "asc",
      },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error al obtener lista de clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener lista de clientes" },
      { status: 500 },
    );
  }
}
