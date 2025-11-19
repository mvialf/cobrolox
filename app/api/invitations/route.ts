import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * API Route: Listar Invitaciones
 *
 * GET /api/invitations
 *
 * Retorna todas las invitaciones creadas por el usuario admin actual.
 * Incluye información sobre si están usadas, expiradas, etc.
 *
 * Response:
 * - invitations: Array de invitaciones con metadata
 */

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autenticado. Inicia sesión primero." },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        {
          error: "No autorizado. Solo administradores pueden ver invitaciones.",
        },
        { status: 403 }
      );
    }

    // Obtener todas las invitaciones (ordenadas por más recientes)
    const invitations = await prisma.invitation.findMany({
      orderBy: {
        createdAt: "desc",
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

    // Calcular metadata para cada invitación
    const now = new Date();
    const invitationsWithMetadata = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      token: inv.token,
      usedAt: inv.usedAt,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      invitedBy: {
        name: inv.inviter.name,
        email: inv.inviter.email,
      },
      status: inv.usedAt ? "used" : inv.expiresAt < now ? "expired" : "active",
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?token=${inv.token}&email=${encodeURIComponent(inv.email)}`,
    }));

    return NextResponse.json(
      {
        invitations: invitationsWithMetadata,
        total: invitations.length,
        active: invitationsWithMetadata.filter((i) => i.status === "active")
          .length,
        used: invitationsWithMetadata.filter((i) => i.status === "used").length,
        expired: invitationsWithMetadata.filter((i) => i.status === "expired")
          .length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Error al obtener las invitaciones. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
