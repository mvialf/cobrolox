"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createInvitationSchema,
  type CreateInvitationFormData,
} from "@/lib/validations/invitation-validations";

interface NewInvitationDialogProps {
  onSuccess?: () => void;
}

/**
 * Dialog para crear una nueva invitación de usuario (solo admin)
 *
 * Se abre mediante eventos custom:
 * ```ts
 * window.dispatchEvent(new CustomEvent("new-invitation"));
 * ```
 */
export function NewInvitationDialog({ onSuccess }: NewInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateInvitationFormData>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      email: "",
      role: "user",
    },
  });

  // Escuchar evento custom para abrir el dialog
  useEffect(() => {
    const handleOpenDialog = () => {
      setOpen(true);
      setInvitationToken(null);
      setCopied(false);
      form.reset();
    };

    window.addEventListener("new-invitation", handleOpenDialog);

    return () => {
      window.removeEventListener("new-invitation", handleOpenDialog);
    };
  }, [form]);

  // Copiar link al portapapeles
  const copyInvitationLink = async () => {
    if (!invitationToken) return;

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";
    const invitationUrl = `${baseUrl}/auth/accept-invitation?token=${invitationToken}`;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      toast.success("Link copiado al portapapeles");

      // Resetear icono después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error("Error al copiar link");
    }
  };

  // Cerrar dialog y resetear
  const handleClose = () => {
    setOpen(false);
    setInvitationToken(null);
    setCopied(false);
    form.reset();
  };

  const onSubmit = async (data: CreateInvitationFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear invitación");
      }

      // Guardar el token para mostrar el link
      setInvitationToken(result.token);

      toast.success(`Invitación creada para ${data.email}`, {
        description: "Copia el link para compartirlo",
      });

      // Disparar evento para recargar tabla
      window.dispatchEvent(new CustomEvent("invitation-created"));

      // Callback de éxito
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear invitación"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";
  const invitationUrl = invitationToken
    ? `${baseUrl}/auth/accept-invitation?token=${invitationToken}`
    : "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {invitationToken ? "Invitación Creada" : "Nueva Invitación"}
          </DialogTitle>
          <DialogDescription>
            {invitationToken
              ? "Copia y comparte el siguiente link con el usuario"
              : "Invita a un nuevo usuario a la plataforma"}
          </DialogDescription>
        </DialogHeader>

        {invitationToken ? (
          /* Vista de link creado */
          <div className="space-y-4">
            {/* Link de invitación */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Link de Invitación</label>
              <div className="flex gap-2">
                <Input
                  value={invitationUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyInvitationLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Advertencia */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Importante
              </p>
              <ul className="mt-2 space-y-1 text-yellow-800 dark:text-yellow-200 text-xs">
                <li>• Comparte este link de forma segura con el usuario</li>
                <li>• El link expira en 7 días</li>
                <li>• Solo puede ser usado una vez</li>
              </ul>
            </div>

            {/* Botón cerrar */}
            <Button type="button" className="w-full" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          /* Formulario de creación */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo de email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de rol */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol del Usuario</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Los administradores tienen acceso completo al sistema
                    </p>
                  </FormItem>
                )}
              />

              {/* Información */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  ℹ️ Información
                </p>
                <ul className="mt-2 space-y-1 text-blue-800 dark:text-blue-200 text-xs">
                  <li>• La invitación expira en 7 días</li>
                  <li>
                    • Deberás compartir el link de invitación manualmente con el
                    usuario
                  </li>
                  <li>• El usuario deberá crear su contraseña al aceptar</li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear Invitación"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
