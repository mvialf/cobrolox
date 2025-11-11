import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { acceptInvitationSchema } from "@/lib/validations/invitation-validations";
import { getInvitationStatus } from "@/lib/validations/invitation-validations";
import { hashPassword } from "better-auth/crypto";

/**
 * POST /api/invitations/accept
 *
 * Acepta una invitación y crea el usuario (público, no requiere auth)
 *
 * Body:
 *   - token: Token de la invitación
 *   - name: Nombre del usuario
 *   - password: Contraseña del usuario
 *
 * Returns:
 *   - 201: { success: true, user }
 *   - 400: Error de validación
 *   - 404: Invitación no encontrada
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validar request body
    const body = await req.json();
    const validation = acceptInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { token, name, password } = validation.data;

    // 2. Buscar invitación por token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      logger.warn(`Token de invitación no encontrado: ${token}`);
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 },
      );
    }

    // 3. Verificar estado de la invitación
    const status = getInvitationStatus(invitation);

    if (status !== "PENDING") {
      logger.warn(
        `Intento de aceptar invitación no válida (${status}): ${token}`,
      );

      let errorMessage = "Invitación no válida";
      if (status === "EXPIRED") {
        errorMessage = "La invitación ha expirado";
      } else if (status === "ACCEPTED") {
        errorMessage = "La invitación ya fue aceptada";
      } else if (status === "CANCELLED") {
        errorMessage = "La invitación fue cancelada";
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // 4. Verificar que no exista ya un usuario con ese email
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      logger.warn(
        `Intento de aceptar invitación pero usuario ya existe: ${invitation.email}`,
      );
      return NextResponse.json(
        { error: "Ya existe un usuario con ese correo electrónico" },
        { status: 409 },
      );
    }

    // 5. Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // 6. Crear usuario y cuenta en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name,
          role: invitation.role,
          emailVerified: true, // Email pre-verificado por invitación
        },
      });

      // Crear cuenta credential
      await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });

      // Marcar invitación como usada
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          usedAt: new Date(),
        },
      });

      return user;
    });

    logger.info(
      `Usuario ${invitation.email} creado exitosamente desde invitación`,
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          role: result.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ err: error }, "Error al aceptar invitación");
    return NextResponse.json(
      { error: "Error al aceptar invitación" },
      { status: 500 },
    );
  }
}
