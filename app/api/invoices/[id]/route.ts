import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger as baseLogger } from "@/lib/logger";

/**
 * GET /api/invoices/[id]
 *
 * Obtiene una factura por su ID con todas sus relaciones
 * Incluye cálculo de monto asignado (allocatedAmount) y balance
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logger = baseLogger.child({ invoiceId: id });

  logger.debug({ invoiceId: id }, "Fetching invoice by ID");

  try {
    // Obtener factura con todas las relaciones necesarias
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            rut: true,
            razonSocial: true,
            tradeName: true,
            contact: true,
            phone: true,
            email: true,
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
        allocations: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                date: true,
                reference: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      logger.warn({ invoiceId: id }, "Invoice not found");
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Calcular monto total asignado de pagos
    const allocatedAmount = invoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );

    // Calcular balance pendiente
    const balance = Number(invoice.total) - allocatedAmount;

    logger.info(
      {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        allocatedAmount,
        balance,
      },
      "Invoice fetched successfully"
    );

    // Retornar factura con campos calculados
    return NextResponse.json({
      ...invoice,
      allocatedAmount,
      balance,
    });
  } catch (error) {
    logger.error({ err: error, invoiceId: id }, "Error fetching invoice");
    return NextResponse.json(
      { error: "Error al obtener factura" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/invoices/[id]
 *
 * Actualiza una factura existente
 *
 * Reglas de negocio:
 * - NO permite editar si tiene pagos aplicados (allocatedAmount > 0)
 * - NO permite editar si está en estado final (Pagada/Anulada)
 * - Valida que el nuevo invoiceNumber no esté duplicado
 * - Mantiene consistencia de cálculos (total = subtotal + taxAmount)
 *
 * Body: InvoiceFormData parcial
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const invoiceLogger = baseLogger.child({
    invoiceId: id,
    invoiceNumber,
  });

  invoiceLogger.info("Invoice update requested");

  try {
    // 1. Verificar que la factura existe
    invoiceLogger.debug("Checking if invoice exists");
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceStatus: true,
        paymentInvoiceStatus: true,
        allocations: true,
      },
    });

    if (!existingInvoice) {
      invoiceLogger.warn("Invoice not found");
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // 2. Verificar que no tenga pagos aplicados
    const allocatedAmount = existingInvoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );

    if (allocatedAmount > 0) {
      invoiceLogger.warn(
        { allocatedAmount },
        "Cannot edit invoice with payments"
      );
      return NextResponse.json(
        {
          error:
            "No se puede editar una factura que tiene pagos aplicados. Elimine los pagos primero.",
        },
        { status: 400 }
      );
    }

    // 3. Verificar que no esté en estado final (Pagada completamente)
    if (existingInvoice.paymentInvoiceStatus.isFinal) {
      invoiceLogger.warn(
        { statusName: existingInvoice.paymentInvoiceStatus.name },
        "Cannot edit invoice in final payment status"
      );
      return NextResponse.json(
        {
          error: `No se puede editar una factura que está completamente pagada`,
        },
        { status: 400 }
      );
    }

    // 4. Si cambia invoiceNumber, verificar que no exista duplicado
    if (invoiceNumber && invoiceNumber !== existingInvoice.invoiceNumber) {
      invoiceLogger.debug(
        { newInvoiceNumber: invoiceNumber },
        "Checking for duplicate invoice number"
      );
      const duplicate = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: invoiceNumber.trim(),
          NOT: { id },
        },
      });

      if (duplicate) {
        invoiceLogger.warn({ invoiceNumber }, "Invoice number already exists");
        return NextResponse.json(
          { error: "Ya existe otra factura con ese número" },
          { status: 409 }
        );
      }
    }

    // 5. Validar consistencia de montos (si se proporcionan)
    if (
      total !== undefined &&
      subtotal !== undefined &&
      taxAmount !== undefined
    ) {
      const expectedTotal = subtotal + taxAmount;
      if (Math.abs(total - expectedTotal) > 0.01) {
        invoiceLogger.warn(
          { subtotal, taxAmount, total, expectedTotal },
          "Total does not match subtotal + taxAmount"
        );
        return NextResponse.json(
          {
            error:
              "El total no coincide con la suma de subtotal + IVA. Verifique los cálculos.",
          },
          { status: 400 }
        );
      }
    }

    // 6. Si se cambia customerId, verificar que el cliente existe
    if (customerId && customerId !== existingInvoice.customerId) {
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
    }

    invoiceLogger.debug("Validations passed, updating invoice");

    // 8. Actualizar factura con los campos proporcionados
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(invoiceNumber && { invoiceNumber: invoiceNumber.trim() }),
        ...(customerId && { customerId }),
        ...(subtotal !== undefined && { subtotal }),
        ...(taxAmount !== undefined && { taxAmount }),
        ...(total !== undefined && { total }),
        ...(currency && { currency }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
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
        invoiceId: id,
        invoiceNumber: updatedInvoice.invoiceNumber,
      },
      "Invoice updated successfully"
    );

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    invoiceLogger.error({ err: error }, "Error updating invoice");
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 *
 * Elimina una factura
 *
 * Reglas de negocio:
 * - NO permite eliminar si tiene pagos aplicados
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logger = baseLogger.child({ invoiceId: id });

  logger.info({ invoiceId: id }, "Invoice deletion requested");

  try {
    // Verificar que la factura existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });

    if (!existingInvoice) {
      logger.warn({ invoiceId: id }, "Invoice not found");
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que no tenga pagos aplicados
    const allocatedAmount = existingInvoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0
    );

    if (allocatedAmount > 0) {
      logger.warn(
        { invoiceId: id, allocatedAmount },
        "Cannot delete invoice with payments"
      );
      return NextResponse.json(
        {
          error:
            "No se puede eliminar una factura que tiene pagos aplicados. Elimine los pagos primero.",
        },
        { status: 400 }
      );
    }

    // Eliminar factura
    await prisma.invoice.delete({
      where: { id },
    });

    logger.info({ invoiceId: id }, "Invoice deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Factura eliminada correctamente",
    });
  } catch (error) {
    logger.error({ err: error, invoiceId: id }, "Error deleting invoice");
    return NextResponse.json(
      { error: "Error al eliminar factura" },
      { status: 500 }
    );
  }
}
