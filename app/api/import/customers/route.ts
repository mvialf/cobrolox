import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseExcel } from "@/lib/import/excel-parser";
import {
  validateCustomerBatch,
  type CustomerCSVRow,
} from "@/lib/import/customer-import";

/**
 * POST /api/import/customers
 * Importa clientes masivamente desde un archivo CSV
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
    const parseResult = await parseExcel<CustomerCSVRow>(file);

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
    const validation = validateCustomerBatch(parseResult.data);

    if (validation.validCustomers.length === 0) {
      return NextResponse.json(
        {
          error: "No hay clientes válidos para importar",
          validation: {
            summary: validation.summary,
            errors: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Verificar duplicados en el CSV (por RUT)
    const rutCounts = new Map<string, number>();
    validation.validCustomers.forEach((customer) => {
      rutCounts.set(customer.rut, (rutCounts.get(customer.rut) || 0) + 1);
    });

    const duplicatesInCSV = Array.from(rutCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([rut]) => rut);

    if (duplicatesInCSV.length > 0) {
      return NextResponse.json(
        {
          error: "Hay RUTs duplicados en el archivo Excel",
          duplicates: duplicatesInCSV,
        },
        { status: 400 }
      );
    }

    // Verificar duplicados en la DB
    const existingCustomers = await prisma.customer.findMany({
      where: {
        rut: {
          in: validation.validCustomers.map((c: { rut: string }) => c.rut),
        },
      },
      select: { rut: true },
    });

    const existingRuts = new Set(existingCustomers.map((c) => c.rut));
    const duplicatesInDB = validation.validCustomers
      .filter((c) => existingRuts.has(c.rut))
      .map((c) => c.rut);

    if (duplicatesInDB.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos RUTs ya existen en la base de datos",
          duplicates: duplicatesInDB,
          message:
            "Por favor, elimine estos clientes del archivo Excel o actualice los existentes manualmente",
        },
        { status: 409 }
      );
    }

    // Insertar en batch
    const result = await prisma.customer.createMany({
      data: validation.validCustomers,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: result.count,
      summary: validation.summary,
      errors: validation.errors,
      message: `Se importaron ${result.count} clientes exitosamente`,
    });
  } catch (error) {
    console.error("Error importing customers:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
