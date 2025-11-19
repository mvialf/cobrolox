"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
 * Componente interno que usa useSearchParams
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Token de restablecimiento no válido o expirado");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de restablecimiento no válido");
      return;
    }

    // Validaciones
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setError(
          error.message ||
            "Error al restablecer la contraseña. El token puede haber expirado."
        );
        setLoading(false);
        return;
      }

      if (data) {
        setSuccess(true);
        // Redirect al login después de 2 segundos
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (_err) {
      setError("Error inesperado al restablecer la contraseña");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                El enlace de restablecimiento no es válido o ha expirado.
                <br />
                Por favor, solicita un nuevo enlace.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">Solicitar Nuevo Enlace</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">¡Éxito!</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Tu contraseña ha sido restablecida correctamente.
                <br />
                Serás redirigido al inicio de sesión en unos segundos...
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">Ir al Inicio de Sesión</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Restableciendo..." : "Restablecer Contraseña"}
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

/**
 * Página de Restablecimiento de Contraseña
 *
 * Recibe un token de reset via URL query params y permite
 * al usuario establecer una nueva contraseña.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Verificando token de restablecimiento...
              </p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
