import { createAuthClient } from "better-auth/react";

/**
 * Better Auth Client
 *
 * Cliente de autenticación para usar en componentes de React.
 * Proporciona hooks y funciones para:
 * - Login/Logout
 * - Signup
 * - Password reset
 * - Session management
 *
 * @example
 * // En un Client Component:
 * import { authClient } from "@/lib/auth-client";
 *
 * function LoginForm() {
 *   const { data, error } = await authClient.signIn.email({
 *     email: "[email protected]",
 *     password: "password123"
 *   });
 * }
 *
 * @see https://www.better-auth.com/docs/basic-usage
 */
export const authClient = createAuthClient({
  // Base URL se infiere automáticamente del environment
  // En desarrollo: http://localhost:3000
  // En producción: tu dominio de Vercel
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Re-export hooks útiles
export const { useSession } = authClient;
