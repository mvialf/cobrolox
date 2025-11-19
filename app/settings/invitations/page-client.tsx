"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InvitationsTable } from "@/components/tables/invitations-table";
import { NewInvitationDialog } from "@/components/dialogs/admin/new-invitation-dialog";
import type { InvitationTableData } from "@/components/tables/invitations-table";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface InvitationsPageClientProps {
  invitations: InvitationTableData[];
}

export function InvitationsPageClient({
  invitations: initialInvitations,
}: InvitationsPageClientProps) {
  const [invitations, setInvitations] =
    useState<InvitationTableData[]>(initialInvitations);
  const [isLoading, setIsLoading] = useState(false);

  // Recargar invitaciones cuando se crea una nueva
  useEffect(() => {
    const handleInvitationCreated = () => {
      refreshInvitations();
    };

    window.addEventListener("invitation-created", handleInvitationCreated);

    return () => {
      window.removeEventListener("invitation-created", handleInvitationCreated);
    };
  }, []);

  const refreshInvitations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/invitations");
      const data = await response.json();
      setInvitations(data.invitations);
    } catch (error) {
      toast.error("Error al recargar invitaciones");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${id}/resend`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al reenviar invitación");
      }

      toast.success("Invitación reenviada exitosamente");
      refreshInvitations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al reenviar invitación"
      );
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/invitations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cancelar invitación");
      }

      toast.success("Invitación cancelada");
      refreshInvitations();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al cancelar invitación"
      );
    }
  };

  const handleNewInvitation = () => {
    window.dispatchEvent(new CustomEvent("new-invitation"));
  };

  return (
    <div className="space-y-4">
      {/* Botón para crear nueva invitación */}
      <div className="flex justify-end">
        <Button onClick={handleNewInvitation}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nueva Invitación
        </Button>
      </div>

      {/* Tabla de invitaciones */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando...
        </div>
      ) : (
        <InvitationsTable
          invitations={invitations}
          onResend={handleResend}
          onCancel={handleCancel}
        />
      )}

      {/* Dialog para nueva invitación */}
      <NewInvitationDialog onSuccess={refreshInvitations} />
    </div>
  );
}
