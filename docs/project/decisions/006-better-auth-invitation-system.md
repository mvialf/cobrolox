# ADR-006: Better Auth con Sistema de Invitaciones

## Estado

**Aceptado** | **Fecha:** 2025-11-10

**Supersede:** [ADR-005: No Authentication System (MVP Phase)](./005-no-authentication-mvp.md)

## Quick Start (Cómo Actuar)

> **💡 TL;DR:** Sistema de autenticación implementado con Better Auth + invitaciones por token. Solo usuarios con link de invitación válido pueden registrarse. Admins gestionan invitaciones desde `/settings/invitations`.

**Estado actual:**

- ✅ Better Auth con email/password
- ✅ Sistema de invitaciones por token (UUID)
- ✅ Solo admins pueden generar invitaciones
- ✅ Tokens expiran en 7 días, one-time use
- ✅ Middleware protege rutas
- ✅ Admin inicial: `mvial@cristaluxspa.cl`

**Cómo invitar a un nuevo usuario:**

```bash
# 1. Login como admin
https://cobrolox.com/login

# 2. Ve a Configuración → Invitaciones
/settings/invitations

# 3. Ingresa email del usuario y genera invitación
# 4. Copia el link y envíalo al usuario
# Formato: /signup?token=<uuid>&email=<email>
```

**Archivos clave:**

- `lib/auth.ts` - Configuración Better Auth + hooks de validación
- `app/api/invitations/` - API routes para gestión de invitaciones
- `app/settings/invitations/` - UI de administración
- `prisma/schema.prisma` - Modelos User (con role) e Invitation

---

## Contexto

### Por qué Cambiamos de "No Auth" a Auth con Invitaciones

En **ADR-005** decidimos lanzar el MVP sin autenticación porque:
- Era una herramienta interna con 1-2 usuarios
- Red local (no pública)
- Foco en validar business logic

**Trigger que activó el cambio:**

El usuario solicitó explícitamente **control de acceso** con el siguiente requisito:

> "Es una herramienta interna de la empresa, la idea es que no cualquiera se registre y tenga acceso a mis datos"

Este requisito cambió el contexto fundamentalmente:
- 🚨 **Datos confidenciales** de la empresa (clientes, pagos, proyectos)
- 🚨 **Control de acceso crítico** - No puede ser abierto
- 🚨 **Escalabilidad prevista** - Más usuarios en el futuro
- 🚨 **Acceso remoto potencial** - No solo red local

### Requisitos Específicos

**Funcionales:**

1. **Solo usuarios autorizados** pueden acceder al sistema
2. **Admin controla quién se registra** (no signup público)
3. **Invitaciones por email** con links únicos y temporales
4. **Roles de usuario** (admin vs user) para permisos
5. **Auditoría básica** de quién está usando el sistema

**No Funcionales:**

- ⚡ Setup rápido (<1 día) para no retrasar MVP
- 🔒 Seguro: validación backend + frontend
- 📦 Sin vendor lock-in alto
- 💰 Costo $0 (o mínimo)
- 🎨 UI moderna lista para usar

### Relación con ADR-005

ADR-005 anticipó correctamente este momento:

> "**Triggers para implementar:** >2 usuarios, acceso remoto, deploy público, 4 semanas de validación"

El trigger fue: **Necesidad de control de acceso por datos confidenciales** (incluso antes de los otros triggers).

---

## Alternativas Consideradas

### Comparativa Rápida

| Factor | Better Auth (✅) | NextAuth.js | Stack Auth | Clerk |
|--------|-----------------|-------------|------------|-------|
| **Setup time** | 4-6 hrs | 10-15 hrs | 5-10 hrs | 2-3 hrs |
| **Vendor lock-in** | Bajo | Ninguno | Medio | Alto |
| **Custom hooks** | ✅ Built-in | ⚠️ Manual | ⚠️ Limited | ❌ No |
| **UI incluida** | ✅ Components | ❌ Manual | ✅ Components | ✅ Complete |
| **Invitations** | ✅ Custom hooks | ⚠️ Manual | ⚠️ Plugin | ✅ Built-in |
| **Costo** | $0 | $0 | $0-$20/mes | $25/mes |
| **Prisma native** | ✅ Adapter | ✅ Adapter | ✅ Adapter | ⚠️ Sync |
| **Documentación** | ✅ Excelente | ✅ Excelente | ⚠️ Limitada | ✅ Excelente |

