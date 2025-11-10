"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Página de Recuperación de Contraseña
 *
 * Permite a los usuarios solicitar un enlace de reset de contraseña.
 * El enlace se envía al email registrado (por ahora se muestra en console).
 *
 * TODO: Implementar servicio de email real (Resend, SendGrid, etc.)
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { data, error } = await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        setError(
          error.message ||
            "Error al solicitar el restablecimiento de contraseña",
        );
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        setEmail("");
      }
    } catch (_err) {
      setError("Error inesperado al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Recuperar Contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu
            contraseña
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>
                  <strong>¡Solicitud enviada!</strong>
                  <br />
                  Si el email existe en nuestro sistema, recibirás un enlace
                  para restablecer tu contraseña.
                  <br />
                  <span className="text-xs text-muted-foreground">
                    (Por ahora el enlace se muestra en la consola del servidor)
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="[email protected]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading || success}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || success}
            >
              {loading
                ? "Enviando..."
                : success
                  ? "Solicitud Enviada"
                  : "Enviar Enlace de Recuperación"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-primary">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
