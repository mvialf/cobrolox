# CLAUDE.md

Orientación para Claude Code en el proyecto Cobrolox.

## Proyecto

**Cobrolox** - Sistema de gestión de facturación y cobros para Chile.

**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Prisma + Neon

**Documentación:** Ver [docs/project/](docs/project/)

## Comandos Críticos

**SIEMPRE ejecutar después de modificaciones:**

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
```

**Desarrollo:**

```bash
npm run dev         # Puerto 3000
```

## Idioma

- **Respuestas:** Español
- **Código/variables:** Inglés
- **Comentarios:** Español
- **Commits:** Español

## Consulta de Documentación

- **Claude Code:** Usar `/docs` antes de especular
- **Bibliotecas:** Usar MCP Context7 para docs actualizadas

## Estilos y CSS

- **NUNCA** hardcodear estilos inline
- **SIEMPRE** usar global.css para estilos personalizados
- Preferir Tailwind utilities
- Variables CSS: `var(--nombre-variable)`

## Búsqueda de Código

### Herramientas Directas

- `Grep` - Buscar texto
- `Glob` - Encontrar archivos por patrón
- `Read` - Leer archivo conocido

### Agentes Especializados

- `code-searcher` - Análisis multi-paso, patrones, dependencias
- `git-searcher` - Historial, blame, commits

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

## Database

**Prisma Commands:**

```bash
npm run db:generate  # Genera Prisma Client
npm run db:push      # Aplica schema (dev)
npm run db:migrate   # Migración (prod)
npm run db:studio    # GUI
npm run db:seed      # Seed data
```

## Workflow de Features

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
