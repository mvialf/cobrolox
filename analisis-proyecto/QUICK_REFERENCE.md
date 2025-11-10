# Cobrolox - Quick Reference Guide

**Guía rápida para desarrolladores - Últimos 3 meses**

---

## 🗂️ ESTRUCTURA DE CARPETAS ESENCIAL

```
app/
├── customer/           # Gestión de clientes (CRUD)
├── payments/           # Pagos + cuotas
├── invoice/            # Facturas (nuevo)
├── api/
│   ├── customers/      # API GET/POST/PUT/DELETE
│   ├── invoices/       # API facturas
│   ├── payments/       # API pagos
│   └── import/         # Bulk import
├── settings/           # Configuración
└── examples/           # Demos

components/
├── ui/                 # shadcn/ui (50+)
├── layout/             # AppLayout, PageHeader
├── dialogs/            # Modal CRUD
├── forms/              # Formularios
├── data-table/         # Abstracción de tabla
├── cells/              # Renderers de columnas
└── summarys/           # Cards de resumen

lib/
├── business-logic/     # Core: balance, FIFO, installments
├── validations/        # Zod schemas
├── transformers/       # Data transformation
├── utils/              # Helpers generales
├── constants/          # Configuración estática
├── import/             # Excel parser
└── types/              # Custom types

hooks/
├── queries/            # React Query (useCustomers, usePayments)
├── use-mobile.ts       # Responsive detection
├── use-debounce.ts     # Debounce utility
└── use-rut-input.ts    # RUT formatting

prisma/
├── schema.prisma       # Data models (12)
└── seed.ts             # Test data
```

---

## 📚 ARCHIVOS CLAVE A CONOCER

### Core Negocio

| Archivo                                  | Propósito           | Líneas |
| ---------------------------------------- | ------------------- | ------ |
| `prisma/schema.prisma`                   | Modelos de datos    | 224    |
| `lib/business-logic/customer-balance.ts` | Cálculo de balances | 301    |
| `lib/business-logic/payment-fifo.ts`     | Distribución FIFO   | 204    |
| `lib/validations/*.ts`                   | Validaciones Zod    | ~800   |

### UI Principal

| Archivo                                       | Propósito         | Líneas |
| --------------------------------------------- | ----------------- | ------ |
| `components/layout/app-layout.tsx`            | Wrapper principal | 52     |
| `components/data-table/data-table.tsx`        | Tabla genérica    | ~150   |
| `components/dialogs/customer/*.tsx`           | Customer dialogs  | ~400   |
| `components/forms/customer/customer-form.tsx` | Customer form     | ~100   |

### APIs

| Archivo                      | Propósito     | Líneas |
| ---------------------------- | ------------- | ------ |
| `app/api/customers/route.ts` | Customer CRUD | ~200   |
| `app/api/payments/route.ts`  | Payment CRUD  | ~200   |
| `app/api/invoices/route.ts`  | Invoice CRUD  | ~200   |

### Hooks

| Archivo                          | Propósito        | Líneas |
| -------------------------------- | ---------------- | ------ |
| `hooks/queries/use-customers.ts` | Customer queries | ~150   |
| `hooks/queries/use-payments.ts`  | Payment queries  | ~150   |
| `hooks/queries/use-invoices.ts`  | Invoice queries  | ~150   |

---

## 🔑 CONCEPTOS CLAVE

### 1. FIFO Payment Allocation

```typescript
// Pagos se asignan a facturas más antiguas primero
calculateFIFO(totalAmount: number, invoices: Invoice[])
// Retorna: [{ invoiceId, allocatedAmount, isFullyPaid }]

// Flujo: Usuario → calculateFIFO() → review → POST /api/payments
```

### 2. Balance Denormalization

```typescript
// Customer tiene 3 columnas calculadas:
balanceTotal; // Suma de todos
balanceVigente; // No vencidas (dueDate > now)
balanceVencido; // Vencidas (dueDate < now)

// Actualizar: recalculateCustomerBalances(customerId)
// Llamar después: crear/editar Invoice o PaymentAllocation
```

### 3. Dos Estados en Invoice

```typescript
// invoiceStatus: estado administrativo (Borrador, Emitida, Vencida)
// paymentInvoiceStatus: estado de pago (Sin pagar, Parcialmente pagada, Pagada)

// Esto permite: factura "Vencida" que es "Pagada" (pago tardío)
```

### 4. Validación con Zod

```typescript
// Todos los POST/PUT validan con Zod
const data = schema.parse(body); // Throws ZodError si inválido

// En API:
try {
  const data = schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ errors: error.errors }, { status: 400 });
  }
}
```

