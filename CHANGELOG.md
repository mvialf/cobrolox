# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-11-10

### Added - Sistema de Autenticación 🔐

**Better Auth con Sistema de Invitaciones**

- Sistema de autenticación completo con Better Auth
- Sistema de invitaciones por token único (UUID, 7 días expiración)
- Solo usuarios con invitación válida pueden registrarse
- Roles de usuario: `admin` (genera invitaciones) y `user` (estándar)
- Admin UI en `/settings/invitations` para gestión de invitaciones
- Auto-login después de signup exitoso
- Middleware de protección de rutas (todas excepto /login y /signup)
- Validación exhaustiva: 6 checks (token existe, no expirado, no usado, email match, etc.)

**Páginas de Autenticación:**
- `/login` - Página de login con Better Auth
- `/signup` - Registro con validación de token en URL
- `/settings/invitations` - Admin dashboard para invitaciones

**API Endpoints:**
- `POST /api/invitations/generate` - Generar invitación (solo admins)
- `GET /api/invitations` - Listar invitaciones con estados (activa/usada/expirada)

**Database Models:**
- `User` - Usuarios con field `role` (admin/user)
- `Invitation` - Tokens de invitación con tracking de uso
- `Session` - Sesiones de Better Auth (7 días)
- `Account` - Cuentas con password hash
- `Verification` - Tokens de verificación

**Scripts:**
- `scripts/update-mvial-to-admin.ts` - Helper para crear admin inicial

### Changed

- **ADR-005** marcado como SUPERSEDED por ADR-006
- Signup ahora requiere token de invitación en URL
- Todas las rutas protegidas por middleware (excepto /login y /signup)

### Documentation

- **Nuevo ADR-006:** Better Auth con Sistema de Invitaciones (952 líneas)
- **Actualizado ADR-005:** Marcado como SUPERSEDED con contexto del cambio
- **Actualizado README.md:** Índice de ADRs con ADR-006
- **Actualizado docs/project/README.md:** Sección de autenticación y seguridad
- **Nuevo Implementation Log:** Entrada detallada de sistema de autenticación

### Fixed

- Signup sin restricciones → Ahora solo con token válido
- Acceso sin autenticación → Todas las rutas protegidas

### Security

- Control de acceso implementado (solo usuarios invitados)
- Password hashing con Better Auth (scrypt)
- Session management seguro (7 días, auto-refresh)
- Token validation exhaustiva (6 checks)
- Email match validation (previene uso de token por otro email)
- One-time use tokens (no reutilizables)

**Admin Credentials:**
- Email: `mvial@cristaluxspa.cl`
- Role: `admin`
- Can: Generar invitaciones, acceder a todas las features

---

## [0.1.0] - 2025-10-XX

### Added - MVP Inicial

**Sistema de Pagos:**
- PaymentAllocation architecture (N:M Payment ↔ Project)
- Dual payment flows (Project vs Customer)
- Sistema de cuotas sin interés (FIFO allocation)
- Validaciones exhaustivas (15+ checks)

**Data Model:**
- Customer, Project, Payment, PaymentAllocation, Installment
- Regional Chile: RUT validation, regiones, comunas
- Balance tracking automático por proyecto

**UI Components:**
- AppLayout + AppSidebar (layout de 2 capas)
- 50+ shadcn/ui components
- DataTable con sorting, filtering, pagination
- Forms con React Hook Form + Zod validation

**Infrastructure:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma ORM + PostgreSQL (Neon)
- Pino structured logging

**Testing:**
- Vitest (unit tests)
- React Testing Library
- Playwright (E2E)

### Documentation

- ADR-001: PaymentAllocation Architecture
- ADR-002: Dual Payment Flows
- ADR-003: Installments Without Interest
- ADR-004: Neon PostgreSQL
- ADR-005: No Authentication System (MVP Phase) - **SUPERSEDED en v0.2.0**
- ADR-011: PageHeader Action Slot
- ADR-012: Pino Structured Logging

---

## Roadmap

### [0.3.0] - Q1 2026 (Planned)

**Email & Advanced Auth:**
- Email verification habilitado
- Envío automático de invitaciones por email
- Password reset flow completo
- Multi-factor authentication (opcional)

### [0.4.0] - Q2 2026 (Planned)

**RBAC Granular:**
- Roles avanzados: viewer, editor, admin, owner
- Permisos por recurso (payments, customers, projects)
- Row-Level Security (Neon RLS)

### [0.5.0] - Q3 2026 (Planned)

**Audit & Analytics:**
- Audit logs completos (createdBy, updatedBy FK)
- Timeline de cambios por entidad
- Dashboard de analytics
- Export de datos (CSV, Excel)

---

## Links

- [Documentation](docs/project/README.md)
- [Architecture Decision Records](docs/project/decisions/)
- [Implementation Log](docs/project/implementation/2025-current.md)

---

**Legend:**
- 🔐 Authentication & Security
- 💰 Payment System
- 🗄️ Database
- 🎨 UI/UX
- 📝 Logging
- 🔧 Fixes
- 📖 Documentation