### Alternativa 1: NextAuth.js

**Pros:**
- ✅ Zero vendor lock-in (open-source completo)
- ✅ Ecosistema maduro, community enorme
- ✅ Múltiples providers (Google, GitHub, Email, etc.)
- ✅ Control total sobre flujo de auth

**Contras:**
- ❌ **10-15 horas de setup** (UI manual, no components)
- ❌ **Sistema de invitaciones completamente manual** (DB + lógica custom)
- ❌ **Hooks personalizados requieren middleware custom** (más código)
- ❌ **UI debe construirse desde cero** (login, signup, forgot password)

**Por qué NO:**
- El requisito de "sistema de invitaciones" con NextAuth requiere:
  - Modelo Invitation custom
  - Validación en signup (manual)
  - UI de admin para invitaciones (manual)
  - **Total: ~5 horas adicionales** sobre las 10-15 base
- **Costo de oportunidad:** 15-20 horas vs 4-6 con Better Auth

### Alternativa 2: Clerk

**Pros:**
- ✅ **Setup ultra-rápido** (2-3 horas)
- ✅ **UI completa** premium (login, signup, user profile)
- ✅ **Sistema de invitaciones built-in** (Clerk Invitations)
- ✅ **Admin dashboard** robusto con gestión de usuarios

**Contras:**
- ❌ **Vendor lock-in MUY alto** (API propietaria difícil de migrar)
- ❌ **$25/mes** después de 10,000 MAU → $300/año mínimo
- ❌ **Complejidad innecesaria** (SAML, MFA, org switching)
- ❌ **Data hosted** en servidores de Clerk (no control total)

**Por qué NO:**
- Para herramienta interna con <10 usuarios, $300/año es overkill
- Vendor lock-in hace difícil migrar si crece el proyecto
- Features enterprise (SAML, MFA) no necesarios para MVP

### Alternativa 3: Stack Auth

**Pros:**
- ✅ **Integración con Neon** PostgreSQL (mismo DB que usamos)
- ✅ **Setup medio** (5-10 horas)
- ✅ **UI React components** incluidos
- ✅ **Pricing friendly** para startups ($0-$20/mes)

**Contras:**
- ❌ **Vendor lock-in medio** (menos que Clerk, más que NextAuth)
- ❌ **Sistema de invitaciones limitado** (plugin, no core)
- ❌ **Documentación menos madura** que NextAuth/Clerk
- ❌ **Custom hooks difíciles** (validación en signup no trivial)

**Por qué NO:**
- El requisito de "validar token en signup" requiere custom logic compleja
- Documentación limitada para casos edge (token expirado, usado, etc.)
- **Vendor lock-in no justificado** vs open-source

### Alternativa 4: Better Auth (Decisión Tomada)

**Pros:**
- ✅ **Setup rápido** (4-6 horas con invitaciones)
- ✅ **Hooks nativos** para custom logic (`before`, `after` middleware)
- ✅ **Prisma adapter oficial** (integración perfecta)
- ✅ **UI components** modernos (React 19 compatible)
- ✅ **Zero costo** (open-source)
- ✅ **Vendor lock-in bajo** (auth logic standard, migrable)
- ✅ **Sistema de invitaciones via hooks** (clean implementation)

**Contras:**
- ⚠️ **Ecosistema más nuevo** (menos maduro que NextAuth)
- ⚠️ **Community más pequeña** (menos Stack Overflow answers)
- ⚠️ **Menos providers** que NextAuth (pero suficiente para MVP)

**Por qué SÍ:**
- **Hooks nativos** permiten validación de invitaciones clean:
  ```typescript
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Validar token de invitación
      if (!invitationToken) throw new APIError("UNAUTHORIZED")
      // Validar expiración, uso, email match
    })
  }
  ```
- **Setup 40% más rápido** que NextAuth (4-6 hrs vs 10-15 hrs)
- **UI moderna** lista para usar (no como NextAuth)
- **Vendor lock-in manejable** (auth logic standard, migrar a NextAuth es factible)

---

## Decisión

