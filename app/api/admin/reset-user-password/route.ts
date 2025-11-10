import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";
import { adminResetPasswordSchema } from "@/lib/validations/user-validations";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/reset-user-password
 *
 * Permite a un admin resetear la contraseña de cualquier usuario
 *
 * Body:
 * - userId: ID del usuario a resetear
 * - newPassword: Nueva contraseña (min 8 chars, 1 mayúscula, 1 minúscula, 1 número)
 *
 * Returns:
 * - 200: { success: true }
 * - 400: Error de validación
 * - 403: Usuario no es admin
 * - 404: Usuario no encontrado
 * - 500: Error del servidor
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      logger.warn("Intento de reset password sin autenticación");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar que sea admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true },
    });

    if (currentUser?.role !== "admin") {
      logger.warn(
        `Usuario ${currentUser?.email} intentó resetear contraseña sin ser admin`,
      );
      return NextResponse.json(
        { error: "Solo administradores pueden resetear contraseñas" },
        { status: 403 },
      );
    }

    // 3. Validar request body
    const body = await req.json();
    const validation = adminResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { userId, newPassword } = validation.data;

    // 4. Verificar que el usuario existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      logger.warn(`Admin intentó resetear usuario inexistente: ${userId}`);
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // 5. Hashear nueva contraseña usando Better Auth
    const hashedPassword = await hashPassword(newPassword);

    // 6. Buscar la cuenta credential del usuario
    const account = await prisma.account.findFirst({
      where: {
        userId: targetUser.id,
        providerId: "credential",
      },
    });

    if (!account) {
      logger.warn(
        `Usuario ${targetUser.email} no tiene cuenta de tipo credential`,
      );
      return NextResponse.json(
        { error: "Usuario no tiene cuenta con contraseña" },
        { status: 400 },
      );
    }

    // 7. Actualizar la contraseña
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    // 8. Invalidar todas las sesiones activas del usuario
    await prisma.session.deleteMany({
      where: { userId: targetUser.id },
    });

    logger.info(
      `Admin ${currentUser.email} reseteó contraseña del usuario ${targetUser.email}`,
    );

    return NextResponse.json({
      success: true,
      message: `Contraseña reseteada para ${targetUser.email}`,
    });
  } catch (error) {
    logger.error({ err: error }, "Error al resetear contraseña");
    return NextResponse.json(
      { error: "Error al resetear contraseña" },
      { status: 500 },
    );
  }
}
