"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Dialog para confirmar y ejecutar el force reset de contraseña
 * Se abre mediante un evento custom disparado desde las acciones de la tabla
 */
export function ForceResetPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Escuchar evento custom
  useEffect(() => {
    const handleForceReset = (event: Event) => {
      const customEvent = event as CustomEvent<{
        userId: string;
        userName: string;
      }>;
      setUserId(customEvent.detail.userId);
      setUserName(customEvent.detail.userName);
      setOpen(true);
    };

    window.addEventListener("force-reset-password", handleForceReset);

    return () => {
      window.removeEventListener("force-reset-password", handleForceReset);
    };
  }, []);

  const handleConfirm = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/force-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al forzar reset de contraseña");
      }

      toast.success("Email de reset enviado", {
        description: `Se ha enviado un email a ${userName || "el usuario"} para restablecer su contraseña.`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error al forzar reset:", error);
      toast.error("Error al enviar email", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el email de reset. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Forzar reset de contraseña
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              Estás a punto de forzar el restablecimiento de contraseña para:
            </p>
            <p className="font-semibold text-foreground">
              {userName || "Usuario"}
            </p>
            <p className="text-sm">
              El usuario recibirá un email con instrucciones para crear una
              nueva contraseña. El enlace expirará en 1 hora.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar email de reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
