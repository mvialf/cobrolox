import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withLogging } from "@/lib/logger-middleware";
import { calculateInvoiceStatuses } from "@/lib/business-logic/invoice-status";
import {
  INVOICE_STATUS,
  PAYMENT_STATUS,
} from "@/lib/constants/invoice-status-constants";
import { recalculateCustomerBalancesWithRetry } from "@/lib/business-logic/customer-balance-retry";

/**
 * GET /api/invoices
 *
 * Obtiene lista de facturas con paginación opcional
 *
 * Query params:
 *   - page: número de página (default: 1)
 *   - limit: registros por página (omitir o 0 = todos, max: 10000)
 *   - search: buscar por número de factura o cliente
 *   - customerId: filtrar por cliente específico
 *   - withBalance: si es "true", calcula balance (total - paidAmount)
 *   - pendingOnly: si es "true", solo facturas con balance > 0
 *   - includeCompleted: si es "true", incluye facturas completadas (default: false)
 */
export const GET = withLogging(async (request, logger) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  // Si no se especifica limit o es 0, devolver todos los registros
  const limitParam = searchParams.get("limit");
  const limit =
    limitParam === "0" || !limitParam
      ? undefined
      : Math.min(parseInt(limitParam), 10000);
  const search = searchParams.get("search") || "";
  const customerId = searchParams.get("customerId") || "";
  const withBalance = searchParams.get("withBalance") === "true";
  const pendingOnly = searchParams.get("pendingOnly") === "true";
  const includeCompleted = searchParams.get("includeCompleted") === "true";

  logger.debug(
    {
      page,
      limit: limit ?? "unlimited",
      search: search || undefined,
      customerId: customerId || undefined,
      withBalance,
      pendingOnly,
      includeCompleted,
    },
    "Fetching invoices with filters",
  );

  const skip = limit ? (page - 1) * limit : 0;

  try {
    // Construir filtro de búsqueda
    const where: any = {};

    if (search) {
      where.OR = [
        {
          invoiceNumber: { contains: search, mode: "insensitive" as const },
        },
        {
          customer: {
            razonSocial: { contains: search, mode: "insensitive" as const },
          },
        },
        {
          customer: {
            rut: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    // Filtro por cliente
    if (customerId) {
      where.customerId = customerId;
    }

    // Obtener facturas con datos relacionados y total count
    const [invoicesRaw, total] = await Promise.all([
      prisma.invoice.findMany({
        relationLoadStrategy: "join",
        where,
        skip,
        take: limit, // Si es undefined, trae todos los registros
        orderBy: { issueDate: "asc" }, // Ascendente: más antiguas primero (consistente con FIFO)
        include: {
          customer: {
            select: {
              id: true,
              rut: true,
              razonSocial: true,
              tradeName: true,
            },
          },
          invoiceStatus: {
            include: {
              color: true,
            },
          },
          paymentInvoiceStatus: {
            include: {
              color: true,
            },
          },
          // Incluir allocations solo si se necesita calcular balance
          allocations: withBalance
            ? {
                select: {
                  allocatedAmount: true,
                },
              }
            : false,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Obtener estados del sistema para cálculo automático
    const [currentStatus, overdueStatus, completedStatus] = await Promise.all([
      prisma.invoiceStatus.findUnique({
        where: { name: INVOICE_STATUS.CURRENT },
        include: { color: true },
      }),
      prisma.invoiceStatus.findUnique({
        where: { name: INVOICE_STATUS.OVERDUE },
        include: { color: true },
      }),
      prisma.invoiceStatus.findUnique({
        where: { name: INVOICE_STATUS.COMPLETED },
        include: { color: true },
      }),
    ]);

    const [pendingPayment, partialPayment, paidPayment] = await Promise.all([
      prisma.paymentInvoiceStatus.findUnique({
        where: { name: PAYMENT_STATUS.PENDING },
        include: { color: true },
      }),
      prisma.paymentInvoiceStatus.findUnique({
        where: { name: PAYMENT_STATUS.PARTIAL },
        include: { color: true },
      }),
      prisma.paymentInvoiceStatus.findUnique({
        where: { name: PAYMENT_STATUS.PAID },
        include: { color: true },
      }),
    ]);

    if (
      !currentStatus ||
      !overdueStatus ||
      !completedStatus ||
      !pendingPayment ||
      !partialPayment ||
      !paidPayment
    ) {
      logger.error("Estados del sistema no encontrados");
      throw new Error("Estados del sistema no configurados correctamente");
    }

    const availableStatuses = {
      invoice: {
        current: currentStatus,
        overdue: overdueStatus,
        completed: completedStatus,
      },
      payment: {
        pending: pendingPayment,
        partial: partialPayment,
        paid: paidPayment,
      },
    };

    // Calcular balance y estados automáticos
    const invoices = invoicesRaw.map((invoice) => {
      // Inicializar valores por defecto (balance = total cuando no hay pagos)
      let paidAmount = 0;
      let balance = Number(invoice.total);

      // Calcular balance real si hay allocations disponibles
      if (withBalance && "allocations" in invoice) {
        paidAmount = invoice.allocations.reduce(
          (sum, alloc) => sum + Number(alloc.allocatedAmount),
          0,
        );
        balance = Number(invoice.total) - paidAmount;
      }

      // Remover allocations del response (solo usados para calcular)
      const { allocations, ...invoiceData } = invoice as any;

      // Calcular estados correctos basados en balance y fecha
      const calculatedStatuses = calculateInvoiceStatuses(
        {
          balance,
          paidAmount,
          dueDate: invoice.dueDate,
        },
        availableStatuses,
      );

      // Retornar factura con estados calculados
      return {
        ...invoiceData,
        paidAmount,
        balance,
        invoiceStatus: calculatedStatuses.invoiceStatus,
        paymentInvoiceStatus: calculatedStatuses.paymentInvoiceStatus,
      };
    });

    // Filtrar por estado completado si no se solicitó incluirlas (default: ocultar completadas)
    let filteredInvoices = includeCompleted
      ? invoices
      : invoices.filter((inv) => inv.invoiceStatus.name !== "completed");

    // Filtrar por pendingOnly si se solicitó (solo facturas con balance > 0)
    if (pendingOnly) {
      filteredInvoices = filteredInvoices.filter((inv) => inv.balance > 0);
    }

    logger.info(
      {
        found: filteredInvoices.length,
        total,
        page,
        withBalance,
        pendingOnly,
      },
      "Invoices fetched successfully",
    );

    return NextResponse.json({
      invoices: filteredInvoices,
      pagination: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching invoices");
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/invoices
 *
 * Crea una nueva factura
 *
 * Body: InvoiceFormData (ver invoice-validations.ts)
 */
export const POST = withLogging(async (request, logger) => {
  const body = await request.json();
  const {
    invoiceNumber,
    customerId,
    subtotal,
    taxAmount,
    total,
    currency,
    issueDate,
    dueDate,
    notes,
  } = body;

  // Child logger con contexto de negocio
  const invoiceLogger = logger.child({
    invoiceNumber,
    customerId,
    total,
  });

  invoiceLogger.info("Invoice creation requested");

  try {
    // Validación básica (el schema zod ya valida en frontend, pero double-check)
    invoiceLogger.debug("Starting validations");

    if (
      !invoiceNumber ||
      !customerId ||
      subtotal === undefined ||
      taxAmount === undefined ||
      total === undefined ||
      !issueDate ||
      !dueDate
    ) {
      invoiceLogger.warn("Missing required fields");
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    // Obtener estados iniciales del sistema
    invoiceLogger.debug("Fetching initial statuses");
    const [initialInvoiceStatus, initialPaymentStatus] = await Promise.all([
      prisma.invoiceStatus.findFirst({
        where: { isInitial: true, isActive: true },
        orderBy: { order: "asc" },
      }),
      prisma.paymentInvoiceStatus.findFirst({
        where: { isInitial: true, isActive: true },
        orderBy: { order: "asc" },
      }),
    ]);

    if (!initialInvoiceStatus || !initialPaymentStatus) {
      invoiceLogger.error("Initial statuses not found in database");
      return NextResponse.json(
        {
          error:
            "Estados iniciales no configurados. Ejecute el seed de la base de datos.",
        },
        { status: 500 },
      );
    }

    invoiceLogger.debug(
      {
        invoiceStatusId: initialInvoiceStatus.id,
        invoiceStatusName: initialInvoiceStatus.name,
        paymentStatusId: initialPaymentStatus.id,
        paymentStatusName: initialPaymentStatus.name,
      },
      "Using initial statuses",
    );

    // Verificar si el número de factura ya existe
    invoiceLogger.debug(
      { invoiceNumber },
      "Checking for duplicate invoice number",
    );
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    });
    if (existingInvoice) {
      invoiceLogger.warn({ invoiceNumber }, "Invoice number already exists");
      return NextResponse.json(
        { error: "Ya existe una factura con ese número" },
        { status: 409 },
      );
    }

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      invoiceLogger.warn({ customerId }, "Customer not found");
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    invoiceLogger.debug("Validations passed");

    // Crear factura con estados iniciales
    invoiceLogger.info("Creating invoice in database");
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber.trim(),
        customerId,
        subtotal,
        taxAmount,
        total,
        currency: currency || "CLP",
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        invoiceStatusId: initialInvoiceStatus.id,
        paymentInvoiceStatusId: initialPaymentStatus.id,
        notes: notes?.trim() || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            rut: true,
            razonSocial: true,
            tradeName: true,
          },
        },
        invoiceStatus: {
          include: {
            color: true,
          },
        },
        paymentInvoiceStatus: {
          include: {
            color: true,
          },
        },
      },
    });

    invoiceLogger.info(
      {
        invoiceId: invoice.id,
      },
      "Invoice created successfully",
    );

    // Recalcular balances del cliente después de crear factura (con retry automático)
    invoiceLogger.debug(
      { customerId },
      "Recalculating customer balances after invoice creation",
    );
    await recalculateCustomerBalancesWithRetry(customerId, invoiceLogger);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    invoiceLogger.error({ err: error }, "Error creating invoice");
    return NextResponse.json(
      { error: "Error al crear factura" },
      { status: 500 },
    );
  }
});
