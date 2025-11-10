# Documentación del Proyecto Cobrolox

Esta es la documentación de **Cobrolox**, una herramienta de gestión interna para cobros y pagos construida con el SaaS Template.

## 📁 Estructura de Documentación

- [**architecture/**](architecture/) - Arquitectura del sistema (data model, layers, logging, etc.)
- [**decisions/**](decisions/) - ADRs (Architecture Decision Records) del proyecto
- [**implementation/**](implementation/) - Timeline de implementaciones organizadas por periodo
- [**analysis/**](analysis/) - Análisis técnicos y estudios de viabilidad

## 🎯 Decisiones Arquitecturales Clave

### Autenticación y Seguridad

- **[ADR-006: Better Auth con Sistema de Invitaciones](decisions/006-better-auth-invitation-system.md)** 🔐
  - Sistema de autenticación implementado (2025-11-10)
  - Control de acceso por invitaciones (tokens únicos, 7 días expiración)
  - Solo admins pueden generar invitaciones
  - Supersede ADR-005 (No Authentication MVP)

- **[ADR-005: No Authentication System (MVP Phase)](decisions/005-no-authentication-mvp.md)** ~~SUPERSEDED~~
  - Decisión original de MVP sin auth (histórico)
  - Superseded por ADR-006 cuando requisitos cambiaron

### Datos y Almacenamiento

- **[ADR-004: Neon PostgreSQL](decisions/004-neon-postgresql.md)** 🗄️
  - PostgreSQL en Neon (database branching, autoscaling)
  - Free tier: 512MB, unlimited branches
  - Testing seguro de migrations con branches

### Sistema de Pagos

- **[ADR-001: PaymentAllocation Architecture](decisions/001-payment-allocation-architecture.md)** 💰
  - Tabla intermedia N:M para Payment ↔ Project
  - Soporta pagos a 1 proyecto o múltiples proyectos
  - Auditoría detallada de asignaciones

- **[ADR-002: Dual Payment Flows](decisions/002-dual-payment-flows.md)** 💸
  - Flujo 1:1 (Project Payment) vs Flujo 1:N (Customer Payment)
  - UX especializada para cada caso de uso
  - Validación de SUM(allocations) === payment.amount

- **[ADR-003: Installments Without Interest](decisions/003-installments-without-interest.md)** 📊
  - Sistema de cuotas sin interés (FIFO allocation)
  - Cálculo automático de montos por cuota
  - Tracking de cuotas pagadas vs pendientes

### Infraestructura

- **[ADR-012: Pino Structured Logging](decisions/012-pino-structured-logging.md)** 📝
  - Logging estructurado con Pino (30ns per log)
  - Request correlation automática (UUID)
  - JSON en producción, pretty-print en dev
  - Security: redaction automática de datos sensibles

- **[ADR-011: PageHeader Action Slot](decisions/011-pageheader-action-slot.md)** 🎨
  - Layout system con slot para acciones
  - Componente reutilizable en todas las páginas

- **[ADR-012: Navegación Jerárquica](decisions/012-navegacion-jerarquica.md)** 🧭
  - Breadcrumbs automáticos
  - Navegación consistente

## 📚 Arquitectura del Sistema

### Data Model

Ver documentación completa en [`architecture/01-data-model/`](architecture/01-data-model/):

**Entidades principales:**
- **Customer** - Clientes del negocio
- **Project** - Proyectos de instalación
- **Payment** - Pagos recibidos
- **PaymentAllocation** - Asignación N:M Payment ↔ Project
- **Installment** - Cuotas de pago sin interés
- **User** - Usuarios del sistema (autenticación)
- **Invitation** - Tokens de invitación para registro

**Relaciones clave:**
- Customer 1:N Project
- Payment N:M Project (via PaymentAllocation)
- Payment 1:N Installment
- User 1:N Invitation

### Business Logic

Ver documentación en [`architecture/02-business-flows/`](architecture/02-business-flows/):

**Flujos principales:**
1. **Payment to Project** - Pago directo a proyecto específico
2. **Payment to Customer** - Pago distribuido entre múltiples proyectos
3. **Installment Generation** - Generación de cuotas sin interés
4. **User Invitation** - Sistema de invitaciones por token

### Technical Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (50+ components)

**Backend:**
- Next.js API Routes
- Better Auth (autenticación)
- Prisma ORM
- Zod (validación)

**Database:**
- PostgreSQL (Neon)
- Database branching
- Connection pooling (PgBouncer)

**Testing:**
- Vitest (unit tests)
- React Testing Library
- Playwright (E2E)

**Logging:**
- Pino (structured logging)
- Request correlation
- Security redaction

## 🚀 Implementation Timeline

Ver logs detallados en [`implementation/`](implementation/):

### 2025-11-10: Sistema de Autenticación
- ✅ Implementar Better Auth + hooks de validación
- ✅ Crear sistema de invitaciones por token
- ✅ API routes para gestión de invitaciones
- ✅ Admin UI en `/settings/invitations`
- ✅ Middleware de protección de rutas
- ✅ Crear admin inicial (`mvial@cristaluxspa.cl`)

### 2025-10-XX: Sistema de Pagos
- ✅ Implementar PaymentAllocation (N:M)
- ✅ Dual payment flows (Project vs Customer)
- ✅ Sistema de cuotas sin interés
- ✅ Validaciones exhaustivas (15+ checks)

### 2025-10-XX: Setup Inicial
- ✅ Configurar Neon PostgreSQL
- ✅ Prisma schema con modelos core
- ✅ Layout system (AppLayout + AppSidebar)
- ✅ UI components (shadcn/ui)

## 📖 Guías de Uso

### Para Nuevos Desarrolladores

1. **Lee los ADRs principales:**
   - ADR-006 (Better Auth) - Sistema de autenticación actual
   - ADR-001 (PaymentAllocation) - Arquitectura de pagos
   - ADR-002 (Dual Flows) - Flujos de UX

2. **Explora la arquitectura:**
   - `architecture/01-data-model/` - Entender el modelo de datos
   - `architecture/03-layers/` - Capas de la aplicación
   - `architecture/04-logging/` - Sistema de logging

3. **Revisa el código:**
   - `lib/auth.ts` - Configuración de autenticación
   - `lib/business-logic/` - Lógica de negocio
   - `components/` - UI components reutilizables

### Para Agregar Features

1. **Documenta la decisión:**
   - Crea un ADR en `decisions/` si es significativa
   - Usa [template-slim.md](decisions/template-slim.md) o [template-extended.md](decisions/template-extended.md)

2. **Implementa siguiendo patrones:**
   - Ver [docs/template/guides/building-features/](../template/guides/building-features/)
   - 4 patrones: Read-Only, CRUD, Modal, Complex Relations

3. **Registra la implementación:**
   - Agrega entry en `implementation/YYYY-MM.md`
   - Documenta decisiones técnicas relevantes

### Para Mantenimiento

1. **Logs de producción:**
   - Ver Vercel dashboard (JSON structured logs)
   - Request correlation por UUID
   - Security redaction automática

2. **Database:**
   - Usa database branching para testing
   - Connection pooling vía `?pgbouncer=true`
   - Migrations con `npm run db:push`

3. **Autenticación:**
   - Admin UI: `/settings/invitations`
   - Generar tokens para nuevos usuarios
   - Tokens expiran en 7 días

## 🔗 Enlaces Útiles

### Documentación Interna

- [Template Documentation](../template/) - Guías del framework base
- [Architecture Overview](architecture/) - Arquitectura completa
- [ADRs Index](decisions/README.md) - Todas las decisiones

### Herramientas Externas

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Neon Console](https://console.neon.tech)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Repositorio y Deploy

- **Branch principal:** `dev`
- **Production:** (configurar URL)
- **Database:** Neon PostgreSQL (Prisma connection)

## 🎯 Roadmap Futuro

### Fase 2: Email & Advanced Auth (Q1 2026)
- Email verification habilitado
- Envío automático de invitaciones
- Password reset flow completo
- Multi-factor authentication (opcional)

### Fase 3: RBAC Granular (Q2 2026)
- Roles avanzados: viewer, editor, admin, owner
- Permisos por recurso (payments, customers, projects)
- Row-Level Security (Neon RLS)

### Fase 4: Audit & Analytics (Q3 2026)
- Audit logs completos (createdBy, updatedBy FK)
- Timeline de cambios por entidad
- Dashboard de analytics
- Export de datos (CSV, Excel)

---

**Última actualización:** 2025-11-10

**Mantenido por:** Equipo de desarrollo

**Contacto:** [Agregar email/Slack]