**Implementar Better Auth con sistema de invitaciones por token** para controlar acceso al sistema.

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                  SISTEMA DE INVITACIONES                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Admin genera invitación                                  │
│     ↓ POST /api/invitations/generate                        │
│     ├─ Crea registro Invitation (token UUID, email, 7d exp) │
│     └─ Retorna URL: /signup?token=xxx&email=xxx             │
│                                                              │
│  2. Usuario recibe link y accede a /signup                   │
│     ↓ GET /signup?token=xxx&email=xxx                       │
│     ├─ Frontend pre-llena email (readonly)                   │
│     └─ Muestra form: name, password, confirm password        │
│                                                              │
│  3. Usuario completa form y hace submit                      │
│     ↓ POST /api/auth/sign-up/email                          │
│     │  { name, email, password, invitationToken }           │
│     ├─ Better Auth hook `before` valida:                    │
│     │  • Token existe en DB                                  │
│     │  • Token no expirado (< 7 días)                       │
│     │  • Token no usado (usedAt === null)                   │
│     │  • Email match (invitation.email === body.email)      │
│     ├─ Si válido: Crear User + Account (password hash)      │
│     └─ Better Auth hook `after`: Marca usedAt = now()       │
│                                                              │
│  4. Auto-login y redirect a /                                │
│     ↓ Session creada, user autenticado                       │
│     └─ Middleware protege todas las rutas (/login, /signup) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Modelo de Datos

**Schema Prisma:**

```prisma
model User {
  id            String       @id @default(uuid())
  name          String
  email         String       @unique
  emailVerified Boolean      @default(false)
  image         String?
  role          String       @default("user") // "user" | "admin"
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  sessions      Session[]
  accounts      Account[]
  invitations   Invitation[] // Invitaciones enviadas

  @@index([email])
  @@index([role])
  @@map("user")
}

model Invitation {
  id         String    @id @default(uuid())
  email      String    // Email del usuario invitado
  token      String    @unique // Token único (UUID)
  usedAt     DateTime? // NULL si no usado
  expiresAt  DateTime  // Default: now() + 7 días
  invitedBy  String    // FK a User admin
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  inviter    User      @relation(fields: [invitedBy], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([email])
  @@index([invitedBy])
  @@index([expiresAt])
  @@map("invitation")
}

// Better Auth models (generados automáticamente)
model Account { ... }
model Session { ... }
model Verification { ... }
```

### Flujo de Validación (Hooks)

**Backend: `lib/auth.ts`**

```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  hooks: {
    // Validar invitación ANTES de crear usuario
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const email = ctx.body?.email as string;
      const invitationToken = ctx.body?.invitationToken as string;

      // 1. Token requerido
      if (!invitationToken) {
        throw new APIError("UNAUTHORIZED", {
          message: "Se requiere una invitación para registrarse."
        });
      }

      // 2. Token debe existir
      const invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken }
      });

      if (!invitation) {
        throw new APIError("UNAUTHORIZED", {
          message: "Invitación inválida."
        });
      }

      // 3. No debe estar usado
      if (invitation.usedAt) {
        throw new APIError("UNAUTHORIZED", {
          message: "Esta invitación ya ha sido utilizada."
        });
      }

      // 4. No debe estar expirado
      if (invitation.expiresAt < new Date()) {
        throw new APIError("UNAUTHORIZED", {
          message: "Esta invitación ha expirado."
        });
      }

      // 5. Email debe coincidir
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        throw new APIError("UNAUTHORIZED", {
          message: "El email no coincide con la invitación."
        });
      }

      return { context: ctx };
    }),

    // Marcar invitación como usada DESPUÉS de signup exitoso
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const invitationToken = ctx.body?.invitationToken as string;

      if (invitationToken) {
        await prisma.invitation.update({
          where: { token: invitationToken },
          data: { usedAt: new Date() }
        });
      }

      return { context: ctx };
    })
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Por ahora
    autoSignIn: true, // Auto-login después de signup
    minPasswordLength: 8,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
  }
});
```

### API Routes

**1. Generar Invitación (Solo Admins):**