### 5. React Query + Mutations

```typescript
// Queries: useCustomers(), usePayments(), useInvoices()
// Mutations: useCreateCustomer(), useUpdateCustomer(), useDeleteCustomer()

// Automáticamente refetch después de mutación:
queryClient.invalidateQueries({ queryKey: ["customers"] });
```

---

## 🔐 AUTENTICACIÓN (Better Auth)

### Solución Implementada

**Biblioteca:** Better Auth v1.3.34
**Fecha:** 10 de Noviembre, 2025
**Estado:** ✅ COMPLETADO

### Archivos Clave

| Archivo                            | Propósito                             | Líneas |
| ---------------------------------- | ------------------------------------- | ------ |
| `lib/auth.ts`                      | Servidor Better Auth + config         | ~80    |
| `lib/auth-client.ts`               | Cliente React + hooks                 | ~35    |
| `middleware.ts`                    | Protección de rutas (Node.js runtime) | ~90    |
| `app/api/auth/[...all]/route.ts`   | API handler de Better Auth            | ~5     |
| `app/(auth)/login/page.tsx`        | Página de login                       | ~135   |
| `app/(auth)/signup/page.tsx`       | Página de registro                    | ~178   |
| `app/(auth)/forgot-password/*.tsx` | Password reset flow                   | ~200   |

### Modelos de Base de Datos

```typescript
// prisma/schema.prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  sessions      Session[]
  accounts      Account[]
}

model Session {
  token     String   @unique
  expiresAt DateTime  // 7 días
  userId    String
  user      User
}

model Account {
  password  String?  // Hasheado con scrypt
  providerId String  // "credential"
  userId    String
}
```

### Uso en Código

#### Client Component

```typescript
"use client";
import { useSession, authClient } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Loading />;
  if (!session) return <NotAuthenticated />;

  return (
    <div>
      <p>Hola {session.user.name}</p>
      <button onClick={() => authClient.signOut()}>Logout</button>
    </div>
  );
}
```

#### Server Component

```typescript
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  return <div>Usuario: {session.user.email}</div>;
}
```

### Páginas de Auth

- `/login` - Iniciar sesión
- `/signup` - Crear cuenta nueva
- `/forgot-password` - Solicitar reset de contraseña
- `/reset-password?token=...` - Establecer nueva contraseña

### Middleware de Protección

```typescript
// middleware.ts protege TODAS las rutas excepto:
const publicRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

// Redirect automático a /login si no hay sesión
```

### Características

- ✅ Email/password authentication
- ✅ Password reset con tokens (1 hora expiración)
- ✅ Sessions en base de datos (7 días)
- ✅ Middleware que protege rutas
- ✅ Auto-login después de registro
- ✅ Prisma adapter para PostgreSQL
- ✅ User menu en sidebar con logout
- ✅ Validación de contraseña (min 8 chars)

### Comandos

```bash
# Servidor ya incluye auth
npm run dev

# Acceder a páginas
http://localhost:3000/signup   # Crear cuenta
http://localhost:3000/login    # Iniciar sesión
```

---

## 🛠️ COMANDOS ESENCIALES

```bash
# Desarrollo
npm run dev           # Start dev server (localhost:3000)
npm run lint          # ESLint
npm run typecheck     # TypeScript type check
npm run lint:fix      # Auto-fix lint errors

# Testing
npm run test          # Vitest
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E
npm run test:e2e:ui   # Playwright UI

# Database
npm run db:generate   # Prisma Client
npm run db:push       # Apply schema (dev)
npm run db:migrate    # Create migration (prod)
npm run db:studio     # GUI editor
npm run db:seed       # Seed test data

# Build & Deploy
npm run build         # Production build
npm start             # Start production server
```

---

## 📋 PATRONES COMUNES

### Patrón 1: Crear Nuevo CRUD

```typescript
// 1. Agregar model en prisma/schema.prisma
model MyEntity {
  id String @id @default(uuid())
  name String
  // ...
}

// 2. Crear API routes
app/api/myentity/route.ts       # GET, POST
app/api/myentity/[id]/route.ts  # GET, PUT, DELETE

// 3. Crear React Query hook
hooks/queries/use-myentity.ts

// 4. Crear componentes
components/dialogs/myentity/
  ├─ new-myentity-dialog.tsx
  ├─ edit-myentity-dialog.tsx
  └─ delete-dialog.tsx

components/forms/myentity/
  └─ myentity-form.tsx

// 5. Crear página
app/myentity/page.tsx
  └─ DataTable + Dialogs
```

