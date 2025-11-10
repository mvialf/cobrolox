import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/customers/[id]
 *
 * Obtiene un cliente por su ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/customers/[id]
 *
 * Actualiza un cliente existente
 *
 * Body: CustomerFormData parcial (ver customer-validations.ts)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Verificar que el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    // Si se está actualizando el RUT, verificar que no exista en otro cliente
    if (rut && rut !== existingCustomer.rut) {
      const duplicateRut = await prisma.customer.findFirst({
        where: {
          rut,
          NOT: { id },
        },
      });
      if (duplicateRut) {
        return NextResponse.json(
          { error: "Ya existe otro cliente con ese RUT" },
          { status: 409 },
        );
      }
    }

    // Actualizar cliente con todos los campos proporcionados
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(rut && { rut: rut.trim() }),
        ...(razonSocial && { razonSocial: razonSocial.trim() }),
        ...(tradeName !== undefined && {
          tradeName: tradeName?.trim() || null,
        }),
        ...(businessActivity !== undefined && {
          businessActivity: businessActivity?.trim() || null,
        }),
        ...(contact && { contact: contact.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(street && { street: street.trim() }),
        ...(apartment !== undefined && {
          apartment: apartment?.trim() || null,
        }),
        ...(region && { region: region.trim() }),
        ...(comuna && { comuna: comuna.trim() }),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/customers/[id]
 *
 * Elimina un cliente
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verificar que el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    // Eliminar cliente
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Cliente eliminado" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 },
    );
  }
}
