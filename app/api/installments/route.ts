import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * GET /api/installments
 *
 * Obtiene lista global de installments con filtros opcionales
 *
 * Query params:
 *   - page: número de página (default: 1)
 *   - limit: registros por página (default: 10, max: 100)
 *   - status: filtrar por estado ('pending' o 'paid')
 *   - paymentId: filtrar por pago específico
 *   - customerId: filtrar por cliente específico
 *   - startDate: filtrar cuotas con vencimiento desde esta fecha (ISO string)
 *   - endDate: filtrar cuotas con vencimiento hasta esta fecha (ISO string)
 *
 * Response:
 *   - installments: Array de installments con payment, customer y allocations incluidas
 *   - pagination: { page, limit, total, totalPages }
 *   - stats: { total, pending, paid, overdue, totalPending, totalPaid, totalOverdue }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const status = searchParams.get("status") || "";
    const paymentId = searchParams.get("paymentId") || "";
    const customerId = searchParams.get("customerId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const skip = (page - 1) * limit;

    // Construir filtro dinámico
    const where: Prisma.InstallmentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (paymentId) {
      where.paymentId = paymentId;
    }

    // Filtro de rango de fechas (dueDate)
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.dueDate.lte = new Date(endDate);
      }
    }

    // Filtro por cliente (via payment -> customer)
    if (customerId) {
      where.payment = {
        customerId,
      };
    }

    // Fecha de hoy para calcular vencidas
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filtro para cuotas vencidas (pending + dueDate < hoy)
    const overdueWhere: Prisma.InstallmentWhereInput = {
      ...where,
      status: "pending",
      dueDate: { lt: today },
    };

    // Obtener installments, total count y stats agregadas en paralelo
    const [installments, total, statusGroups, overdueCount, overdueAggregate] =
      await Promise.all([
        prisma.installment.findMany({
          relationLoadStrategy: "join",
          where,
          skip,
          take: limit,
          orderBy: [
            { dueDate: "asc" },
            { installmentNumber: "asc" },
          ],
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                currency: true,
                date: true,
                reference: true,
                selectedInstallments: true,
                customer: {
                  select: {
                    id: true,
                    razonSocial: true,
                    phone: true,
                  },
                },
                paymentMethod: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                  },
                },
                allocations: {
                  select: {
                    id: true,
                    allocatedAmount: true,
                    invoice: {
                      select: {
                        id: true,
                        invoiceNumber: true,
                        total: true,
                        currency: true,
                        issueDate: true,
                        dueDate: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.installment.count({ where }),
        prisma.installment.groupBy({
          by: ["status"],
          where,
          _count: true,
          _sum: { amount: true },
        }),
        prisma.installment.count({ where: overdueWhere }),
        prisma.installment.aggregate({
          where: overdueWhere,
          _sum: { amount: true },
        }),
      ]);

    // Construir stats desde los resultados agregados
    const pendingGroup = statusGroups.find((g) => g.status === "pending");
    const paidGroup = statusGroups.find((g) => g.status === "paid");

    const stats = {
      total,
      pending: pendingGroup?._count ?? 0,
      paid: paidGroup?._count ?? 0,
      overdue: overdueCount,
      totalPending: Number(pendingGroup?._sum.amount ?? 0),
      totalPaid: Number(paidGroup?._sum.amount ?? 0),
      totalOverdue: Number(overdueAggregate._sum.amount ?? 0),
    };

    return NextResponse.json({
      installments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching installments:", error);
    return NextResponse.json(
      { error: "Error al obtener cuotas" },
      { status: 500 }
    );
  }
}