### Patrón 2: Crear Formulario

```typescript
// 1. Definir schema Zod
lib/validations/myentity-validations.ts

// 2. Crear form component
components/forms/myentity/myentity-form.tsx

// 3. Usar en dialog
components/dialogs/myentity/new-myentity-dialog.tsx
  ├─ Dialog
  └─ MyEntityForm

// 4. Hook de mutación
hooks/queries/use-myentity.ts
  └─ useCreateMyEntity() mutation
```

### Patrón 3: Crear Query Hook

```typescript
// hooks/queries/use-myentity.ts

export function useMyEntity(params?: QueryParams) {
  return useQuery({
    queryKey: ["myentity", params],
    queryFn: async () => {
      const res = await fetch(`/api/myentity?...`);
      return res.json();
    },
  });
}

export function useCreateMyEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/myentity", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myentity"] });
      toast.success("Creado exitosamente");
    },
  });
}
```

---

## 🐛 DEBUGGING COMÚN

### Problem: "Type 'X' is not assignable to type 'Y'"

**Solución:** Verificar tipos en hooks/queries y validations

```typescript
// Asegurar que tipo retornado por API = tipo del hook
export type Customer = {
  id: string;
  rut: string;
  // ... mismo que schema
};
```

### Problem: React Query no refetch

**Solución:** Invalidar correctamente

```typescript
// ✅ CORRECTO:
queryClient.invalidateQueries({ queryKey: ["customers"] });

// ❌ INCORRECTO:
queryClient.invalidateQueries({ queryKey: ["customer"] }); // queryKey debe coincidir
```

### Problem: Form field no se actualiza

**Solución:** Revisar react-hook-form binding

```typescript
// ✅ CORRECTO:
<FormField
  name="fieldName"
  render={({ field }) => (
    <Input {...field} />
  )}
/>

// ❌ INCORRECTO:
<Input value={watch('fieldName')} /> // No se sincroniza bien
```

### Problem: Balance desincronizado

**Solución:** Llamar recalculateCustomerBalances después de cambio

```typescript
// Después de crear/editar invoice o payment:
await recalculateCustomerBalances(customerId);
```

---

## 📊 CONVENCIONES DE CÓDIGO

### Naming

| Tipo          | Convención  | Ejemplo                |
| ------------- | ----------- | ---------------------- |
| Functions     | camelCase   | `calculateBalance()`   |
| Classes/Types | PascalCase  | `CustomerForm`         |
| Constants     | UPPER_SNAKE | `MAX_INSTALLMENTS`     |
| Files         | kebab-case  | `customer-form.tsx`    |
| Folders       | kebab-case  | `customer-form/`       |
| Hooks         | useXxx      | `useCustomers()`       |
| Contexts      | XxxContext  | `ConfigurationContext` |

### Comments

```typescript
// ✅ BUENO: Explica el POR QUÉ
// Recalcular balance después de cambios
await recalculateCustomerBalances(customerId);

// ❌ MALO: Explica qué es obvio
// Incrementar contador
count++;

// ✅ BUENO: Comentarios de sección
// ============================================================================
// CUSTOMER FORM COMPONENT
// ============================================================================
```

### Imports

```typescript
// ✅ BUENO: Agrupar por origen
import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppLayout } from "@/components/layout/app-layout";
import { customerSchema } from "@/lib/validations/customer-validations";

// ❌ MALO: Sin organización
import { AppLayout } from "@/components/layout/app-layout";
import { useQuery } from "@tanstack/react-query";
import { customerSchema } from "@/lib/validations/customer-validations";
```

---

## 🔒 SEGURIDAD

### Antes de Producción

- [ ] ❌ Implementar autenticación (NextAuth, Clerk, Auth0)
- [ ] ❌ Agregar rate limiting
- [ ] ❌ Validar todas las inputs (ya hecho con Zod)
- [ ] ❌ Usar HTTPS
- [ ] ❌ Proteger variables de entorno
- [ ] ❌ Auditoría de cambios
- [ ] ❌ Backups automáticos

### En Código

```typescript
// ✅ HACER:
// 1. Validar input
const data = schema.parse(body);

// 2. Verificar autorización
if (customer.userId !== userId) throw new Error("Unauthorized");

// 3. Usar parameterized queries (Prisma hace esto)
prisma.customer.findUnique({ where: { id: customerId } });

// 4. No loguear datos sensibles
logger.info({ customerId }, "Customer deleted"); // ✅
logger.info({ customer }, "Customer deleted"); // ❌

// ❌ NO HACER:
// 1. Confiar en cliente para autorización
// 2. Interpolar SQL directamente
// 3. Exponer errores internos al cliente
// 4. Loguear passwords, tokens, etc.
```

