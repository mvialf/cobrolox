"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  getInvitationStatus,
  type InvitationStatus,
} from "@/lib/validations/invitation-validations";
import { Mail, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Tipo para la invitación en la tabla
export interface InvitationTableData {
  id: string;
  email: string;
  role: string;
  usedAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  inviter: {
    name: string;
    email: string;
  };
}

interface InvitationsTableProps {
  invitations: InvitationTableData[];
  onResend?: (id: string) => void;
  onCancel?: (id: string) => void;
}

// Colores para cada estado
const STATUS_CONFIG: Record<
  InvitationStatus,
  { bgClass: string; textClass: string; label: string }
> = {
  PENDING: {
    bgClass: "bg-yellow-500",
    textClass: "text-white",
    label: "Pendiente",
  },
  ACCEPTED: {
    bgClass: "bg-green-500",
    textClass: "text-white",
    label: "Aceptada",
  },
  EXPIRED: {
    bgClass: "bg-red-500",
    textClass: "text-white",
    label: "Expirada",
  },
  CANCELLED: {
    bgClass: "bg-gray-500",
    textClass: "text-white",
    label: "Cancelada",
  },
};

export function InvitationsTable({
  invitations,
  onResend,
  onCancel,
}: InvitationsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full border border-capture-border shadow-capture-shadow rounded-xl">
        <thead className="bg-capture-border rounded-t-xl">
          <tr>
            <th className="py-2 px-3 text-capture-foreground bg-transparent text-start text-md">
              Email
            </th>
            <th className="py-2 px-3 text-capture-foreground bg-transparent text-center text-md">
              Rol
            </th>
            <th className="py-2 px-3 text-capture-foreground bg-transparent text-center text-md">
              Estado
            </th>
            <th className="py-2 px-3 text-capture-foreground bg-transparent text-start text-md">
              Invitó
            </th>
            <th className="py-2 px-3 text-capture-foreground bg-transparent text-start text-md">
              Expira
            </th>
            <th className="py-2 px-3 text-capture-foreground bg-transparent text-center text-md">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {invitations.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                No hay invitaciones para mostrar
              </td>
            </tr>
          ) : (
            invitations.map((invitation) => {
              const status = getInvitationStatus(invitation);
              const statusConfig = STATUS_CONFIG[status];
              const canResend = status === "PENDING" || status === "EXPIRED";
              const canCancel = status === "PENDING";

              // Calcular tiempo relativo para expiración
              const expiresText =
                status === "EXPIRED"
                  ? "Expirada"
                  : status === "ACCEPTED"
                    ? "-"
                    : status === "CANCELLED"
                      ? "-"
                      : formatDistanceToNow(new Date(invitation.expiresAt), {
                          addSuffix: true,
                          locale: es,
                        });

              return (
                <tr key={invitation.id} className="bg-capture-card">
                  {/* Email */}
                  <td className="py-3 px-3 text-start text-md text-capture-foreground">
                    {invitation.email}
                  </td>

                  {/* Rol */}
                  <td className="py-3 px-3 text-center text-md text-capture-foreground">
                    {invitation.role === "admin" ? "Admin" : "Usuario"}
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex justify-center">
                      <StatusBadge
                        bgClass={statusConfig.bgClass}
                        label={statusConfig.label}
                      />
                    </div>
                  </td>

                  {/* Invitó */}
                  <td className="py-3 px-3 text-start text-md text-capture-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {invitation.inviter.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {invitation.inviter.email}
                      </span>
                    </div>
                  </td>

                  {/* Expira */}
                  <td className="py-3 px-3 text-start text-md text-capture-foreground">
                    {expiresText}
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-3">
                    <div className="flex gap-2 justify-center">
                      {canResend && onResend && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResend(invitation.id)}
                          title="Reenviar invitación"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {canCancel && onCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancel(invitation.id)}
                          title="Cancelar invitación"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {!canResend && !canCancel && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
