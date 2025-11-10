# Cobrolox - Template SaaS para Chile

Template SaaS especializado para aplicaciones B2B en Chile con gestión de clientes, facturación y pagos.

## 🎯 Para Qué Es Este Template

Sistema base para **apps de facturación y cobros** en Chile con:

- ✅ **Customer Management** - Gestión completa de clientes (RUT, teléfono, email)
- ✅ **Payment System** - Pagos con múltiples métodos + cuotas
- ✅ **Settings System** - Configuración centralizada
- ✅ **Regional Chile** - Validación RUT, regiones, comunas
- ✅ **50+ UI Components** - Sistema completo shadcn/ui

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos (ver sección Database Setup)
cp .env.example .env.local
# Editar .env.local con tus credenciales de Neon

# 3. Generar Prisma Client y aplicar schema
npm run db:generate
npm run db:push

# 4. Iniciar servidor
npm run dev
```

## 📦 Lo Que Incluye

### Sistema de Customer

- ✅ CRUD completo de clientes
- ✅ Validación de RUT chileno
- ✅ Búsqueda y filtros
- ✅ DataTable con sorting/paginación

**Ubicación:**

- `app/customer/` - Página principal
- `app/api/customers/` - API endpoints
- `components/dialogs/customer/` - Diálogos CRUD
- `components/forms/customer/` - Formularios

### Sistema de Payments

- ✅ Registro de pagos (1:1 con customer actualmente)
- ✅ Múltiples métodos de pago configurables
- ✅ Sistema de cuotas (installments)
- ✅ Monedas múltiples (CLP, USD, EUR, etc.)

**Ubicación:**

- `app/payments/` - Página principal de pagos
- `app/payments/installments/` - Vista de cuotas
- `app/api/payments/` - API endpoints de pagos
- `components/dialogs/payments/` - Diálogos de pagos
- `components/forms/payments/` - Formularios de pagos

### Settings System

- ✅ Configuración de métodos de pago
- ✅ Sistema extensible para otras settings

**Ubicación:**

- `app/settings/` - Páginas de configuración
- `app/settings/payments/` - Config de métodos de pago
- `components/dialogs/settings/` - Diálogos de settings

### Regional Chile

- ✅ `lib/regiones-chile.ts` - Regiones y comunas
- ✅ `lib/rut-validations.ts` - Validación de RUT
- ✅ `lib/paises-config.ts` - Configuración regional
- ✅ `components/forms/fields/address-fields.tsx` - Campos de dirección chilena
- ✅ `components/ui/rut-input.tsx` - Input con validación RUT
- ✅ `components/ui/phone-input.tsx` - Input teléfono chileno

### Sistema de Layout

- ✅ AppLayout + AppSidebar + PageHeader
- ✅ Navegación jerárquica con active highlighting
- ✅ Responsive (mobile drawer + desktop sidebar)
- ✅ Theme toggle light/dark

### Testing

- ✅ Vitest + Testing Library configurado
- ✅ 57+ tests funcionando
- ✅ Playwright para E2E
- ✅ ESLint + Prettier

## 🗄️ Database Setup

### Prisma Schema Actual

**Modelos implementados:**

- `User` - Usuarios del sistema
- `Customer` - Clientes
- `Payment` - Pagos
- `PaymentMethod` - Métodos de pago (efectivo, transferencia, etc.)
- `Installment` - Cuotas de pagos
- `BadgeColor` - Sistema de colores para badges

**TODO (para tu implementación):**

- `Invoice` model (reemplaza al viejo Project)
- `InvoiceStatus` model (estados de facturas)
- `PaymentAllocation` model (relación N:M Payment ↔ Invoice)

Ver comentarios TODO en `prisma/schema.prisma` para más detalles.

### Setup Commands

```bash
# Generar Prisma Client
npm run db:generate

# Aplicar schema (dev)
npm run db:push

# Crear migración (prod)
npm run db:migrate

# Abrir Prisma Studio (GUI)
npm run db:studio

