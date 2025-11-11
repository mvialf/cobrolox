import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppLayout } from "@/components/layout/app-layout";
import { InvitationsPageClient } from "./page-client";

/**
 * Página de gestión de invitaciones (solo admin)
 * Permite crear, listar, reenviar y cancelar invitaciones
 */
export default async function InvitationsPage() {
  // Verificar autenticación
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Verificar que sea admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "admin") {
    redirect("/");
  }

  // Obtener todas las invitaciones
  const invitations = await prisma.invitation.findMany({
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AppLayout
      pageTitle="Invitaciones de Usuario"
      pageDescription="Administra invitaciones para nuevos usuarios"
    >
      <InvitationsPageClient invitations={invitations} />
    </AppLayout>
  );
}
