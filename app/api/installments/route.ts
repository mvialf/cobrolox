import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getInstallmentStatus } from "@/lib/business-logic/installments";

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

    // Fecha de hoy para derivar estados
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Construir filtro dinámico
    const where: Prisma.InstallmentWhereInput = {};

    // Filtrar por status derivado de dueDate
    if (status === "paid") {
      where.dueDate = { lte: today };
    } else if (status === "pending") {
      where.dueDate = { gt: today };
    }

    if (paymentId) {
      where.paymentId = paymentId;
    }

    // Filtro de rango de fechas (dueDate) - merge con filtro de status
    if (startDate || endDate) {
      const existing = (where.dueDate as Record<string, Date>) || {};
      if (startDate) {
        existing.gte = new Date(startDate);
      }
      if (endDate) {
        existing.lte = new Date(endDate);
      }
      where.dueDate = existing;
    }

    // Filtro por cliente (via payment -> customer)
    if (customerId) {
      where.payment = {
        customerId,
      };
    }

    // Filtros derivados para stats por dueDate
    const baseWhere = { ...where };
    // Eliminar filtro de dueDate del base para stats globales
    const { dueDate: _dueDateFilter, ...whereWithoutDate } = baseWhere;
    const statsWhere = status ? whereWithoutDate : where;

    const paidWhere: Prisma.InstallmentWhereInput = { ...statsWhere, dueDate: { lte: today } };
    const pendingWhere: Prisma.InstallmentWhereInput = { ...statsWhere, dueDate: { gt: today } };

    // Obtener installments, total count y stats en paralelo
    const [installments, total, paidCount, paidSum, pendingCount, pendingSum] =
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
        prisma.installment.count({ where: paidWhere }),
        prisma.installment.aggregate({ where: paidWhere, _sum: { amount: true } }),
        prisma.installment.count({ where: pendingWhere }),
        prisma.installment.aggregate({ where: pendingWhere, _sum: { amount: true } }),
      ]);

    const stats = {
      total,
      pending: pendingCount,
      paid: paidCount,
      overdue: 0, // Ya no hay concepto separado de overdue — pending incluye las vencidas
      totalPending: Number(pendingSum._sum.amount ?? 0),
      totalPaid: Number(paidSum._sum.amount ?? 0),
      totalOverdue: 0,
    };

    // Derivar status e isOverdue como campos virtuales
    const installmentsWithStatus = installments.map((inst) => ({
      ...inst,
      status: getInstallmentStatus(inst.dueDate),
      isOverdue: inst.dueDate < today && getInstallmentStatus(inst.dueDate) === "pending",
    }));

    return NextResponse.json({
      installments: installmentsWithStatus,
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
