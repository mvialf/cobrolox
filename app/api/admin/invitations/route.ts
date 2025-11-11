import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInvitationSchema } from "@/lib/validations/invitation-validations";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

/**
 * GET /api/admin/invitations
 *
 * Obtiene lista de invitaciones (admin only)
 *
 * Query params:
 *   - status: filtrar por estado (PENDING, ACCEPTED, EXPIRED, CANCELLED)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      logger.warn("Intento de acceso a invitaciones sin autenticación");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== "admin") {
      logger.warn(
        `Usuario ${session.user.id} intentó acceder a invitaciones sin ser admin`,
      );
      return NextResponse.json(
        { error: "Solo administradores pueden ver invitaciones" },
        { status: 403 },
      );
    }

    // 3. Obtener invitaciones con información del invitador
    const invitations = await prisma.invitation.findMany({
      include: {
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info(`Admin listó ${invitations.length} invitaciones`);

    return NextResponse.json({ invitations });
  } catch (error) {
    logger.error({ err: error }, "Error al obtener invitaciones");
    return NextResponse.json(
      { error: "Error al obtener invitaciones" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/invitations
 *
 * Crea una nueva invitación (admin only)
 *
 * Body:
 * - email: Email del usuario a invitar
 * - role: Rol del usuario ("user" | "admin")
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      logger.warn("Intento de crear invitación sin autenticación");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    });

    if (currentUser?.role !== "admin") {
      logger.warn(
        `Usuario ${currentUser?.email} intentó crear invitación sin ser admin`,
      );
      return NextResponse.json(
        { error: "Solo administradores pueden crear invitaciones" },
        { status: 403 },
      );
    }

    // 3. Validar request body
    const body = await req.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { email, role } = validation.data;

    // 4. Verificar que el email no tenga ya un usuario
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.warn(`Intento de invitar usuario existente: ${email}`);
      return NextResponse.json(
        { error: "Ya existe un usuario con ese correo electrónico" },
        { status: 409 },
      );
    }

    // 5. Verificar que no haya invitación pendiente para este email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        usedAt: null,
        cancelledAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      logger.warn(`Invitación pendiente ya existe para: ${email}`);
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este correo" },
        { status: 409 },
      );
    }

    // 6. Crear la invitación
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        role,
        expiresAt,
        invitedBy: session.user.id,
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
      `Admin ${currentUser.email} creó invitación para ${email} con rol ${role}`,
    );

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error al crear invitación");
    return NextResponse.json(
      { error: "Error al crear invitación" },
      { status: 500 },
    );
  }
}
