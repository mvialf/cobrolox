"use client";

import { useState, Suspense } from "react";
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
function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Leer token y email de la URL
  const invitationToken = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailFromUrl || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validar que existe el token de invitación
    if (!invitationToken) {
      setError("Se requiere un link de invitación para registrarse");
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
      // Enviar el invitationToken en el body (Better Auth lo validará en el hook)
      // TypeScript no reconoce campos personalizados, pero Better Auth los aceptará
      const { data, error } = await authClient.signUp.email({
        name,
        email,
        password,
        invitationToken, // Token de invitación (campo personalizado)
      } as any);

      if (error) {
        setError(error.message || "Error al crear la cuenta");
        setLoading(false);
        return;
      }

      if (data) {
        // Auto-login habilitado en config, redirect a la página principal
        router.push("/");
        router.refresh();
      }
    } catch (_err) {
      setError("Error inesperado al crear la cuenta");
      setLoading(false);
    }
  };

  // Solo deshabilitar durante loading (validación de token se hace en submit)
  const isFormDisabled = loading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>
            {invitationToken
              ? "Has sido invitado a unirte a Cobrolox. Completa el formulario para crear tu cuenta."
              : "Cobrolox es solo por invitación. Contacta al administrador para obtener acceso."}
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
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={isFormDisabled}
              />
            </div>

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
                disabled={isFormDisabled}
                readOnly={!!emailFromUrl}
              />
              {emailFromUrl && (
                <p className="text-xs text-muted-foreground">
                  Email de la invitación
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isFormDisabled}
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
                disabled={isFormDisabled}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isFormDisabled}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

/**
 * Página de Registro con Sistema de Invitaciones
 *
 * Solo usuarios con link de invitación válido pueden registrarse.
 * Requiere parámetros en la URL:
 * - ?token=xxx (obligatorio) - Token de invitación
 * - ?email=xxx (opcional) - Email pre-llenado
 *
 * Auto-login después de registro exitoso.
 */
export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cargando...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