`app/api/invitations/generate/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // 1. Verificar sesión
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // 2. Verificar que user es admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // 3. Generar token único
  const token = crypto.randomUUID();

  // 4. Calcular expiración (7 días)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // 5. Crear invitación
  const invitation = await prisma.invitation.create({
    data: {
      email: body.email,
      token,
      expiresAt,
      invitedBy: session.user.id
    }
  });

  // 6. Construir URL
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?token=${token}&email=${encodeURIComponent(email)}`;

  return NextResponse.json({ invitation, invitationUrl });
}
```

**2. Listar Invitaciones (Solo Admins):**

`app/api/invitations/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // Verificar sesión + admin role
  // ...

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      inviter: {
        select: { name: true, email: true }
      }
    }
  });

  // Agregar estado calculado
  const now = new Date();
  const invitationsWithStatus = invitations.map(inv => ({
    ...inv,
    status: inv.usedAt
      ? "used"
      : inv.expiresAt < now
        ? "expired"
        : "active"
  }));

  return NextResponse.json({ invitations: invitationsWithStatus });
}
```

### Frontend UI

**Página de Signup:**

`app/(auth)/signup/page.tsx`:

```typescript
"use client";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("token");
  const emailFromUrl = searchParams.get("email");

  const [email, setEmail] = useState(emailFromUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que existe token
    if (!invitationToken) {
      setError("Se requiere un link de invitación");
      return;
    }

    // Signup con Better Auth (enviar invitationToken custom field)
    const { data, error } = await authClient.signUp.email({
      name,
      email,
      password,
      invitationToken // ← Campo custom validado en backend
    } as any); // TypeScript bypass para campo custom

    if (error) {
      setError(error.message);
      return;
    }

    // Auto-login habilitado, redirect
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input value={email} readOnly={!!emailFromUrl} />
      {/* ... rest of form */}
    </form>
  );
}
```

**Página de Invitaciones (Admin):**

`app/settings/invitations/page.tsx`:

```typescript
"use client";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);

  const generateInvitation = async (email: string) => {
    const res = await fetch("/api/invitations/generate", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    const { invitation, invitationUrl } = await res.json();

    // Copiar link al portapapeles
    await navigator.clipboard.writeText(invitationUrl);

    toast({
      title: "Invitación generada",
      description: "Link copiado al portapapeles"
    });

    // Recargar lista
    fetchInvitations();
  };

  return (
    <div>
      {/* Form para generar invitación */}
      <form onSubmit={(e) => {
        e.preventDefault();
        generateInvitation(email);
      }}>
        <Input placeholder="[email protected]" />
        <Button>Generar Invitación</Button>
      </form>

      {/* Tabla de invitaciones */}
      <DataTable
        columns={[
          { key: "email", label: "Email" },
          { key: "status", label: "Estado" }, // active/used/expired
          { key: "createdAt", label: "Creada" },
          { key: "actions", label: "Acciones" } // Copy link button
        ]}
        data={invitations}
      />
    </div>
  );
}
```

### Middleware de Protección

`middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
                     request.nextUrl.pathname.startsWith("/signup");

  // Redirigir a login si no hay sesión y no está en página auth
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirigir a home si ya tiene sesión y está en página auth
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Consecuencias

### Positivas ✅

1. **Control de Acceso Implementado**
   - ✅ Solo usuarios autorizados acceden al sistema
   - ✅ Admin controla quién se registra (no signup público)
   - ✅ Tokens únicos, temporales, one-time use
   - **Impacto:** Datos confidenciales protegidos

2. **Setup Rápido (4-6 horas)**
   - ✅ Better Auth hooks = validación clean
   - ✅ UI components modernos listos
   - ✅ Menor costo de oportunidad vs NextAuth (10-15 hrs)
   - **Impacto:** MVP no retrasado significativamente

3. **Sistema de Invitaciones Robusto**
   - ✅ Token validation en backend (seguro)
   - ✅ Expiración automática (7 días)
   - ✅ One-time use (previene reutilización)
   - ✅ Email match validation
   - **Impacto:** Sistema confiable y seguro

4. **Vendor Lock-in Manejable**
   - ✅ Better Auth usa auth logic standard
   - ✅ Migración a NextAuth factible si necesario
   - ✅ Database schema portable (Prisma)
   - **Impacto:** Flexibilidad futura preservada

5. **UI Moderna Lista para Usar**
   - ✅ Páginas de login/signup profesionales
   - ✅ Admin dashboard para invitaciones
   - ✅ shadcn/ui components integrados
   - **Impacto:** UX premium sin esfuerzo adicional

