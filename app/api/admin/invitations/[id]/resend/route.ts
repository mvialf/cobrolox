import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

/**
 * POST /api/admin/invitations/[id]/resend
 *
 * Reenvía una invitación generando un nuevo token (admin only)
 * Solo funciona para invitaciones PENDING o EXPIRED
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      logger.warn("Intento de reenviar invitación sin autenticación");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    });

    if (currentUser?.role !== "admin") {
      logger.warn(
        `Usuario ${currentUser?.email} intentó reenviar invitación sin ser admin`
      );
      return NextResponse.json(
        { error: "Solo administradores pueden reenviar invitaciones" },
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
      logger.warn(`Intento de reenviar invitación ya aceptada: ${id}`);
      return NextResponse.json(
        { error: "No se puede reenviar una invitación ya aceptada" },
        { status: 400 }
      );
    }

    if (invitation.cancelledAt) {
      logger.warn(`Intento de reenviar invitación cancelada: ${id}`);
      return NextResponse.json(
        { error: "No se puede reenviar una invitación cancelada" },
        { status: 400 }
      );
    }

    // 5. Generar nuevo token y extender expiración
    const newToken = randomUUID();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 días desde ahora

    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
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
      `Admin ${currentUser.email} reenvió invitación para ${invitation.email}`
    );

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    logger.error({ err: error }, "Error al reenviar invitación");
    return NextResponse.json(
      { error: "Error al reenviar invitación" },
      { status: 500 }
    );
  }
}
