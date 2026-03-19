import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { withLogging } from "@/lib/logger-middleware";
import { calculateInvoiceStatuses } from "@/lib/business-logic/invoice-status";
import { recalculateCustomerBalancesWithRetry } from "@/lib/business-logic/customer-balance-retry";
import { getInvoiceStatuses } from "@/lib/cache/invoice-statuses";

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
 *   - orderBy: campo para ordenar (issueDate | dueDate | invoiceNumber | total | balance) default: issueDate
 *   - orderDir: dirección del orden (asc | desc) default: desc
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

  // Ordenamiento configurable (FEFO para pagos: orderBy=dueDate&orderDir=asc)
  const allowedOrderFields = [
    "issueDate",
    "dueDate",
    "invoiceNumber",
    "total",
    "balance",
  ] as const;
  const orderByParam = searchParams.get("orderBy") || "issueDate";
  const orderBy = allowedOrderFields.includes(
    orderByParam as (typeof allowedOrderFields)[number]
  )
    ? (orderByParam as (typeof allowedOrderFields)[number])
    : "issueDate";
  const orderDirParam = searchParams.get("orderDir") || "desc";
  const orderDir = orderDirParam === "asc" ? "asc" : "desc";

  logger.debug(
    {
      page,
      limit: limit ?? "unlimited",
      search: search || undefined,
      customerId: customerId || undefined,
      withBalance,
      pendingOnly,
      includeCompleted,
      orderBy,
      orderDir,
    },
    "Fetching invoices with filters"
  );

  const skip = limit ? (page - 1) * limit : 0;

  try {
    // Construir filtro de búsqueda
    const where: Prisma.InvoiceWhereInput = {};

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

    // Filtrar por balance en SQL (más eficiente que en JS)
    // - pendingOnly: solo facturas con balance > 0
    // - !includeCompleted: excluir completadas (balance <= 0)
    if (pendingOnly || !includeCompleted) {
      where.balance = { gt: 0 };
    }

    // Filtro base sin balance (para filtros globales que incluyen completadas)
    const whereBase: Prisma.InvoiceWhereInput = {};
    if (search) whereBase.OR = where.OR;
    if (customerId) whereBase.customerId = customerId;

    // Obtener facturas, total count, filtros globales y último número en paralelo
    const [
      invoicesRaw,
      total,
      distinctCustomers,
      distinctInvoiceStatuses,
      distinctPaymentStatuses,
      lastInvoiceRecord,
    ] = await Promise.all([
      prisma.invoice.findMany({
        relationLoadStrategy: "join",
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDir },
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
      }),
      prisma.invoice.count({ where }),
      // Filtros globales: clientes con facturas (sin filtro de balance)
      prisma.customer.findMany({
        where: { invoices: { some: whereBase } },
        select: { id: true, razonSocial: true },
        orderBy: { razonSocial: "asc" },
      }),
      // Estados de factura activos
      prisma.invoiceStatus.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { order: "asc" },
      }),
      // Estados de pago activos
      prisma.paymentInvoiceStatus.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { order: "asc" },
      }),
      // Último número de factura (MAX)
      prisma.invoice.findFirst({
        select: { invoiceNumber: true },
        orderBy: { invoiceNumber: "desc" },
      }),
    ]);

    // Obtener estados del sistema (con cache - elimina 6 queries repetidas)
    const availableStatuses = await getInvoiceStatuses();

    // Calcular estados automáticos (balance ya viene de DB)
    const invoices = invoicesRaw.map((invoice) => {
      // Balance y paidAmount ya vienen calculados de DB
      const balance = Number(invoice.balance);
      const paidAmount = Number(invoice.paidAmount);

      // Calcular estados correctos basados en balance y fecha
      const calculatedStatuses = calculateInvoiceStatuses(
        {
          balance,
          paidAmount,
          dueDate: invoice.dueDate,
        },
        availableStatuses
      );

      // Retornar factura con estados calculados
      return {
        ...invoice,
        paidAmount,
        balance,
        invoiceStatus: calculatedStatuses.invoiceStatus,
        paymentInvoiceStatus: calculatedStatuses.paymentInvoiceStatus,
      };
    });

    // ✅ Filtro de completadas ya aplicado en WHERE clause de Prisma
    // No es necesario filtrar en JavaScript

    logger.info(
      {
        found: invoices.length,
        total,
        page,
        withBalance,
        pendingOnly,
        includeCompleted,
      },
      "Invoices fetched successfully"
    );

    return NextResponse.json({
      invoices: invoices,
      pagination: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
      filters: {
        customers: distinctCustomers.map((c) => ({
          value: c.id,
          label: c.razonSocial,
        })),
        invoiceStatuses: distinctInvoiceStatuses.map((s) => ({
          value: s.name,
          label: s.name,
        })),
        paymentStatuses: distinctPaymentStatuses.map((s) => ({
          value: s.name,
          label: s.name,
        })),
      },
      meta: {
        lastInvoiceNumber: lastInvoiceRecord?.invoiceNumber ?? null,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching invoices");
    return NextResponse.json(
      { error: "Error al obtener facturas" },
      { status: 500 }
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
        { status: 400 }
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
        { status: 500 }
      );
    }

    invoiceLogger.debug(
      {
        invoiceStatusId: initialInvoiceStatus.id,
        invoiceStatusName: initialInvoiceStatus.name,
        paymentStatusId: initialPaymentStatus.id,
        paymentStatusName: initialPaymentStatus.name,
      },
      "Using initial statuses"
    );

    // Verificar si el número de factura ya existe
    invoiceLogger.debug(
      { invoiceNumber },
      "Checking for duplicate invoice number"
    );
    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    });
    if (existingInvoice) {
      invoiceLogger.warn({ invoiceNumber }, "Invoice number already exists");
      return NextResponse.json(
        { error: "Ya existe una factura con ese número" },
        { status: 409 }
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
        { status: 404 }
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
        balance: total, // Balance inicial = total (sin pagos)
        paidAmount: 0, // Sin pagos inicialmente
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
      "Invoice created successfully"
    );

    // Recalcular balances del cliente después de crear factura (con retry automático)
    invoiceLogger.debug(
      { customerId },
      "Recalculating customer balances after invoice creation"
    );
    await recalculateCustomerBalancesWithRetry(customerId, invoiceLogger);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    invoiceLogger.error({ err: error }, "Error creating invoice");
    return NextResponse.json(
      { error: "Error al crear factura" },
      { status: 500 }
    );
  }
});
