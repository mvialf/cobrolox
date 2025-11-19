import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * DELETE /api/admin/invitations/[id]
 *
 * Cancela una invitación (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      logger.warn("Intento de cancelar invitación sin autenticación");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    });

    if (currentUser?.role !== "admin") {
      logger.warn(
        `Usuario ${currentUser?.email} intentó cancelar invitación sin ser admin`
      );
      return NextResponse.json(
        { error: "Solo administradores pueden cancelar invitaciones" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 3. Verificar que la invitación existe
    const invitation = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      logger.warn(`Invitación no encontrada: ${id}`);
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 }
      );
    }

    // 4. Verificar que la invitación no esté ya usada o cancelada
    if (invitation.usedAt) {
      logger.warn(`Intento de cancelar invitación ya aceptada: ${id}`);
      return NextResponse.json(
        { error: "No se puede cancelar una invitación ya aceptada" },
        { status: 400 }
      );
    }

    if (invitation.cancelledAt) {
      logger.warn(`Intento de cancelar invitación ya cancelada: ${id}`);
      return NextResponse.json(
        { error: "La invitación ya fue cancelada" },
        { status: 400 }
      );
    }

    // 5. Cancelar la invitación
    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info(
      `Admin ${currentUser.email} canceló invitación para ${invitation.email}`
    );

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    logger.error({ err: error }, "Error al cancelar invitación");
    return NextResponse.json(
      { error: "Error al cancelar invitación" },
      { status: 500 }
    );
  }
}
