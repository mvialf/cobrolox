import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseExcel } from "@/lib/import/excel-parser";
import {
  validateInvoiceBatch,
  type InvoiceCSVRow,
} from "@/lib/import/invoice-import";
import { rutHelpers } from "@/lib/rut-validations";

/**
 * Obtiene los estados iniciales del sistema para facturas
 */
async function getInitialStatuses() {
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
    throw new Error("Estados iniciales no configurados en el sistema");
  }

  return {
    invoiceStatusId: initialInvoiceStatus.id,
    paymentInvoiceStatusId: initialPaymentStatus.id,
  };
}

/**
 * POST /api/import/invoices
 * Importa facturas masivamente desde un archivo Excel
 *
 * Las facturas se crean en estado inicial, sin pagos asociados.
 * Para registrar pagos, usar el sistema de pagos después de la importación.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar que sea Excel
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "El archivo debe ser Excel (.xlsx o .xls)" },
        { status: 400 }
      );
    }

    // Parsear Excel
    const parseResult = await parseExcel<InvoiceCSVRow>(file);

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "Error al parsear el archivo Excel",
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    if (parseResult.data.length === 0) {
      return NextResponse.json(
        { error: "El archivo Excel está vacío" },
        { status: 400 }
      );
    }

    // Validar datos
    const validation = validateInvoiceBatch(parseResult.data);

    if (validation.validInvoices.length === 0) {
      return NextResponse.json(
        {
          error: "No hay facturas válidas para importar",
          validation: {
            summary: validation.summary,
            errors: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Verificar duplicados en el archivo (por invoiceNumber)
    const invoiceNumberCounts = new Map<string, number>();
    validation.validInvoices.forEach((invoice) => {
      invoiceNumberCounts.set(
        invoice.invoiceNumber,
        (invoiceNumberCounts.get(invoice.invoiceNumber) || 0) + 1
      );
    });

    const duplicatesInCSV = Array.from(invoiceNumberCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([number]) => number);

    if (duplicatesInCSV.length > 0) {
      return NextResponse.json(
        {
          error: "Hay números de factura duplicados en el archivo Excel",
          duplicates: duplicatesInCSV,
        },
        { status: 400 }
      );
    }

    // Verificar duplicados en la DB
    const existingInvoices = await prisma.invoice.findMany({
      where: {
        invoiceNumber: {
          in: validation.validInvoices.map((inv) => inv.invoiceNumber),
        },
      },
      select: { invoiceNumber: true },
    });

    const existingNumbers = new Set(
      existingInvoices.map(
        (inv: { invoiceNumber: string }) => inv.invoiceNumber
      )
    );
    const duplicatesInDB = validation.validInvoices
      .filter((inv) => existingNumbers.has(inv.invoiceNumber))
      .map((inv) => inv.invoiceNumber);

    if (duplicatesInDB.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos números de factura ya existen en la base de datos",
          duplicates: duplicatesInDB,
          message:
            "Por favor, elimine estas facturas del archivo Excel o actualice las existentes manualmente",
        },
        { status: 409 }
      );
    }

    // Obtener estados iniciales
    const initialStatuses = await getInitialStatuses();

    // Obtener todos los RUTs únicos y validar que existan
    // IMPORTANTE: Los RUTs en la DB están SIN FORMATO, por eso usamos clean() en vez de format()
    const uniqueRuts = [
      ...new Set(
        validation.validInvoices.map((inv) => rutHelpers.clean(inv.customerRut))
      ),
    ];

    const customers = await prisma.customer.findMany({
      where: { rut: { in: uniqueRuts } },
      select: { id: true, rut: true },
    });

    const customerMap = new Map(
      customers.map((c: { rut: string; id: string }) => [c.rut, c.id])
    );

    // Validar que todos los RUTs existan
    const missingCustomers: string[] = [];
    validation.validInvoices.forEach((invoice) => {
      const cleanRut = rutHelpers.clean(invoice.customerRut);
      if (!customerMap.has(cleanRut)) {
        // Mostrar el RUT formateado en el error para mejor legibilidad
        missingCustomers.push(rutHelpers.format(cleanRut));
      }
    });

    if (missingCustomers.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos clientes no existen en la base de datos",
          missingCustomers: [...new Set(missingCustomers)],
          message:
            "Por favor, importe primero los clientes o verifique los RUTs",
        },
        { status: 400 }
      );
    }

    // Usar transacción para garantizar atomicidad
    const result = await prisma.$transaction(async (tx) => {
      let importedCount = 0;

      for (const invoice of validation.validInvoices) {
        const cleanRut = rutHelpers.clean(invoice.customerRut);
        const customerId = customerMap.get(cleanRut)!;

        // Crear la factura con estados iniciales
        await tx.invoice.create({
          data: {
            invoiceNumber: invoice.invoiceNumber,
            customerId,
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            total: invoice.total,
            currency: invoice.currency,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            invoiceStatusId: initialStatuses.invoiceStatusId,
            paymentInvoiceStatusId: initialStatuses.paymentInvoiceStatusId,
            notes: invoice.notes,
          },
        });

        importedCount++;
      }

      return { importedCount };
    });

    return NextResponse.json({
      success: true,
      imported: result.importedCount,
      summary: validation.summary,
      errors: validation.errors,
      message: `Se importaron ${result.importedCount} facturas exitosamente`,
    });
  } catch (error) {
    console.error("Error importing invoices:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