---

## 📈 PERFORMANCE TIPS

### Database

```typescript
// ❌ MALO: N+1 queries
const customers = await prisma.customer.findMany();
for (const customer of customers) {
  const payments = await prisma.payment.findMany({
    where: { customerId: customer.id },
  });
}

// ✅ BUENO: Include o select
const customers = await prisma.customer.findMany({
  include: {
    payments: { take: 10 },
  },
});

// ✅ TAMBIÉN BUENO: Batch queries
const paymentsByCustomer = await prisma.payment.findMany({
  where: { customerId: { in: customerIds } },
});
```

### React

```typescript
// ✅ BUENO: Memoizar cálculos costosos
const balances = useMemo(() => {
  return customers.map((c) => calculateBalance(c));
}, [customers]);

// ✅ BUENO: Lazy load componentes
const HeavyComponent = lazy(() => import("./Heavy"));

// ✅ BUENO: Debounce búsqueda
const debouncedSearch = useDebounce(searchTerm, 300);
```

### API

```typescript
// ✅ BUENO: Paginar resultados
const limit = Math.min(param.limit || 100, 1000);
const skip = (page - 1) * limit;

// ✅ BUENO: Cachear en headers
response.headers.set("Cache-Control", "public, max-age=300"); // 5 min

// ✅ BUENO: Comprimir response
// Next.js lo hace automáticamente
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

Para análisis profundo, ver:

| Documento                  | Qué contiene                              |
| -------------------------- | ----------------------------------------- |
| **ANALISIS_COMPLETO.md**   | Análisis técnico exhaustivo (80+ páginas) |
| **ARQUITECTURA_VISUAL.md** | Diagramas y flujos (15+ páginas)          |
| **RESUMEN_EJECUTIVO.md**   | Snapshot del proyecto                     |
| **CLAUDE.md**              | Instrucciones del proyecto                |
| **README.md**              | Guía general                              |

---

## 🚀 CREAR NUEVO FEATURE (Checklist)

```
[ ] 1. Entender requisito y diseñar schema
[ ] 2. Crear model en prisma/schema.prisma
[ ] 3. npm run db:generate && npm run db:push
[ ] 4. Crear tests de negocio (si aplica)
[ ] 5. Crear API routes (GET, POST, PUT, DELETE)
[ ] 6. Crear validations (Zod schema)
[ ] 7. Crear React Query hooks
[ ] 8. Crear componentes UI (form, dialogs, tables)
[ ] 9. Crear página principal
[ ] 10. Tests para componentes
[ ] 11. Tests E2E para flujo completo
[ ] 12. Actualizar documentación
[ ] 13. Code review
[ ] 14. Merge y deploy
```

---

## 💼 PARA NUEVOS DESARROLLADORES

1. **Primero:** Leer CLAUDE.md y README.md
2. **Segundo:** Ejecutar `npm install && npm run dev`
3. **Tercero:** Revisar app/customer/ (ejemplo completo)
4. **Cuarto:** Revisar lib/business-logic/ (lógica core)
5. **Quinto:** Leer prisma/schema.prisma (modelos)
6. **Sexto:** Ejecutar tests: `npm run test`
7. **Séptimo:** Explorar ejemplos en app/examples/

**Tiempo estimado onboarding:** 2-3 días

---

## 🆘 PREGUNTAS FRECUENTES

### P: ¿Dónde está la autenticación?

**R:** No está implementada. Ver RESUMEN_EJECUTIVO.md - Críticos.

### P: ¿Cómo funciona FIFO?

**R:** Ver lib/business-logic/payment-fifo.ts y ANALISIS_COMPLETO.md - Sección Lógica de Negocio.

### P: ¿Dónde validar datos?

**R:** Usar Zod en lib/validations/. Ver ejemplos en payment-validations.ts.

### P: ¿Cómo agregar nueva tabla?

**R:** Ver "Crear nuevo CRUD" en sección Patrones Comunes.

### P: ¿Por qué hay 3 balances?

**R:** Denormalización para performance. Ver ANALISIS_COMPLETO.md - Lógica de Negocio.

### P: ¿Qué es PaymentAllocation?

**R:** Relación N:M entre Payment e Invoice para FIFO allocation. Ver ARQUITECTURA_VISUAL.md - Modelo de Datos.

---

**Última actualización:** 10 de Noviembre, 2025  
**Versión:** 0.1.0
