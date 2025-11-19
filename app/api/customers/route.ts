import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withLogging } from "@/lib/logger-middleware";

/**
 * GET /api/customers
 *
 * Obtiene lista de clientes con paginación opcional
 *
 * Query params:
 *   - page: número de página (default: 1)
 *   - limit: registros por página (omitir o 0 = todos, max: 10000)
 *   - search: buscar por nombre, email o teléfono
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

  logger.debug(
    {
      page,
      limit: limit ?? "unlimited",
      search: search || undefined,
    },
    "Fetching customers with filters"
  );

  const skip = limit ? (page - 1) * limit : 0;

  try {
    // Construir filtro de búsqueda
    const where = search
      ? {
          OR: [
            { razonSocial: { contains: search, mode: "insensitive" as const } },
            { rut: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { contact: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Obtener clientes y total count
    // NOTA: Las columnas balanceTotal, balanceVigente, balanceVencido
    // se retornan automáticamente (son parte del modelo Customer)
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit, // Si es undefined, trae todos los registros
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    logger.info(
      {
        found: customers.length,
        total,
        page,
      },
      "Customers fetched successfully"
    );

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching customers");
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
});

/**
 * POST /api/customers
 *
 * Crea un nuevo cliente
 *
 * Body: CustomerFormData (ver customer-validations.ts)
 */
export const POST = withLogging(async (request, logger) => {
  const body = await request.json();
  const {
    rut,
    razonSocial,
    tradeName,
    businessActivity,
    contact,
    phone,
    email,
    street,
    apartment,
    region,
    comuna,
  } = body;

  // Child logger con contexto de negocio
  const customerLogger = logger.child({
    rut,
    razonSocial,
    email: email || undefined,
  });

  customerLogger.info("Customer creation requested");

  try {
    // Validación básica (el schema zod ya valida en frontend, pero double-check)
    customerLogger.debug("Starting validations");

    if (
      !rut ||
      !razonSocial ||
      !contact ||
      !phone ||
      !street ||
      !region ||
      !comuna
    ) {
      customerLogger.warn("Missing required fields");
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar si el RUT ya existe
    customerLogger.debug({ rut }, "Checking for duplicate RUT");
    const existingCustomer = await prisma.customer.findUnique({
      where: { rut },
    });
    if (existingCustomer) {
      customerLogger.warn({ rut }, "RUT already exists");
      return NextResponse.json(
        { error: "Ya existe un cliente con ese RUT" },
        { status: 409 }
      );
    }

    customerLogger.debug("Validations passed");

    // Crear cliente con todos los campos
    customerLogger.info("Creating customer in database");
    const customer = await prisma.customer.create({
      data: {
        rut: rut.trim(),
        razonSocial: razonSocial.trim(),
        tradeName: tradeName?.trim() || null,
        businessActivity: businessActivity?.trim() || null,
        contact: contact.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        street: street.trim(),
        apartment: apartment?.trim() || null,
        region: region.trim(),
        comuna: comuna.trim(),
      },
    });

    customerLogger.info(
      {
        customerId: customer.id,
      },
      "Customer created successfully"
    );

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    customerLogger.error({ err: error }, "Error creating customer");
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
});