6. **Roles de Usuario (Admin/User)**
   - ✅ Field `role` en User model
   - ✅ Solo admins generan invitaciones
   - ✅ Escalable a RBAC en futuro
   - **Impacto:** Permisos básicos funcionando

7. **Zero Costo**
   - ✅ Better Auth open-source
   - ✅ Sin subscripciones mensuales
   - ✅ Self-hosted completamente
   - **Impacto:** $0/mes vs $25/mes Clerk

### Negativas / Trade-offs ⚠️

1. **Ecosistema Más Nuevo**
   - ⚠️ Menos maduro que NextAuth (fewer Stack Overflow answers)
   - ⚠️ Community más pequeña
   - **Mitigación:** Documentación oficial excelente, team responsive en Discord
   - **Impacto:** Bajo (docs suficientes para uso básico)

2. **Overhead de Gestión de Invitaciones**
   - ⚠️ Admin debe generar invitaciones manualmente
   - ⚠️ No hay signup público (by design)
   - **Mitigación:** Herramienta interna, pocos usuarios esperados
   - **Impacto:** Aceptable (trade-off necesario para seguridad)

3. **Migración de "No Auth" Requirió Esfuerzo**
   - ⚠️ 4-6 horas de implementación inicial
   - ⚠️ Testing del flujo completo
   - **Mitigación:** ADR-005 anticipó esta migración como reversible
   - **Impacto:** Esperado, dentro del presupuesto estimado (10-15 hrs)

4. **Custom Field en TypeScript (Minor)**
   - ⚠️ `invitationToken` no reconocido por TS en signup
   - ⚠️ Requiere `as any` bypass
   - **Mitigación:** Better Auth acepta campos custom, solo TS no infiere tipos
   - **Impacto:** Mínimo (no afecta runtime)

5. **Email Verification Deshabilitada**
   - ⚠️ `requireEmailVerification: false` por simplicidad
   - ⚠️ Usuarios no verifican email tras signup
   - **Mitigación:** Invitaciones van a emails reales controlados por admin
   - **Impacto:** Bajo (contexto interno, emails confiables)
   - **Futuro:** Habilitar cuando escale o sea público

---

## Implementación

### Setup Completo (Ejecutado)

```bash
# 1. Instalar Better Auth
npm install better-auth

# 2. Agregar modelos a Prisma
# - User model con field `role`
# - Invitation model con token, email, expiresAt, usedAt

# 3. Aplicar schema a DB
npm run db:push

# 4. Crear lib/auth.ts con hooks de validación

# 5. Crear API routes
# - POST /api/invitations/generate
# - GET /api/invitations

# 6. Crear páginas de auth
# - app/(auth)/login/page.tsx
# - app/(auth)/signup/page.tsx

# 7. Crear UI de admin
# - app/settings/invitations/page.tsx

# 8. Configurar middleware
# - middleware.ts con session checks

# 9. Crear admin inicial
npx tsx scripts/update-mvial-to-admin.ts

# 10. Testing manual del flujo completo
# ✅ Admin genera invitación
# ✅ Usuario se registra con link
# ✅ Token se marca como usado
# ✅ Sesión creada, auto-login
```

### Variables de Entorno

```env
# .env.local
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Better Auth (opcional, tiene defaults)
BETTER_AUTH_SECRET="generated-secret-key" # Auto-generado
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Para invitationUrl
```

### Admin Inicial

**Credenciales:**
- Email: `mvial@cristaluxspa.cl`
- Password: `Pirula4180`
- Role: `admin`

**Creado via:** `scripts/update-mvial-to-admin.ts`

```typescript
// Script actualiza role de user a admin después de signup
const user = await prisma.user.update({
  where: { email: "mvial@cristaluxspa.cl" },
  data: { role: "admin" }
});
```

### Testing del Flujo

**Casos de prueba exitosos:**

1. ✅ **Signup sin token → Rechazado**
   - Error: "Se requiere una invitación para registrarse"

2. ✅ **Signup con token inválido → Rechazado**
   - Error: "Invitación inválida"

3. ✅ **Signup con token expirado → Rechazado**
   - Error: "Esta invitación ha expirado"

4. ✅ **Signup con token usado → Rechazado**
   - Error: "Esta invitación ya ha sido utilizada"

5. ✅ **Signup con email no matching → Rechazado**
   - Error: "El email no coincide con la invitación"

