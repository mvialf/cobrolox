import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { DataTable } from "@/components/data-table/data-table";
import { columns, UserRow } from "./columns";

/**
 * Página de gestión de usuarios (solo admin)
 * Permite ver todos los usuarios del sistema
 */
export default async function UsersPage() {
  // Verificar autenticación
  const session = await auth.api.getSession({
    headers: await Promise.resolve(new Headers()),
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

  // Obtener todos los usuarios
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transformar a UserRow
  const userRows: UserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  }));

  return (
    <AppLayout
      pageTitle="Gestión de Usuarios"
      pageDescription="Administra usuarios y sus permisos"
    >
      <div className="space-y-4">
        <DataTable columns={columns} data={userRows} />
      </div>
    </AppLayout>
  );
}
