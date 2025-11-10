"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
};

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{row.original.email}</span>
          {!row.original.emailVerified && (
            <Badge variant="outline" className="w-fit text-xs">
              Sin verificar
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      return <span>{row.original.name}</span>;
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.original.role;
      const isAdmin = role === "admin";

      return (
        <Badge variant={isAdmin ? "default" : "secondary"}>
          {isAdmin ? (
            <>
              <ShieldCheck className="mr-1 h-3 w-3" />
              Administrador
            </>
          ) : (
            <>
              <User className="mr-1 h-3 w-3" />
              Usuario
            </>
          )}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de creación",
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd MMM yyyy", {
            locale: es,
          })}
        </span>
      );
    },
  },
];
