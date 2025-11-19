import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

/**
 * API Route: Generar Invitación
 *
 * POST /api/invitations/generate
 *
 * Permite a usuarios admin generar links de invitación para nuevos usuarios.
 * Solo usuarios con role="admin" pueden usar este endpoint.
 *
 * Body:
 * - email: Email del usuario a invitar
 *
 * Response:
 * - invitation: Objeto con token, email, expiresAt, y URL completa
 */

const generateInvitationSchema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación usando Better Auth
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
          error:
            "No autorizado. Solo administradores pueden generar invitaciones.",
        },
        { status: 403 }
      );
    }

    // Validar el body
    const body = await request.json();
    const validation = generateInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Verificar que el email no esté ya registrado
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya tiene una cuenta en el sistema." },
        { status: 400 }
      );
    }

    // Verificar si ya existe una invitación válida (no usada y no expirada)
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      // Retornar la invitación existente
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?token=${existingInvitation.token}&email=${encodeURIComponent(email)}`;

      return NextResponse.json(
        {
          invitation: {
            id: existingInvitation.id,
            email: existingInvitation.email,
            token: existingInvitation.token,
            expiresAt: existingInvitation.expiresAt,
            url: invitationUrl,
            isExisting: true,
          },
          message:
            "Ya existe una invitación válida para este email. Se retornó la invitación existente.",
        },
        { status: 200 }
      );
    }

    // Generar token único
    const token = crypto.randomUUID();

    // Calcular fecha de expiración (7 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Crear la invitación
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        expiresAt,
        invitedBy: session.user.id,
      },
    });

    // Generar URL completa de invitación
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?token=${token}&email=${encodeURIComponent(email)}`;

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          url: invitationUrl,
          isExisting: false,
        },
        message: "Invitación generada exitosamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating invitation:", error);
    return NextResponse.json(
      { error: "Error al generar la invitación. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
