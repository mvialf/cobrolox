import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * IMPORTANTE: Forzar Node.js runtime para usar Prisma
 * Next.js usa Edge Runtime por defecto, pero Prisma requiere Node.js
 */
export const runtime = "nodejs";

/**
 * Middleware de Autenticación
 *
 * Protege las rutas de la aplicación, redirigiendo a /login
 * si el usuario no tiene una sesión activa.
 *
 * Rutas públicas (no requieren auth):
 * - /login
 * - /signup
 * - /forgot-password
 * - /reset-password
 * - /api/auth/* (endpoints de autenticación)
 * - /api/cron/* (cron jobs protegidos por CRON_SECRET)
 * - /_next/* (archivos estáticos de Next.js)
 * - /favicon.ico
 *
 * Todas las demás rutas requieren autenticación.
 *
 * @see https://www.better-auth.com/docs/integrations/next
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que NO requieren autenticación
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  // Permitir acceso a rutas de auth API, cron API, archivos estáticos y públicas
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    publicRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Verificar sesión del usuario
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Si no hay sesión, redirigir a login
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      // Guardar la URL original para redirigir después del login
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Usuario autenticado, permitir acceso
    return NextResponse.next();
  } catch (error) {
    // Error al verificar sesión, redirigir a login
    console.error("Error en middleware de auth:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

/**
 * Configuración del Matcher
 *
 * Define qué rutas pasan por el middleware.
 * Excluimos archivos estáticos y API routes de Next.js.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