6. ✅ **Signup con token válido → Exitoso**
   - Usuario creado con role "user"
   - Token marcado como `usedAt: now()`
   - Auto-login y redirect a `/`

7. ✅ **Admin genera invitación → Exitoso**
   - Token UUID generado
   - URL copiada al portapapeles
   - Invitación listada con estado "active"

8. ✅ **Usuario no-admin intenta generar → Rechazado**
   - Error 403: "No autorizado"

---

## Referencias

### Código

- **Auth Config:** `lib/auth.ts` - Better Auth configuration + hooks
- **Invitation API:** `app/api/invitations/` - Generate + List routes
- **Signup Page:** `app/(auth)/signup/page.tsx` - Token validation
- **Admin UI:** `app/settings/invitations/page.tsx` - Invitation management
- **Prisma Schema:** `prisma/schema.prisma` - User + Invitation models
- **Middleware:** `middleware.ts` - Session protection

### Commits

- **Commit:** `a05715e4` - feat: implementar sistema de invitaciones para registro controlado
- **Branch:** `dev`
- **Date:** 2025-11-10

### Documentación Externa

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth Hooks](https://www.better-auth.com/docs/concepts/hooks)
- [Prisma Adapter](https://www.better-auth.com/docs/integrations/prisma)

### ADRs Relacionados

- **Supersedes:** [ADR-005: No Authentication System (MVP Phase)](./005-no-authentication-mvp.md)
- **Related:** [ADR-004: Neon PostgreSQL](./004-neon-postgresql.md) - Database usado para User/Invitation

---

## Notas Adicionales

### Roadmap Futuro

**Fase 1: ✅ COMPLETADA (este ADR)**
- Better Auth + Sistema de invitaciones
- Admin puede generar invitaciones
- Solo usuarios invitados se registran

**Fase 2: Email Verification (Futuro)**
- Habilitar `requireEmailVerification: true`
- Configurar email provider (Resend, SendGrid, Nodemailer)
- Enviar emails automáticos de invitación
- **Trigger:** Cuando >10 usuarios activos

**Fase 3: RBAC Granular (Futuro)**
- Roles adicionales: `viewer`, `editor`, `admin`, `owner`
- Permisos por recurso (payments, customers, projects)
- Row-Level Security (Neon RLS)
- **Trigger:** Cuando necesitemos permisos complejos

**Fase 4: Audit Logs (Futuro)**
- Agregar `createdBy`, `updatedBy` FK a User
- Tracking de cambios por usuario
- Timeline de modificaciones
- **Trigger:** Cuando necesitemos compliance/auditoría

### Cuándo Migrar a NextAuth

Considerar migración si:

1. ❌ **Better Auth limitations** críticas encontradas
2. ❌ **Community/docs insuficientes** para features complejas
3. ❌ **Necesidad de múltiples OAuth providers** (Google, GitHub, Apple)
4. ❌ **Enterprise requirements** que Better Auth no cubre

**Costo de migración estimado:** 8-12 horas
- Schema ya compatible (User, Account, Session)
- Lógica de invitaciones se preserva (custom logic)
- UI puede reutilizarse parcialmente

### Cuándo Migrar a Clerk

Considerar si:

1. ✅ **>100 usuarios activos** (justify $25/mes cost)
2. ✅ **SAML SSO requerido** (enterprise customers)
3. ✅ **Complex auth flows** (MFA, passwordless, etc.)
4. ✅ **Admin dashboard robusto** necesario (user management)

**Costo de migración estimado:** 12-16 horas
- Reescritura de auth logic (Clerk API)
- Data migration (User/Session a Clerk)
- Testing extensivo

### Lecciones Aprendidas

1. **Hooks de Better Auth son poderosos** - Validación clean sin middleware custom
2. **Custom fields funcionan** - TypeScript warning pero runtime OK
3. **Setup más rápido de lo esperado** - 4-6 hrs vs 10-15 NextAuth
4. **UI components ahorran tiempo** - No construir login/signup desde cero
5. **Vendor lock-in manejable** - Migración a NextAuth es factible

---

**Última actualización:** 2025-11-10

**Próxima revisión:** 2025-11-24 (2 semanas)

**Responsable:** Equipo de desarrollo

**Status:** ✅ Implementado y funcionando en producción