# Seed data (opcional)
npm run db:seed
```

## 📂 Estructura Clave

```
cobrolox/
├── app/
│   ├── customer/              # Gestión de clientes
│   ├── payments/              # Gestión de pagos
│   │   └── installments/      # Vista de cuotas
│   ├── settings/              # Configuraciones
│   │   └── payments/          # Config métodos de pago
│   ├── examples/              # Ejemplos de uso
│   └── api/                   # API Routes
│       ├── customers/
│       ├── payments/
│       └── payment-methods/
│
├── components/
│   ├── layout/                # AppLayout, AppSidebar
│   ├── ui/                    # 50+ shadcn components
│   ├── dialogs/               # Diálogos CRUD
│   │   ├── customer/
│   │   ├── payments/
│   │   └── settings/
│   ├── forms/                 # Formularios reutilizables
│   │   ├── customer/
│   │   ├── payments/
│   │   └── fields/            # Campos específicos (address, RUT, etc.)
│   └── summarys/              # Cards de resumen
│
├── lib/
│   ├── format.ts              # formatCurrency, formatNumber, formatDate
│   ├── regiones-chile.ts      # Regiones y comunas
│   ├── rut-validations.ts     # Validación RUT
│   ├── business-logic/        # Lógica de negocio (payments, installments)
│   ├── validations/           # Schemas Zod
│   └── transformers/          # Transformadores de datos
│
├── prisma/
│   └── schema.prisma          # Schema de DB (Customer, Payment, etc.)
│
└── docs/
    └── template/              # Documentación del template
```

## 🎨 Próximos Pasos

### 1. Implementar Invoice System

```typescript
// prisma/schema.prisma
model Invoice {
  id            String   @id @default(uuid())
  invoiceNumber String   @unique
  customerId    String
  amount        Decimal  @db.Decimal(12, 2)
  currency      String   @default("CLP")
  issueDate     DateTime
  dueDate       DateTime
  statusId      String
  customer      Customer @relation(...)
  status        InvoiceStatus @relation(...)
  allocations   PaymentAllocation[]
  // ... más campos
}

model InvoiceStatus {
  id        String    @id @default(uuid())
  name      String    @unique
  order     Int
  colorId   String
  isInitial Boolean   @default(false)
  isFinal   Boolean   @default(false)
  invoices  Invoice[]
  color     BadgeColor @relation(...)
}

model PaymentAllocation {
  id              String  @id @default(uuid())
  paymentId       String
  invoiceId       String
  allocatedAmount Decimal @db.Decimal(12, 2)
  payment         Payment  @relation(...)
  invoice         Invoice  @relation(...)
  @@unique([paymentId, invoiceId])
}
```

### 2. Crear CRUD de Invoices

Copiar estructura de `app/customer/` como referencia:

- `app/invoices/page.tsx` - DataTable
- `app/invoices/columns.tsx` - Definición columnas
- `app/api/invoices/route.ts` - GET, POST
- `app/api/invoices/[id]/route.ts` - GET, PUT, DELETE
- `components/dialogs/invoices/` - Diálogos CRUD
- `components/forms/invoices/` - Formularios

### 3. Implementar Payment → Invoice Allocation

Ya tienes la lógica base en:

- `components/dialogs/payments/payment-to-customer-dialog.tsx` (referencia 1:1)
- Adaptar para 1:N usando selección múltiple de invoices

## 🧪 Testing

```bash
npm test                # Vitest
npm test:ui             # UI interactiva
npm test:coverage       # Coverage report
npm run lint            # ESLint
npm run typecheck       # TypeScript check
```

## 📚 Documentación

Ver carpeta `docs/template/` para:

- [Architecture Overview](docs/template/architecture/overview.md)
- [Component Guides](docs/template/components/)
- [Testing Strategy](docs/template/methodology/testing.md)
- [ADRs (Decisiones Arquitecturales)](docs/template/decisions/)

## 🇨🇱 Características Chile-Específicas

- ✅ Validación RUT con `rut.js`
- ✅ Regiones y comunas de Chile
- ✅ Input telefónico formato chileno (+56)
- ✅ Moneda CLP por defecto
- ✅ Formato de direcciones chilenas (calle, departamento, comuna, región)

## ⚙️ Stack Tecnológico

- **Next.js 15.5.6** - React framework
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component system
- **Prisma 6.7** - ORM
- **Neon PostgreSQL** - Database
- **Vitest** - Testing
- **Playwright** - E2E testing

## 📝 Licencia

Este template es opensource. Ver [LICENSE](LICENSE).

---

**🚀 Base sólida para tu sistema de facturación en Chile**
