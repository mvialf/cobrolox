# CLAUDE.md

Este archivo proporciona orientación a Claude Code cuando trabaja con este template.

## Proyecto

**Cobrolox** - Template SaaS para Chile especializado en facturación y cobros.

**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Prisma + Neon

**📚 Documentación completa:** Ver [README.md](README.md) y [docs/template/](docs/template/)

## ⚡ Comandos Críticos

**SIEMPRE ejecutar después de modificaciones:**

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
```

**Desarrollo:**

```bash
npm run dev         # Puerto 3000
```

## 🎯 Qué Incluye Este Template

### ✅ REUTILIZABLE (Mantener)

- **Customer System** completo (CRUD + validación RUT)
- **Payment System** completo (métodos + cuotas + installments)
- **Settings System** (configuración de payment methods)
- **Regional Chile** (RUT, regiones, comunas, direcciones)
- **Layout System** (AppLayout + AppSidebar + PageHeader)
- **50+ UI Components** (shadcn/ui)
- **Testing** (Vitest + Playwright)

### ❌ REMOVIDO (Era específico de Cobralon - ventanas)

- Projects (reemplazar con Invoices)
- Aftersales (garantías post-instalación)
- UninstallTags (etiquetas de desinstalación)
- ProjectStatus (reemplazar con InvoiceStatus)

## 🚧 TODO para Nueva Implementación

1. **Invoice Model** - Similar a viejo Project model pero para facturas
2. **InvoiceStatus Model** - Estados de facturas (pendiente, pagada, vencida)
3. **PaymentAllocation Model** - Relación N:M Payment ↔ Invoice

Ver TODOs en `prisma/schema.prisma`

## 🌐 Idioma

- **Respuestas:** Español
- **Código/variables:** Inglés
- **Comentarios:** Español
- **Commits:** Español

## 🔍 Consulta de Documentación

- **Claude Code:** Usar `/docs` antes de especular
- **Bibliotecas:** Usar MCP Context7 para docs actualizadas

## Estilos y CSS

- **NUNCA** hardcodear estilos inline
- **SIEMPRE** usar global.css para estilos personalizados
- Preferir Tailwind utilities
- Variables CSS: `var(--nombre-variable)`

## 🔎 Búsqueda de Código

### Herramientas Directas

- `Grep` - Buscar texto
- `Glob` - Encontrar archivos por patrón
- `Read` - Leer archivo conocido

### Agentes Especializados

- `code-searcher` - Análisis multi-paso, patrones, dependencias
- `git-searcher` - Historial, blame, commits

## 📚 Importaciones de Docs

### Template Framework

```
@docs/template/README.md
@docs/template/architecture/overview.md
@docs/template/guides/building-features/
@docs/template/components/app-layout.md
```

### Decisiones (ADRs)

```
@docs/template/decisions/001-nextjs-15-app-router.md
@docs/template/decisions/002-tailwind-css-v4.md
@docs/template/decisions/003-shadcn-ui-new-york.md
@docs/template/decisions/004-layout-system-dos-capas.md
@docs/template/decisions/008-prisma-neon.md
```

## Quick Reference

### Path Aliases

- `@/components` → componentes
- `@/lib` → utilidades
- `@/hooks` → custom hooks
- `@/app` → App Router

### Crear Nueva Página

```tsx
import { AppLayout } from "@/components/layout/app-layout";

export default function Page() {
  return (
    <AppLayout pageTitle="Título" pageDescription="Desc">
      <div>Contenido</div>
    </AppLayout>
  );
}
```

### Agregar Componente shadcn

```bash
npx shadcn@latest add [component-name]
```

## 🗄️ Database

**Prisma Commands:**

```bash
npm run db:generate  # Genera Prisma Client
npm run db:push      # Aplica schema (dev)
npm run db:migrate   # Migración (prod)
npm run db:studio    # GUI
npm run db:seed      # Seed data
```

**Modelos Actuales:**

- User, Customer, Payment, PaymentMethod, Installment, BadgeColor

**Pendientes:**

- Invoice, InvoiceStatus, PaymentAllocation

## Workflow de Features

Ver guía completa: [docs/template/guides/building-features/](docs/template/guides/building-features/)

**4 patrones principales:**

1. Read-Only Data Display → Server Component + DataTable
2. CRUD Operations → Form + Dialog + API Route
3. Modal Interactions → Dialog + Client Component
4. Complex Relations (N:M) → Transformers + Allocations

**Principios:**

- Server Components First
- Extract When It Hurts (>10 líneas O 2+ usos)
- Data Down, Events Up
- Test What Matters

---

**📖 Ver README.md para guía completa del template**
