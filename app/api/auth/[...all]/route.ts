import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 *
 * Esta ruta maneja todas las operaciones de autenticación:
 * - POST /api/auth/sign-in/email - Login con email/password
 * - POST /api/auth/sign-up/email - Registro de usuario
 * - POST /api/auth/sign-out - Logout
 * - POST /api/auth/forget-password - Solicitar reset de password
 * - POST /api/auth/reset-password - Resetear password con token
 * - GET /api/auth/get-session - Obtener sesión actual
 * - Y más endpoints automáticos...
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */
export const { POST, GET } = toNextJsHandler(auth);
