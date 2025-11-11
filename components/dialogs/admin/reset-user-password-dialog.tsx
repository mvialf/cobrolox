"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Copy, Check } from "lucide-react";
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

/**
 * Schema de validación para el formulario
 */
const resetPasswordFormSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Máximo 128 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

interface ResetUserPasswordDialogProps {
  userId: string;
  userName: string;
}

/**
 * Dialog para resetear la contraseña de un usuario (solo admin)
 *
 * Se abre mediante eventos custom desde la tabla de usuarios:
 * ```ts
 * window.dispatchEvent(new CustomEvent("reset-user-password", {
 *   detail: { userId: "...", userName: "..." }
 * }));
 * ```
 */
export function ResetUserPasswordDialog() {
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState<ResetUserPasswordDialogProps | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  // Escuchar evento custom para abrir el dialog
  useEffect(() => {
    const handleOpenDialog = (event: Event) => {
      const customEvent = event as CustomEvent<ResetUserPasswordDialogProps>;
      setUserData(customEvent.detail);
      setOpen(true);
      setGeneratedPassword("");
      setCopied(false);
      form.reset();
    };

    window.addEventListener("reset-user-password", handleOpenDialog);

    return () => {
      window.removeEventListener("reset-user-password", handleOpenDialog);
    };
  }, [form]);

  // Generar contraseña aleatoria segura
  const generatePassword = () => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Sin I, O
    const lowercase = "abcdefghjkmnpqrstuvwxyz"; // Sin l, i, o
    const numbers = "23456789"; // Sin 0, 1
    const chars = uppercase + lowercase + numbers;

    let password = "";
    // Garantizar al menos 1 de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Completar hasta 12 caracteres
    for (let i = 0; i < 9; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Mezclar caracteres
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setGeneratedPassword(password);
    form.setValue("newPassword", password);
    setCopied(false);
  };

  // Copiar contraseña al portapapeles
  const copyPassword = async () => {
    if (!generatedPassword) return;

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success("Contraseña copiada al portapapeles");

      // Resetear icono después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      toast.error("Error al copiar contraseña");
    }
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!userData) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.userId,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al resetear contraseña");
      }

      toast.success(
        `Contraseña reseteada exitosamente para ${userData.userName}`,
      );
      toast.info("Usuario deberá hacer login nuevamente", {
        description: "Todas sus sesiones han sido cerradas",
      });

      setOpen(false);
      form.reset();
      setGeneratedPassword("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al resetear contraseña",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Resetear Contraseña
          </DialogTitle>
          <DialogDescription>
            Usuario: <span className="font-medium">{userData?.userName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Botón para generar contraseña */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                Genera una contraseña segura automáticamente:
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={generatePassword}
                >
                  Generar Contraseña
                </Button>
                {generatedPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Campo de contraseña */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Debe contener: 1 mayúscula, 1 minúscula, 1 número
                  </p>
                </FormItem>
              )}
            />

            {/* Advertencia */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-950">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Importante
              </p>
              <ul className="mt-2 space-y-1 text-yellow-800 dark:text-yellow-200 text-xs">
                <li>• El usuario será desconectado de todas sus sesiones</li>
                <li>• Deberás comunicarle la nueva contraseña manualmente</li>
                <li>• Se recomienda que cambie la contraseña después</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Reseteando..." : "Resetear Contraseña"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
