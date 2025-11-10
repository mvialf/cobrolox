import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import { AllocationInput, PaymentWhereInput } from "@/types/api";
import { withLogging } from "@/lib/logger-middleware";
import { recalculateCustomerBalances } from "@/lib/business-logic/customer-balance";

/**
 * GET /api/payments
 *
 * Obtiene lista de pagos con filtros opcionales
 *
 * Query params:
 *   - page: número de página (default: 1)
 *   - limit: registros por página (default: 10, max: 100)
 *   - customerId: filtrar por cliente específico
 *   - projectId: filtrar por proyecto específico
 *   - startDate: filtrar pagos desde esta fecha (ISO string)
 *   - endDate: filtrar pagos hasta esta fecha (ISO string)
 */
export const GET = withLogging(async (request, logger) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
  const customerId = searchParams.get("customerId") || "";
  const projectId = searchParams.get("projectId") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  logger.debug(
    {
      page,
      limit,
      filters: {
        customerId: customerId || undefined,
        projectId: projectId || undefined,
        dateRange: startDate || endDate ? { startDate, endDate } : undefined,
      },
    },
    "Fetching payments with filters",
  );

  const skip = (page - 1) * limit;

  // Construir filtro dinámico
  const where: PaymentWhereInput = {};

  if (customerId) {
    where.customerId = customerId;
  }

  // Filtro de rango de fechas
  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  // Filtro por factura (via allocations)
  if (projectId) {
    // Mantener nombre 'projectId' por compatibilidad pero usar invoiceId
    where.allocations = {
      some: {
        invoiceId: projectId, // En realidad es invoiceId
      },
    };
  }

  try {
    // Obtener pagos y total count
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        relationLoadStrategy: "join", // ← Fix N+1: Force database-level JOINs
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" }, // Más recientes primero
        include: {
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
            orderBy: {
              invoice: {
                issueDate: "asc", // Ordenar por FIFO (fecha de emisión)
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    logger.info(
      {
        found: payments.length,
        total,
        page,
      },
      "Payments fetched successfully",
    );

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching payments");
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/payments
 *
 * Crea un nuevo pago
 *
 * Body:
 *   - customerId: string (requerido)
 *   - amount: number (requerido)
 *   - currency: string (requerido, ej: 'CLP')
 *   - date: ISO date string (requerido)
 *   - paymentMethodId: string (requerido)
 *   - reference: string (opcional, requerido si payment method lo requiere)
 *   - notes: string (opcional)
 *   - allocations: Array<{ invoiceId: string, allocatedAmount: number }> (min 1)
 */
export const POST = withLogging(async (request, logger) => {
  const body = await request.json();
  const {
    type,
    customerId,
    amount,
    currency,
    date,
    paymentMethodId,
    reference,
    notes,
    allocations,
    selectedInstallments,
  } = body;

  // Child logger con contexto de negocio
  const paymentLogger = logger.child({
    type,
    customerId,
    amount,
    currency,
    allocationCount: allocations?.length,
  });

  paymentLogger.info("Payment creation requested");

  try {
    // Validaciones básicas
    paymentLogger.debug("Starting basic validations");

    if (!type || (type !== "Invoice" && type !== "Customer")) {
      paymentLogger.warn({ providedType: type }, "Invalid payment type");
      return NextResponse.json(
        { error: 'El tipo de pago debe ser "Invoice" o "Customer"' },
        { status: 400 },
      );
    }

    if (!customerId || typeof customerId !== "string") {
      paymentLogger.warn("Missing or invalid customerId");
      return NextResponse.json(
        { error: "El cliente es requerido" },
        { status: 400 },
      );
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      paymentLogger.warn({ amount }, "Invalid amount");
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 },
      );
    }

    if (!currency || typeof currency !== "string" || currency.length !== 3) {
      paymentLogger.warn({ currency }, "Invalid currency");
      return NextResponse.json(
        { error: "La moneda debe ser un código de 3 letras" },
        { status: 400 },
      );
    }

    if (!date) {
      paymentLogger.warn("Missing date");
      return NextResponse.json(
        { error: "La fecha es requerida" },
        { status: 400 },
      );
    }

    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      paymentLogger.warn("Missing or invalid paymentMethodId");
      return NextResponse.json(
        { error: "El método de pago es requerido" },
        { status: 400 },
      );
    }

    if (
      !allocations ||
      !Array.isArray(allocations) ||
      allocations.length === 0
    ) {
      paymentLogger.warn("Missing or empty allocations");
      return NextResponse.json(
        { error: "Debe asignar el pago a al menos una factura" },
        { status: 400 },
      );
    }

    // Validación estricta: type debe coincidir con número de allocations
    if (type === "Invoice" && allocations.length !== 1) {
      paymentLogger.warn(
        { expected: 1, actual: allocations.length },
        "Invoice payment must have exactly 1 allocation",
      );
      return NextResponse.json(
        { error: 'Un pago tipo "Invoice" debe tener exactamente 1 asignación' },
        { status: 400 },
      );
    }

    if (type === "Customer" && allocations.length < 1) {
      paymentLogger.warn(
        { actual: allocations.length },
        "Customer payment must have at least 1 allocation",
      );
      return NextResponse.json(
        { error: 'Un pago tipo "Customer" debe tener al menos 1 asignación' },
        { status: 400 },
      );
    }

    paymentLogger.debug("Basic validations passed");

    // Verificar que el customer existe
    paymentLogger.debug("Validating customer exists");
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customerExists) {
      paymentLogger.warn("Customer not found");
      return NextResponse.json(
        { error: "El cliente no existe" },
        { status: 404 },
      );
    }

    // Verificar que el payment method existe
    paymentLogger.debug(
      { paymentMethodId },
      "Validating payment method exists",
    );
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      paymentLogger.warn("Payment method not found");
      return NextResponse.json(
        { error: "El método de pago no existe" },
        { status: 404 },
      );
    }

    // Verificar que no haya invoiceIds duplicados
    const invoiceIds = allocations.map((a: AllocationInput) => a.invoiceId);
    if (new Set(invoiceIds).size !== invoiceIds.length) {
      paymentLogger.warn({ invoiceIds }, "Duplicate invoice IDs detected");
      return NextResponse.json(
        { error: "No puede asignar la misma factura dos veces" },
        { status: 400 },
      );
    }

    // Verificar que todas las facturas existen y pertenecen al mismo cliente
    paymentLogger.debug({ invoiceIds }, "Validating invoices");
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
      },
      select: {
        id: true,
        customerId: true,
        currency: true, // Solo traer campos necesarios para validación
      },
    });

    if (invoices.length !== invoiceIds.length) {
      paymentLogger.warn(
        { expected: invoiceIds.length, found: invoices.length },
        "Some invoices not found",
      );
      return NextResponse.json(
        { error: "Una o más facturas no existen" },
        { status: 404 },
      );
    }

    // Verificar que todas las facturas pertenecen al mismo cliente
    const allSameCustomer = invoices.every(
      (inv) => inv.customerId === customerId,
    );
    if (!allSameCustomer) {
      paymentLogger.warn("Not all invoices belong to same customer");
      return NextResponse.json(
        { error: "Todas las facturas deben pertenecer al mismo cliente" },
        { status: 400 },
      );
    }

    // Verificar que todas las facturas tienen la misma moneda
    const allSameCurrency = invoices.every((inv) => inv.currency === currency);
    if (!allSameCurrency) {
      paymentLogger.warn(
        { expected: currency, found: invoices.map((inv) => inv.currency) },
        "Currency mismatch",
      );
      return NextResponse.json(
        {
          error: "Todas las facturas deben tener la misma moneda que el pago",
        },
        { status: 400 },
      );
    }

    // Verificar que la suma de allocations sea igual al amount (con tolerancia de decimales)
    const totalAllocated = allocations.reduce(
      (sum: number, a: AllocationInput) => sum + a.allocatedAmount,
      0,
    );
    const diff = Math.abs(totalAllocated - amount);
    if (diff >= 0.01) {
      paymentLogger.warn(
        { expected: amount, actual: totalAllocated, diff },
        "Allocation sum mismatch",
      );
      return NextResponse.json(
        {
          error:
            "La suma de los montos asignados debe ser igual al monto total del pago",
        },
        { status: 400 },
      );
    }

    // CRÍTICO: Verificar que cada allocation no exceda el balance actual de cada factura
    paymentLogger.debug("Validating individual invoice balances");
    const invoicesWithAllocations = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
      },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        allocations: {
          select: {
            allocatedAmount: true,
          },
        },
      },
    });

    for (const allocation of allocations) {
      const invoice = invoicesWithAllocations.find(
        (inv) => inv.id === allocation.invoiceId,
      );
      if (!invoice) continue; // Ya validado antes que existe

      // Calcular balance actual
      const paidAmount = invoice.allocations.reduce(
        (sum, a) => sum + Number(a.allocatedAmount),
        0,
      );
      const currentBalance = Number(invoice.total) - paidAmount;

      // Validar con tolerancia decimal
      if (allocation.allocatedAmount > currentBalance + 0.01) {
        paymentLogger.warn(
          {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            allocatedAmount: allocation.allocatedAmount,
            currentBalance,
            excess: allocation.allocatedAmount - currentBalance,
          },
          "Allocation exceeds invoice balance",
        );
        return NextResponse.json(
          {
            error: `El monto asignado ($${allocation.allocatedAmount.toLocaleString("es-CL")}) excede el balance actual de la factura ${invoice.invoiceNumber} ($${currentBalance.toLocaleString("es-CL")})`,
          },
          { status: 400 },
        );
      }
    }

    paymentLogger.debug("All validations passed");

    // Crear el pago con sus allocations en una transacción
    const paymentDate = new Date(date);

    paymentLogger.info(
      {
        installments: selectedInstallments || 1,
        hasInstallments: !!selectedInstallments && selectedInstallments > 1,
      },
      "Creating payment in database",
    );

    const payment = await prisma.payment.create({
      data: {
        type, // ← Agregar tipo de pago
        customerId,
        amount: new Decimal(amount),
        currency,
        date: paymentDate,
        paymentMethodId,
        reference: reference?.trim() || null,
        notes: notes?.trim() || null,
        selectedInstallments: selectedInstallments || null,
        allocations: {
          create: allocations.map((a: AllocationInput) => ({
            invoiceId: a.invoiceId,
            allocatedAmount: new Decimal(a.allocatedAmount),
          })),
        },
        // Crear installments automáticamente si aplica
        installments:
          selectedInstallments && selectedInstallments > 1
            ? {
                create: Array.from({ length: selectedInstallments }, (_, i) => {
                  const installmentNumber = i + 1;
                  const isLastInstallment =
                    installmentNumber === selectedInstallments;

                  // Calcular monto de la cuota
                  // Dividir el total entre el número de cuotas, redondeando a 2 decimales
                  const baseInstallmentAmount =
                    Math.floor((amount / selectedInstallments) * 100) / 100;
                  // Calcular el total de las cuotas base (todas menos la última)
                  const totalBase =
                    baseInstallmentAmount * (selectedInstallments - 1);
                  // La última cuota absorbe la diferencia (centavos restantes)
                  const lastInstallmentAmount = amount - totalBase;

                  // Calcular fecha de vencimiento
                  // Primera cuota: día 0 (fecha del pago)
                  // Subsecuentes: cada 30 días
                  const dueDate = new Date(paymentDate);
                  dueDate.setDate(
                    dueDate.getDate() + (installmentNumber - 1) * 30,
                  );

                  return {
                    installmentNumber,
                    amount: new Decimal(
                      isLastInstallment
                        ? lastInstallmentAmount
                        : baseInstallmentAmount,
                    ),
                    dueDate,
                    status: "pending",
                  };
                }),
              }
            : undefined,
      },
      include: {
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
        installments: {
          select: {
            id: true,
            installmentNumber: true,
            amount: true,
            dueDate: true,
            paidDate: true,
            status: true,
          },
          orderBy: {
            installmentNumber: "asc",
          },
        },
      },
    });

    paymentLogger.info(
      {
        paymentId: payment.id,
        allocationsCreated: payment.allocations.length,
        installmentsCreated: payment.installments.length,
      },
      "Payment created successfully",
    );

    // Recalcular balances del cliente después de crear pago con allocations
    paymentLogger.debug(
      { customerId },
      "Recalculating customer balances after payment creation",
    );
    try {
      await recalculateCustomerBalances(customerId);
      paymentLogger.debug("Customer balances recalculated successfully");
    } catch (error) {
      // Log error pero no fallar el request (el pago ya fue creado exitosamente)
      paymentLogger.warn(
        { err: error, customerId },
        "Failed to recalculate customer balances, but payment was created",
      );
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    paymentLogger.error({ err: error }, "Error creating payment");
    return NextResponse.json({ error: "Error al crear pago" }, { status: 500 });
  }
});
