import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getInvitationStatus } from "@/lib/validations/invitation-validations";

/**
 * GET /api/invitations/validate?token=xxx
 *
 * Valida un token de invitación (público, no requiere auth)
 *
 * Query params:
 *   - token: Token de la invitación
 *
 * Returns:
 *   - 200: { valid: true, email, role }
 *   - 400: { valid: false, error: string }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token no proporcionado" },
        { status: 400 }
      );
    }

    // Buscar invitación por token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      logger.warn(`Token de invitación inválido: ${token}`);
      return NextResponse.json(
        { valid: false, error: "Token inválido" },
        { status: 404 }
      );
    }

    // Verificar estado de la invitación
    const status = getInvitationStatus(invitation);

    if (status !== "PENDING") {
      logger.warn(`Token de invitación no válido (${status}): ${token}`);

      let errorMessage = "Invitación no válida";
      if (status === "EXPIRED") {
        errorMessage = "La invitación ha expirado";
      } else if (status === "ACCEPTED") {
        errorMessage = "La invitación ya fue aceptada";
      } else if (status === "CANCELLED") {
        errorMessage = "La invitación fue cancelada";
      }

      return NextResponse.json(
        { valid: false, error: errorMessage, status },
        { status: 400 }
      );
    }

    // Token válido
    logger.info(`Token de invitación validado para ${invitation.email}`);
    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al validar token de invitación");
    return NextResponse.json(
      { valid: false, error: "Error al validar invitación" },
      { status: 500 }
    );
  }
}
