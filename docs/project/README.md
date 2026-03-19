# Documentación del Proyecto Cobrolox

Herramienta de gestión interna para cobros y pagos.

## Estructura

- [**architecture/**](architecture/) - Arquitectura del sistema (data model, flujos, logging, APIs)
- [**decisions/**](decisions/) - ADRs (Architecture Decision Records) del proyecto
- [**guides/**](guides/) - Guías de configuración

## Decisiones Arquitecturales

### Autenticación y Seguridad

- **[ADR-006: Better Auth con Sistema de Invitaciones](decisions/006-better-auth-invitation-system.md)** - Sistema actual de auth
- **[ADR-005: No Authentication System (MVP Phase)](decisions/005-no-authentication-mvp.md)** ~~SUPERSEDED~~

### Sistema de Pagos

- **[ADR-001: PaymentAllocation Architecture](decisions/001-payment-allocation-architecture.md)** - Tabla N:M Payment ↔ Invoice
- **[ADR-002: Dual Payment Flows](decisions/002-dual-payment-flows.md)** - Flujo 1:1 vs 1:N
- **[ADR-003: Installments Without Interest](decisions/003-installments-without-interest.md)** - Cuotas sin interés

### Infraestructura

- **[ADR-004: Neon PostgreSQL](decisions/004-neon-postgresql.md)** - Base de datos
- **[ADR-012: Pino Structured Logging](decisions/012-pino-structured-logging.md)** - Logging estructurado
- **[ADR-011: PageHeader Action Slot](decisions/011-pageheader-action-slot.md)** - Layout system
- **[ADR-012: Navegación Jerárquica](decisions/012-navegacion-jerarquica.md)** - Breadcrumbs y navegación

## Arquitectura

- [`architecture/01-data-model/`](architecture/01-data-model/) - Modelos, relaciones, reglas de negocio
- [`architecture/02-business-flows/`](architecture/02-business-flows/) - Flujos de pago, cuotas, proyectos
- [`architecture/04-logging/`](architecture/04-logging/) - Sistema Pino completo
- [`architecture/05-technical-decisions/`](architecture/05-technical-decisions/) - Decisiones técnicas
- [`architecture/06-apis/`](architecture/06-apis/) - Documentación de APIs
- [`architecture/07-regional-config/`](architecture/07-regional-config/) - Config regional Chile
