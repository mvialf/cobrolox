import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { renderAdminForceResetEmail } from "@/components/emails/admin-force-reset-email";

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/admin/force-reset-password
 *
 * Fuerza el reset de contraseña de un usuario específico (solo admin)
 * Genera un token y envía email al usuario
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Verificar que el usuario sea admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    if (admin?.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 },
      );
    }

    // 3. Obtener userId del body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 },
      );
    }

    // 4. Buscar al usuario target
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // 5. Generar token de reset (compatible con Better Auth)
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hora

    // 6. Guardar token en la tabla verification
    await prisma.verification.create({
      data: {
        identifier: targetUser.email,
        value: token,
        expiresAt,
      },
    });

    // 7. Construir URL de reset
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&callbackURL=%2F`;

    // 8. Generar HTML del email
    const emailHtml = renderAdminForceResetEmail({
      resetUrl,
      userName: targetUser.name,
      adminName: admin.name,
    });

    // 9. Enviar email
    const { data, error } = await resend.emails.send({
      from: "Cobrolox <mvial@cristaluxspa.cl>",
      to: targetUser.email,
      subject: "Cambio de contraseña requerido - Cobrolox",
      html: emailHtml,
    });

    if (error) {
      console.error("Error al enviar email de reset forzado:", error);
      return NextResponse.json(
        { error: "Error al enviar email" },
        { status: 500 },
      );
    }

    console.log(
      `Admin ${admin.name} (${session.user.id}) forzó reset de contraseña para ${targetUser.email}. Email ID: ${data?.id}`,
    );

    // 10. Retornar éxito
    return NextResponse.json({
      success: true,
      message: "Email de reset enviado exitosamente",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Error en force-reset-password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
