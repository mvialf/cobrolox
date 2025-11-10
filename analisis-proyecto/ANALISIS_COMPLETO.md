# Análisis Exhaustivo del Proyecto Cobrolox

**Fecha:** 10 de Noviembre, 2025  
**Versión del Proyecto:** 0.1.0  
**Stack:** Next.js 15 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Prisma + Neon

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Base de Datos & Modelos](#base-de-datos--modelos)
5. [Arquitectura de Componentes](#arquitectura-de-componentes)
6. [Sistema de Hooks & State Management](#sistema-de-hooks--state-management)
7. [API Routes](#api-routes)
8. [Patrones de Código](#patrones-de-código)
9. [Validaciones](#validaciones)
10. [Lógica de Negocio](#lógica-de-negocio)
11. [Testing](#testing)
12. [Configuraciones](#configuraciones)
13. [Inconsistencias & Issues](#inconsistencias--issues)
14. [Áreas de Optimización](#áreas-de-optimización)
15. [Recomendaciones](#recomendaciones)

---

## RESUMEN EJECUTIVO

### Estado General: ✅ BIEN ESTRUCTURADO

Cobrolox es un template SaaS especializado en facturación y cobros para Chile. Presenta una arquitectura sólida con:

- **Separación clara de concerns:** UI, business logic, API, database
- **TypeScript strict mode:** Garantiza type safety en todo el código
- **Testing integrado:** Vitest + Playwright + 376 tests
- **Código limpio:** ESLint + Prettier + enfoque en patrones reutilizables
- **Sistema de componentes:** 50+ UI components de shadcn/ui
- **Lógica regional chilena:** RUT, regiones, comunas integrados

### Características Principales

| Área                | Estado      | Descripción                                 |
| ------------------- | ----------- | ------------------------------------------- |
| Customer Management | ✅ Completo | CRUD + validación RUT + búsqueda            |
| Payment System      | ✅ Completo | Pagos + múltiples métodos + cuotas          |
| Settings System     | ✅ Completo | Configuración de payment methods            |
| Invoice System      | 🔄 Parcial  | Modelos creados, falta integración completa |
| Regional Chile      | ✅ Completo | RUT, regiones, comunas, teléfono            |
| Testing             | ✅ Robusto  | 376 tests, Vitest + Playwright              |
| Documentation       | ✅ Buena    | CLAUDE.md + comentarios inline              |
| Code Quality        | ✅ Buena    | ESLint + TypeScript strict + Prettier       |

---

## ESTRUCTURA DE CARPETAS

### Raíz del Proyecto

```
cobrolox/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   ├── customer/                 # Customer Management
│   ├── payments/                 # Payment Management
│   ├── invoice/                  # Invoice Management (new)
│   ├── settings/                 # Settings/Configuration
│   ├── import/                   # Data import page
│   ├── examples/                 # Demo/Example pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Dashboard
│   └── globals.css               # Global styles
│
├── components/                   # React Components (Client-side)
│   ├── ui/                       # shadcn/ui components (50+)
│   ├── layout/                   # Layout components
│   ├── dialogs/                  # Modal dialogs
│   ├── forms/                    # Form components
│   ├── tables/                   # Table components
│   ├── data-table/               # DataTable abstraction
│   ├── cells/                    # Table cell renderers
│   ├── summarys/                 # Summary/info cards
│   ├── import/                   # Import components
│   ├── custom/                   # Custom components
│   ├── settings/                 # Settings UI
│   ├── providers/                # Context providers
│   └── theme-provider.tsx        # Theme configuration
│
├── hooks/                        # Custom React Hooks
│   ├── queries/                  # React Query hooks
│   │   ├── use-customers.ts
│   │   ├── use-payments.ts
│   │   ├── use-invoices.ts
│   │   ├── use-installments.ts
│   │   └── __tests__/
│   ├── use-mobile.ts             # Mobile detection
│   ├── use-debounce.ts           # Debounce utility
│   ├── use-toast.ts              # Toast notifications
│   ├── use-rut-input.ts          # RUT input handling
│   ├── use-payments.ts           # Payment state
│   ├── use-configuration.ts      # Config context
│   ├── use-todo-list.ts          # Todo example
│   └── __tests__/
│
├── lib/                          # Utilities & Business Logic
│   ├── business-logic/           # Core business logic
│   │   ├── customer-balance.ts   # Balance calculations
│   │   ├── payment-fifo.ts       # FIFO payment allocation
│   │   ├── invoice-status.ts     # Invoice status logic
│   │   ├── installments.ts       # Installment logic
│   │   ├── totals.ts             # Summary calculations
│   │   ├── project-balance.ts    # Legacy (deprecated)
│   │   └── __tests__/
│   ├── validations/              # Zod schemas
│   │   ├── customer-validations.ts
│   │   ├── payment-validations.ts
│   │   ├── invoice-validations.ts
│   │   ├── payment-method-validations.ts
│   │   └── ...
│   ├── transformers/             # Data transformation
│   │   ├── payment-transformers.ts
│   │   └── __tests__/
│   ├── utils/                    # Utility functions
│   │   ├── invoice-utils.ts
│   │   └── __tests__/
│   ├── import/                   # Import utilities
│   │   ├── excel-parser.ts
│   │   ├── customer-import.ts
│   │   └── invoice-import.ts
│   ├── constants/                # Constants
│   │   ├── financial-constants.ts
│   │   ├── invoice-status-constants.ts
│   │   ├── payment-constants.ts
│   │   └── table-config.ts
│   ├── types/                    # Custom types
│   │   └── payment.types.ts
│   ├── contexts/                 # React contexts
│   │   └── configuration-context.tsx
│   ├── db.ts                     # Prisma client singleton
│   ├── logger.ts                 # Pino structured logger
│   ├── format.ts                 # Formatting utilities
│   ├── rut-validations.ts        # RUT validation logic
│   ├── regiones-chile.ts/.json   # Chilean regions
│   ├── paises-config.ts          # Regional config
│   ├── utils.ts                  # General utilities
│   └── __tests__/
│
├── prisma/                       # Database Schema
│   ├── schema.prisma             # Data models
│   ├── seed.ts                   # Database seeding
│   └── migrations/               # Database migrations
│
├── scripts/                      # Utility scripts
│   ├── verify-installments-db.ts
│   ├── analyze-installments.ts
│   └── recalculate-all-customer-balances.ts
│
├── tests/                        # End-to-end tests
│   └── playwright/
│
├── public/                       # Static assets
│
├── docs/                         # Documentation
│   ├── template/                 # Template docs
│   └── project/                  # Project docs
│
├── types/                        # Global TypeScript types
│
├── Configuration Files
│   ├── tsconfig.json             # TypeScript config
│   ├── next.config.mjs           # Next.js config
│   ├── tailwind.config.ts        # Tailwind config
│   ├── postcss.config.mjs        # PostCSS config
│   ├── eslint.config.mjs         # ESLint config
│   ├── vitest.config.mts         # Vitest config
│   ├── playwright.config.ts      # Playwright config
│   ├── components.json           # shadcn/ui config
│   └── vercel.json               # Vercel config
│
└── Configuration Files (Root)
    ├── .env.example              # Environment template
    ├── .env.local                # Local environment (gitignored)
    ├── package.json              # Dependencies
    ├── package-lock.json         # Lock file
    ├── .gitignore                # Git ignore rules
    └── CLAUDE.md                 # Claude instructions
```

---

## STACK TECNOLÓGICO

### Framework & Runtime

| Tecnología     | Versión           | Propósito                   |
| -------------- | ----------------- | --------------------------- |
| **Next.js**    | 15.5.6            | Framework React con SSR/SSG |
| **React**      | 19.2.0            | UI library                  |
| **TypeScript** | 5.x               | Type safety                 |
| **Node.js**    | 20+ (recomendado) | Runtime                     |

### UI & Styling

| Tecnología         | Versión | Propósito                          |
| ------------------ | ------- | ---------------------------------- |
| **Tailwind CSS**   | 4.1.9   | Utility-first CSS                  |
| **shadcn/ui**      | Latest  | Component library (50+)            |
| **Radix UI**       | ^1.x    | Headless components                |
| **Lucide Icons**   | 0.546.0 | Icon library                       |
| **Tailwind Merge** | 2.5.5   | Merge conflicting Tailwind classes |

### Database & ORM

| Tecnología     | Versión | Propósito                 |
| -------------- | ------- | ------------------------- |
| **Prisma**     | 6.7.0   | ORM + Database migrations |
| **Neon**       | -       | PostgreSQL hosting        |
| **PostgreSQL** | 13+     | Database                  |

### State Management & Data Fetching

| Tecnología                 | Versión | Propósito               |
| -------------------------- | ------- | ----------------------- |
| **React Query (TanStack)** | 5.90.5  | Server state management |
| **React Hook Form**        | 7.60.0  | Form state management   |
| **Zod**                    | 3.25.76 | Schema validation       |
| **Sonner**                 | 1.7.4   | Toast notifications     |

### Tables & Data Display

| Tecnología         | Versión | Propósito              |
| ------------------ | ------- | ---------------------- |
| **TanStack Table** | 8.21.3  | Headless table library |
| **Recharts**       | 2.15.4  | Chart library          |

### Forms & Inputs

| Tecnología                   | Versión | Propósito         |
| ---------------------------- | ------- | ----------------- |
| **React Hook Form**          | 7.60.0  | Form management   |
| **React Number Format**      | 5.4.4   | Number formatting |
| **React Phone Number Input** | 3.4.12  | Phone input       |
| **Input OTP**                | 1.4.1   | OTP input         |
| **Day Picker**               | 9.8.0   | Date picker       |

### Chilean Features

| Tecnología              | Versión | Propósito               |
| ----------------------- | ------- | ----------------------- |
| **rut.js**              | 2.1.0   | RUT validation          |
| **regiones-chile.json** | Custom  | Regions & communes data |

### Drag & Drop

| Tecnología  | Versión           | Propósito             |
| ----------- | ----------------- | --------------------- |
| **dnd-kit** | 6.3.1 + utilities | Drag and drop library |

### Import/Export

| Tecnología | Versión | Propósito          |
| ---------- | ------- | ------------------ |
| **xlsx**   | 0.18.5  | Excel file parsing |

### Logging

| Tecnología      | Versión | Propósito               |
| --------------- | ------- | ----------------------- |
| **Pino**        | 10.1.0  | Structured JSON logging |
| **Pino Pretty** | 13.1.2  | Pretty log output (dev) |

### Testing

| Tecnología          | Versión | Propósito               |
| ------------------- | ------- | ----------------------- |
| **Vitest**          | 1.6.0   | Unit tests              |
| **Playwright**      | 1.56.1  | E2E tests               |
| **Testing Library** | 16.2.0  | React component testing |
| **JSDOM**           | 27.0.0  | DOM simulation          |

### Development Tools

| Tecnología   | Versión | Propósito           |
| ------------ | ------- | ------------------- |
| **ESLint**   | 9.17.0  | Code linting        |
| **Prettier** | 3.6.2   | Code formatting     |
| **Knip**     | 5.66.4  | Find unused code    |
| **TSX**      | 4.19.4  | TypeScript executor |

### Other Libraries

| Tecnología           | Versión | Propósito           |
| -------------------- | ------- | ------------------- |
| **Embla Carousel**   | 8.5.1   | Carousel component  |
| **Geist**            | 1.3.1   | Fonts (Vercel)      |
| **date-fns**         | 4.1.0   | Date utilities      |
| **clsx**             | 2.1.1   | Conditional classes |
| **cmdk**             | 1.1.1   | Command menu        |
| **vaul**             | 1.1.2   | Drawer component    |
| **next-themes**      | 0.4.6   | Theme management    |
| **Vercel Analytics** | 1.3.1   | Analytics           |

### Development Dependencies

- **@types/node**: 22.x - Node.js types
- **@types/react**: 19.x - React types
- **@vitejs/plugin-react**: 5.0.4 - Vite React plugin

---

## BASE DE DATOS & MODELOS

### Prisma Schema Actual

**Ubicación:** `/home/mau/programas/Cobrolox/prisma/schema.prisma`

#### Modelos Implementados (12)

##### 1. **User** (Core)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([email])
}
```

- Propósito: Usuarios del sistema
- Relaciones: Ninguna (standalone)
- Índices: email

##### 2. **Customer** (Core Business)

```prisma
model Customer {
  id               String    @id @default(uuid())
  rut              String    @unique
  razonSocial      String
  tradeName        String?
  businessActivity String?
  contact          String
  phone            String
  email            String?
  street           String
  apartment        String?
  region           String
  comuna           String

  # Financial Denormalization (Performance)
  balanceTotal     Decimal   @default(0) @db.Decimal(12, 2)
  balanceVigente   Decimal   @default(0) @db.Decimal(12, 2)
  balanceVencido   Decimal   @default(0) @db.Decimal(12, 2)

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  payments         Payment[]
  invoices         Invoice[]

  @@index([rut])
  @@index([razonSocial])
  @@index([email])
  @@index([balanceTotal])
  @@index([balanceVencido])
}
```

- Propósito: Clientes de la aplicación
- Relaciones: 1:N con Payment e Invoice
- Campos especiales:
  - RUT único (validado en app)
  - Tres columnas de balance para performance (denormalizadas)
  - Índices en campos frecuentemente consultados

##### 3. **BadgeColor** (System)

```prisma
model BadgeColor {
  id                      String                  @id @default(uuid())
  name                    String                  @unique
  key                     String                  @unique
  bgClass                 String
  textClass               String                  @default("text-white")
  order                   Int                     @default(0)
  isActive                Boolean                 @default(true)
  createdAt               DateTime                @default(now())
  updatedAt               DateTime                @updatedAt

  invoiceStatuses         InvoiceStatus[]
  paymentInvoiceStatuses  PaymentInvoiceStatus[]

  @@index([order])
  @@index([isActive])
}
```

- Propósito: Sistema reusable de colores para badges
- Relaciones: 1:N con InvoiceStatus y PaymentInvoiceStatus
- Ejemplo: `{ name: "Pagado", bgClass: "bg-green-100", textClass: "text-green-800" }`

##### 4. **PaymentMethod** (Payment System)

```prisma
model PaymentMethod {
  id              String    @id @default(uuid())
  name            String    @unique
  active          Boolean   @default(true)
  order           Int       @default(0)
  icon            String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  hasInstallments Boolean   @default(false)
  maxInstallments Int?
  payments        Payment[]

  @@index([active, order])
}
```

- Propósito: Tipos de pago (Efectivo, Transferencia, Tarjeta, etc.)
- Relaciones: 1:N con Payment
- Campos especiales:
  - `hasInstallments`: Si soporta cuotas
  - `maxInstallments`: Máximo de cuotas

##### 5. **Payment** (Payment System)

```prisma
model Payment {
  id                   String              @id @default(uuid())
  amount               Decimal             @db.Decimal(12, 2)
  currency             String
  date                 DateTime
  reference            String?
  notes                String?
  customerId           String
  paymentMethodId      String
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  selectedInstallments Int?
  type                 String              @default("Invoice")

  installments         Installment[]
  customer             Customer            @relation(fields: [customerId], references: [id])
  paymentMethod        PaymentMethod       @relation(fields: [paymentMethodId], references: [id])
  allocations          PaymentAllocation[]

  @@index([customerId])
  @@index([paymentMethodId])
  @@index([date])
  @@index([type])
  @@index([type, date(sort: Desc)])
}
```

- Propósito: Registros de pagos
- Relaciones: N:1 con Customer, N:1 con PaymentMethod, 1:N con Installment, N:M con Invoice
- Campos especiales:
  - `type`: "Invoice" (directo a factura) o "Customer" (general)
  - `selectedInstallments`: Si se dividió en cuotas

##### 6. **Installment** (Cuotas)

```prisma
model Installment {
  id                String    @id @default(uuid())
  paymentId         String
  installmentNumber Int
  amount            Decimal   @db.Decimal(12, 2)
  dueDate           DateTime
  paidDate          DateTime?
  status            String    @default("pending")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  payment           Payment   @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@index([status, dueDate])
}
```

- Propósito: Cuotas desglosadas de un pago
- Relaciones: N:1 con Payment (cascada)
- Campos especiales:
  - `status`: "pending", "paid", "overdue"
  - `paidDate`: Cuándo se pagó (null si pendiente)

##### 7. **InvoiceStatus** (Invoice Workflow)

```prisma
model InvoiceStatus {
  id        String      @id @default(uuid())
  name      String      @unique
  order     Int         @default(0)
  colorId   String
  isInitial Boolean     @default(false)
  isFinal   Boolean     @default(false)
  isActive  Boolean     @default(true)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  color     BadgeColor  @relation(fields: [colorId], references: [id])
  invoices  Invoice[]

  @@index([isActive, order])
  @@index([colorId])
}
```

- Propósito: Estados de facturas (Borrador, Emitida, Vencida, etc.)
- Relaciones: N:1 con BadgeColor, 1:N con Invoice
- Campos especiales:
  - `isInitial`: Estado inicial de factura
  - `isFinal`: Estado terminal (no puede cambiar después)

##### 8. **PaymentInvoiceStatus** (Invoice Payment Tracking)

```prisma
model PaymentInvoiceStatus {
  id        String      @id @default(uuid())
  name      String      @unique
  order     Int         @default(0)
  colorId   String
  isInitial Boolean     @default(false)
  isFinal   Boolean     @default(false)
  isActive  Boolean     @default(true)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  color     BadgeColor  @relation(fields: [colorId], references: [id])
  invoices  Invoice[]

  @@index([isActive, order])
  @@index([colorId])
}
```

- Propósito: Estados de pago de facturas (Sin pagar, Parcialmente pagada, Pagada)
- Relaciones: N:1 con BadgeColor, 1:N con Invoice
- Similar a InvoiceStatus pero enfocado en el estado de pago

##### 9. **Invoice** (Core Business - NEW)

```prisma
model Invoice {
  id                       String                @id @default(uuid())
  invoiceNumber            String                @unique
  customerId               String
  subtotal                 Decimal               @db.Decimal(12, 2)
  taxAmount                Decimal               @db.Decimal(12, 2)
  total                    Decimal               @db.Decimal(12, 2)
  currency                 String                @default("CLP")
  issueDate                DateTime              @default(now())
  dueDate                  DateTime
  invoiceStatusId          String
  paymentInvoiceStatusId   String
  notes                    String?
  createdAt                DateTime              @default(now())
  updatedAt                DateTime              @updatedAt

  customer                 Customer              @relation(fields: [customerId], references: [id])
  invoiceStatus            InvoiceStatus         @relation(fields: [invoiceStatusId], references: [id])
  paymentInvoiceStatus     PaymentInvoiceStatus  @relation(fields: [paymentInvoiceStatusId], references: [id])
  allocations              PaymentAllocation[]

  @@index([customerId])
  @@index([invoiceStatusId])
  @@index([paymentInvoiceStatusId])
  @@index([issueDate])
  @@index([dueDate])
  @@index([invoiceNumber])
}
```

- Propósito: Facturas (reemplaza el viejo modelo Project)
- Relaciones: N:1 con Customer, N:1 con InvoiceStatus, N:1 con PaymentInvoiceStatus, 1:N con PaymentAllocation
- Campos especiales:
  - Dos estados: invoiceStatus (administrativo) + paymentInvoiceStatus (financiero)
  - Dos índices de fecha para queries por rango

##### 10. **PaymentAllocation** (Payment Distribution)

```prisma
model PaymentAllocation {
  id              String   @id @default(uuid())
  paymentId       String
  invoiceId       String
  allocatedAmount Decimal  @db.Decimal(12, 2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  payment         Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  invoice         Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@index([invoiceId])
}
```

- Propósito: Relación N:M entre Payment e Invoice (FIFO allocation)
- Relaciones: N:1 con Payment (cascada), N:1 con Invoice (cascada)
- Propósito: Un pago puede asignarse a múltiples facturas, una factura puede recibir pagos de múltiples payments

### Estrategia de Índices

**Índices Implementados:**

- **Customer**: rut, razonSocial, email, balanceTotal, balanceVencido
- **Payment**: customerId, paymentMethodId, date, type, (type + date desc)
- **Installment**: paymentId, (status + dueDate)
- **Invoice**: customerId, invoiceStatusId, paymentInvoiceStatusId, issueDate, dueDate, invoiceNumber
- **PaymentAllocation**: paymentId, invoiceId
- **BadgeColor**: order, isActive
- **PaymentMethod**: (active + order)
- **InvoiceStatus**: (isActive + order), colorId
- **PaymentInvoiceStatus**: (isActive + order), colorId

**Justificación:**

- Foreign keys: Siempre indexados (búsquedas JOIN)
- Campos únicos: Siempre indexados (velocidad)
- Campos filtrados frecuentemente: Indexados
- Campos en WHERE + ORDER BY: Índices compuestos
- Campos de estado + fecha: Índices compuestos (queries frecuentes)

### Decimals vs Floats

Todas las cantidades monetarias usan `@db.Decimal(12, 2)`:

- 12 dígitos totales, 2 decimales
- Rango: -9,999,999.99 a 9,999,999.99 CLP
- Previene errores de punto flotante

### Denormalización Estratégica

La tabla **Customer** tiene tres columnas de balance calculadas y almacenadas:

```typescript
balanceTotal; // Suma de todos los balances de facturas
balanceVigente; // Suma de balance de facturas no vencidas
balanceVencido; // Suma de balance de facturas vencidas
```

**Razón:** Evitar queries complejas en páginas principales que muestran listados de clientes.

**Mantenimiento:** Función `recalculateCustomerBalances()` actualiza estas columnas después de:

- Crear/modificar invoice
- Crear/modificar payment allocation
- Batch job nocturno

---

## ARQUITECTURA DE COMPONENTES

### Estructura Jerárquica

```
AppLayout (Client)
├── AppSidebar
│   └── SidebarNav
└── SidebarInset
    ├── PageHeader
    │   ├── Breadcrumbs
    │   ├── Title + Description
    │   └── Action Button(s)
    └── Content Area
        ├── DataTable
        │   └── DataTableRowActions
        ├── Dialog
        │   └── Form
        └── Summary Cards
```

### Componentes Principales

#### Layout System (2 componentes)

**1. AppLayout** (`/components/layout/app-layout.tsx`)

- Wrapper principal de toda la app
- Props: pageTitle, pageDescription, breadcrumbs, action, children
- Usa SidebarProvider + SidebarInset
- Cliente: Todas las páginas principales

```tsx
<AppLayout
  pageTitle="Clientes"
  pageDescription="Gestiona tus clientes"
  breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Clientes" }]}
  action={<NewCustomerDialog />}
>
  <DataTable ... />
</AppLayout>
```

**2. PageHeader** (`/components/layout/page-header.tsx`)

- Muestra título, descripción, breadcrumbs, y botón de acción
- Props: title, description, breadcrumbs, action
- Responsive (texto recortado en móvil)

#### Data Display Components

**3. DataTable** (`/components/data-table/data-table.tsx`)

- Abstracción de TanStack Table
- Props: columns, data, searchKey, searchPlaceholder, meta
- Features:
  - Búsqueda en tiempo real
  - Sorting por columnas
  - Paginación
  - Selección de filas
  - Acciones por fila (editar, eliminar)
- Uso: Clientes, Pagos, Facturas

**4. Invoice Table** (`/components/tables/invoice-table.tsx`)

- Tabla especializada para facturas
- Muestra: número, cliente, estado, monto, fecha

#### Dialog Components (CRUD)

**Customer Dialogs** (`/components/dialogs/customer/`)

- `NewCustomerDialog` - Crear cliente
- `EditCustomerDialog` - Editar cliente
- `CustomerAccountDialog` - Ver detalles
- `ConfirmDeleteDialog` - Confirmar eliminación

**Payment Dialogs** (`/components/dialogs/payments/`)

- `PaymentDetailsDialog` - Ver detalles de pago
- `PaymentToInvoiceDialog` - Pago directo a factura
- `PaymentToCustomerDialog` - Pago a cliente (asignación manual)

**Invoice Dialogs** (`/components/dialogs/invoice/`)

- `NewInvoiceDialog` - Crear factura
- `EditInvoiceDialog` - Editar factura

**Settings Dialogs** (`/components/dialogs/settings/`)

- `PaymentMethodDialog` - Agregar/editar método de pago

#### Form Components

**Customer Form** (`/components/forms/customer/customer-form.tsx`)

- Reutilizable para crear y editar
- Validación con Zod
- Campos:
  - RUT (con validación chilena)
  - Razón social
  - Nombre de fantasía (opcional)
  - Contacto
  - Teléfono
  - Email (opcional)
  - Dirección (calle, región, comuna)

**Payment Forms** (`/components/forms/payments/`)

- `PaymentToCustomerForm` - Pago con asignación manual
- `PaymentToInvoiceForm` - Pago directo a factura

**Invoice Form** (`/components/forms/invoice/invoice-form.tsx`)

- Campos: Cliente, número, subtotal, IVA, total, fecha emisión, fecha vencimiento, estado

**Form Fields** (`/components/forms/fields/`)

- `address-fields.tsx` - Región + Comuna (cascada)
- `customer-fields.tsx` - Búsqueda de cliente
- `invoice-fields.tsx` - Campos de factura
- `payment-amount-date-fields.tsx` - Monto + fecha
- `payment-method-fields.tsx` - Selector de método de pago
- `contact-fields.tsx` - Nombre + teléfono

#### Summary Components (`/components/summarys/`)

**CustomerNameSummary** - Muestra cliente con RUT + teléfono  
**InvoiceStatusBadge** - Badge coloreado del estado  
**PaymentSummaryCard** - Resumen total pagado/pendiente  
**PaymentProgressSummary** - Barra de progreso de pagos

#### Cell Components (`/components/cells/`)

**InvoiceDueDateCell** - Formatea fecha de vencimiento con color (vigente/vencida)

Estos se usan en columnas de DataTable.

#### shadcn/ui Components (50+)

**UI Base:**

- Button, Input, Label, Checkbox, Radio, Select, Switch, Tabs, Accordion
- Dialog, AlertDialog, Popover, Tooltip, DropdownMenu, ContextMenu
- Sheet (drawer), Carousel, AspectRatio, Avatar, Badge
- Card, Separator, ScrollArea, Progress, Slider

**Forms:**

- Form (react-hook-form integration)
- FormField, FormItem, FormLabel, FormControl, FormMessage

**Navegación:**

- Sidebar, Navigation Menu, Breadcrumb
- Menubar, Tabs

**Notificaciones:**

- Toast (Sonner) - Toasts configurables
- Alert - Mensajes de alerta

**Otros:**

- Calendar (date picker)
- Combobox (búsqueda con dropdown)
- Command (paleta de comandos)
- Resizable Panels (layouts flexibles)

### Patrones de Componentes

#### Pattern 1: Dialog + Form (Create/Edit)

```tsx
// Dialog wrapper
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nuevo Cliente</DialogTitle>
    </DialogHeader>
    <CustomerForm
      onSuccess={() => setOpen(false)}
      data={editData}
    />
  </DialogContent>
</Dialog>

// Form component (reutilizable)
export function CustomerForm({ onSuccess, data }) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: data || {},
  });

  const { mutate } = useCreateCustomer();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutate(values))}>
        <FormField name="rut" ... />
        {/* ... más campos */}
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}
```

**Ventajas:**

- Formulario reutilizable para crear y editar
- Separación entre dialog (UI) y form (lógica)
- Hook para mutación centralizado

#### Pattern 2: DataTable + Row Actions

```tsx
// Columns definition
const columns: ColumnDef<Customer>[] = [
  { accessorKey: "rut", header: "RUT" },
  { accessorKey: "razonSocial", header: "Razón Social" },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        onEdit={() => setEditData(row.original)}
        onDelete={() => deleteCustomer(row.original.id)}
      />
    ),
  },
];

// Page component
export default function CustomersPage() {
  const { data, isLoading } = useCustomers();

  return (
    <AppLayout pageTitle="Clientes" action={<NewCustomerDialog />}>
      <DataTable
        columns={columns}
        data={data?.customers || []}
        searchKey="cliente"
        meta={{ handleDelete, onCustomerUpdated }}
      />
    </AppLayout>
  );
}
```

**Ventajas:**

- Columns definidas declarativamente
- Row actions genéricas (edit, delete, view)
- Integración con React Query para refetch automático

#### Pattern 3: Search Field (Combobox)

```tsx
// CustomerSearchField - autocomplete con API
<Combobox
  options={suggestions}
  value={selectedId}
  onChange={setSelectedId}
  placeholder="Buscar cliente..."
/>

// Integración con form
<FormField
  name="customerId"
  render={({ field }) => (
    <CustomerSearchField
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

**Ventajas:**

- Búsqueda en tiempo real
- Debounce automático
- Integración con React Query

#### Pattern 4: Summary Cards

```tsx
export function PaymentProgressSummary({ payment }) {
  const { allocatedTotal, pendingAmount, percentage } = useMemo(...)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignación de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressBar value={percentage} />
        <p>Asignado: ${allocatedTotal}</p>
        <p>Pendiente: ${pendingAmount}</p>
      </CardContent>
    </Card>
  );
}
```

**Ventajas:**

- Resumen visual de datos
- Reutilizable en múltiples contextos
- Cálculos con useMemo

---

## SISTEMA DE HOOKS & STATE MANAGEMENT

### Arquitectura General

```
React Query (Server State)
    ↓
Custom Hooks (useCustomers, usePayments, etc.)
    ↓
React Components (Client)
```

**State Management Strategy:**

- **Server State:** React Query (datos de API)
- **Form State:** React Hook Form + Zod
- **UI State:** useState (modales, búsqueda)
- **Global State:** Context (configuración)

### React Query Hooks

**Ubicación:** `/hooks/queries/`

#### 1. useCustomers

```typescript
export function useCustomers(params: CustomersQueryParams = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async () => {
      const response = await fetch(`/api/customers?...`);
      return response.json() as Promise<CustomersResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

**Features:**

- Paginación (page, limit)
- Búsqueda (search)
- Caching automático
- Refetch en window focus

**Mutations:**

```typescript
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
```

#### 2. usePayments

```typescript
export function usePayments(params: PaymentsQueryParams = {}) {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: async () => {
      // GET /api/payments?customer=...&type=...
    },
  });
}
```

**Features:**

- Filtro por cliente (customerId)
- Filtro por tipo (Invoice, Customer)
- Ordenamiento por fecha

#### 3. useInvoices

```typescript
export function useInvoices(params: InvoicesQueryParams = {}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      // GET /api/invoices?customer=...&status=...
    },
  });
}
```

**Features:**

- Filtro por cliente
- Filtro por estado (pendiente, pagado, vencido)
- Balance calculado por factura

#### 4. useInstallments

```typescript
export function useInstallments(paymentId?: string) {
  return useQuery({
    queryKey: ["installments", paymentId],
    queryFn: async () => {
      // GET /api/installments?payment=...
    },
    enabled: !!paymentId,
  });
}
```

**Features:**

- Query solo si paymentId está disponible
- Agrupa por estado (pending, paid, overdue)

### Custom Hooks (Utilities)

**Ubicación:** `/hooks/`

#### useMobile

```typescript
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
```

**Uso:** Mostrar/ocultar sidebar en móvil

#### useDebounce

```typescript
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Uso:** Búsqueda con delay

#### useToast

```typescript
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    loading: (message: string) => toast.loading(message),
  };
}
```

**Nota:** Usa Sonner bajo el capó

#### useRutInput

```typescript
export function useRutInput() {
  const [rut, setRut] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^0-9K-]/g, ""); // Solo números y K

    // Formatear: 12.345.678-9
    if (value.length > 2) {
      const cleaned = value.replace(/\D/g, "");
      value = `${cleaned.slice(0, -1).replace(/\B/g, ".")}-${cleaned.slice(-1)}`;
    }

    setRut(value);
  };

  return { rut, handleChange };
}
```

**Uso:** Input de RUT con formateo automático

#### usePayments (State Hook)

```typescript
export function usePayments() {
  const [paymentType, setPaymentType] = useState<"Invoice" | "Customer">(
    "Invoice",
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return {
    paymentType,
    setPaymentType,
    selectedCustomer,
    setSelectedCustomer,
    selectedInvoice,
    setSelectedInvoice,
  };
}
```

**Nota:** Diferentes a usePayments (query hook)

#### useConfiguration

```typescript
export function useConfiguration() {
  return useContext(ConfigurationContext);
}
```

**Proporciona:**

- Lista de métodos de pago
- Configuración de estados
- Settings globales

### Context API

**Ubicación:** `/lib/contexts/configuration-context.tsx`

```typescript
type ConfigurationContextType = {
  paymentMethods: PaymentMethod[];
  invoiceStatuses: InvoiceStatus[];
  paymentInvoiceStatuses: PaymentInvoiceStatus[];
  badgeColors: BadgeColor[];
  isLoading: boolean;
};

export const ConfigurationContext =
  createContext<ConfigurationContextType | null>(null);

export function ConfigurationProvider({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ["configuration"],
    queryFn: async () => {
      // Fetch de multiple endpoints
      const [paymentMethods, statuses, ...] = await Promise.all([...])
      return { paymentMethods, statuses, ... }
    },
  });

  return (
    <ConfigurationContext.Provider value={data || initialData}>
      {children}
    </ConfigurationContext.Provider>
  );
}
```

**Uso:** Evitar prop drilling de configuración en toda la app

---

## API ROUTES

### Estructura de API

```
app/api/
├── customers/
│   ├── route.ts          # GET, POST (list, create)
│   ├── list/
│   │   └── route.ts      # GET (list simple sin paginación)
│   ├── [id]/
│   │   └── route.ts      # GET, PUT, DELETE (single customer)
│   └── [id]/
│       └── route.ts
├── invoices/
│   ├── route.ts          # GET, POST
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
├── payments/
│   ├── route.ts          # GET, POST
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
├── installments/
│   └── route.ts          # GET
├── payment-methods/
│   ├── route.ts          # GET, POST
│   ├── [id]/
│   │   ├── route.ts      # GET, PUT, DELETE
│   │   └── toggle/
│   │       └── route.ts  # PATCH (toggle active)
├── payment-invoice-statuses/
│   └── route.ts          # GET, POST
├── invoice-statuses/
│   └── route.ts          # GET, POST
├── badge-colors/
│   └── route.ts          # GET
├── import/
│   ├── customers/
│   │   └── route.ts      # POST (bulk import)
│   └── invoices/
│       └── route.ts      # POST (bulk import)
├── cron/
│   └── mark-installments-paid/
│       └── route.ts      # POST (job scheduler)
└── users/
    └── route.ts          # GET, POST, PUT
```

### Patrón de API Routes

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withLogging } from "@/lib/logger-middleware";
import type { NextRequest } from "next/server";

/**
 * GET /api/customers
 *
 * Obtiene lista de clientes con paginación
 *
 * Query params:
 *   - page: número de página (default: 1)
 *   - limit: registros por página (default: undefined = todos)
 *   - search: término de búsqueda
 */
export const GET = withLogging(async (request, logger) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = searchParams.get("limit")
    ? Math.min(parseInt(searchParams.get("limit")!), 10000)
    : undefined;
  const search = searchParams.get("search") || "";

  logger.debug(
    {
      page,
      limit: limit ?? "unlimited",
      search: search || undefined,
    },
    "Fetching customers",
  );

  try {
    const where = search
      ? {
          OR: [
            { razonSocial: { contains: search, mode: "insensitive" as const } },
            { rut: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { contact: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const skip = limit ? (page - 1) * limit : 0;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    logger.info(
      {
        found: customers.length,
        total,
        page,
      },
      "Customers fetched successfully",
    );

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit: limit ?? total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching customers");
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/customers
 *
 * Crea un nuevo cliente
 *
 * Body: CustomerFormData (ver validations)
 */
export const POST = withLogging(async (request, logger) => {
  const body = await request.json();

  logger.debug({ data: body }, "Creating customer");

  try {
    // 1. Validar con Zod
    const parsed = customerSchema.parse(body);

    // 2. Verificar RUT único
    const existing = await prisma.customer.findUnique({
      where: { rut: parsed.rut },
    });

    if (existing) {
      logger.warn({ rut: parsed.rut }, "RUT already exists");
      return NextResponse.json({ error: "El RUT ya existe" }, { status: 400 });
    }

    // 3. Crear cliente
    const customer = await prisma.customer.create({
      data: parsed,
    });

    logger.info({ customerId: customer.id }, "Customer created successfully");

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ errors: error.errors }, "Validation error");
      return NextResponse.json(
        { error: "Validación fallida", errors: error.errors },
        { status: 400 },
      );
    }

    logger.error({ err: error }, "Error creating customer");
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 },
    );
  }
});
```

### Patrones Comunes

#### Error Handling

- Validación con Zod
- Mensajes de error descriptivos
- Códigos HTTP correctos (400, 404, 500)
- Logging con contexto

#### Paginación

- Query params: page, limit
- Response: { data, pagination: { page, limit, total, totalPages } }
- Límite máximo: 10000 registros por página

#### Búsqueda (Search)

- Query param: search
- Búsqueda multi-campo (OR)
- Insensitivo a mayúsculas

#### Logging

- `withLogging` wrapper middleware
- Contexto: queryParams, request body (sin sensibles)
- Niveles: debug, info, warn, error

### Middleware de Logging

```typescript
export function withLogging(
  handler: (request: NextRequest, logger: Logger) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    const requestId = generateRequestId();
    const requestLogger = logger.child({ requestId });

    const startTime = Date.now();
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    requestLogger.info({ method, pathname }, "Request started");

    try {
      const response = await handler(request, requestLogger);
      const duration = Date.now() - startTime;

      requestLogger.info(
        {
          status: response.status,
          duration,
          method,
          pathname,
        },
        "Request completed",
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      requestLogger.error(
        { err: error, duration, method, pathname },
        "Request failed",
      );

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
```

---

## PATRONES DE CÓDIGO

### Pattern 1: Server Components First

```tsx
// ✅ BUENO: Server Component
export default async function CustomersPage() {
  // Puede acceder a base de datos directamente
  const customers = await prisma.customer.findMany();

  return (
    <ClientWrapper>
      <ServerData data={customers} />
    </ClientWrapper>
  );
}

// ✅ BUENO: Client Component (cuando necesita interactividad)
("use client");
function ClientWrapper({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        ...
      </Dialog>
    </div>
  );
}
```

**Beneficio:** Mejor performance, menos JS en cliente, mejor SEO

### Pattern 2: Extract When It Hurts (>10 líneas)

```tsx
// ❌ MALO: Componente largo
function CustomerForm() {
  // 80 líneas aquí...
  return ...
}

// ✅ BUENO: Separar en componentes
function CustomerForm() {
  return (
    <FormContainer>
      <AddressFields />
      <ContactFields />
      <SubmitButton />
    </FormContainer>
  );
}

function AddressFields() {
  // 20 líneas de direcciones
}

function ContactFields() {
  // 15 líneas de contacto
}
```

### Pattern 3: Data Down, Events Up

```tsx
// ✅ BUENO: Props unidireccionales
interface CustomerFormProps {
  defaultValues?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
}

export function CustomerForm({ defaultValues, onSubmit }: CustomerFormProps) {
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(formData);
      }}
    >
      ...
    </form>
  );
}

// Uso
<CustomerForm
  defaultValues={customer}
  onSubmit={(data) => updateCustomer(data)}
/>;
```

### Pattern 4: Zod Validation

```tsx
// 1. Definir schema
export const customerSchema = z.object({
  rut: z.string().refine((val) => rutHelpers.validate(val)),
  razonSocial: z.string().min(2),
  email: z.string().email().optional(),
  // ...
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// 2. Usar en formulario
const form = useForm<CustomerFormData>({
  resolver: zodResolver(customerSchema),
  defaultValues: {},
});

// 3. Usar en API
export const POST = async (request) => {
  const body = await request.json();
  const parsed = customerSchema.parse(body); // Throws ZodError

  // Lógica segura aquí
};
```

### Pattern 5: React Query Mutations

```tsx
// Hook
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(`Cliente ${data.razonSocial} creado`);
    },
    onError: (error) => {
      toast.error("Error al crear cliente");
    },
  });
}

// Uso
const { mutate, isPending } = useCreateCustomer();

<form
  onSubmit={(e) => {
    e.preventDefault();
    mutate(formData);
  }}
>
  <button disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</button>
</form>;
```

### Pattern 6: FIFO Allocation

```tsx
// Lógica de distribución de pagos
export function calculateFIFO(totalAmount: number, invoices: Invoice[]) {
  const sorted = [...invoices].sort(
    (a, b) => a.issueDate.getTime() - b.issueDate.getTime(),
  );

  const allocations: FIFOAllocation[] = [];
  let remaining = totalAmount;

  for (const invoice of sorted) {
    if (invoice.balance <= 0) continue;

    const allocated = Math.min(invoice.balance, remaining);

    allocations.push({
      invoiceId: invoice.id,
      allocatedAmount: allocated,
      isFullyPaid: allocated >= invoice.balance,
    });

    if (allocated > 0) {
      remaining -= allocated;
    }
  }

  return allocations;
}
```

**Uso:**

1. Usuario selecciona método de FIFO
2. Sistema calcula allocations automáticamente
3. Usuario revisa y confirma
4. Se crea Payment con PaymentAllocation(s)

### Pattern 7: Denormalized Balance Storage

```tsx
// Después de cualquier cambio en invoices/payments
async function recalculateCustomerBalances(customerId: string) {
  // 1. Obtener todas las facturas del cliente
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    include: { allocations: true },
  });

  // 2. Calcular balance por factura
  let balanceTotal = 0;
  let balanceVigente = 0;
  let balanceVencido = 0;

  for (const invoice of invoices) {
    const balance = invoice.total - sumAllocations(invoice.allocations);
    if (balance <= 0) continue;

    balanceTotal += balance;

    if (invoice.dueDate < now) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  // 3. Actualizar columnas denormalizadas
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      balanceTotal,
      balanceVigente,
      balanceVencido,
    },
  });
}
```

**Llamar después de:**

- Crear/modificar Invoice
- Crear/modificar PaymentAllocation
- Batch job nocturno

---

## VALIDACIONES

### Validación de RUT

**Ubicación:** `/lib/rut-validations.ts`

```typescript
import RUT from "rut.js";
import { z } from "zod";

export const rutSchema = z
  .string()
  .min(1, "El RUT es obligatorio")
  .refine((value) => RUT.validate(value), "RUT inválido");

export const rutHelpers = {
  format: (rut: string): string => RUT.format(rut), // "12.345.678-9"
  clean: (rut: string): string => RUT.clean(rut), // "123456789"
  validate: (rut: string): boolean => RUT.validate(rut),
  getCheckDigit: (rut: string): string => RUT.getCheckDigit(rut),
};
```

**Uso:**

```tsx
<FormField
  name="rut"
  render={({ field }) => (
    <Input
      {...field}
      placeholder="12.345.678-9"
      onChange={(e) => field.onChange(rutHelpers.format(e.target.value))}
    />
  )}
/>
```

### Validación de Clientes

**Ubicación:** `/lib/validations/customer-validations.ts`

```typescript
export const customerSchema = z.object({
  rut: z
    .string()
    .min(1, "El RUT es requerido")
    .refine((val) => rutHelpers.validate(val), "RUT inválido"),

  razonSocial: z
    .string()
    .min(2, "La razón social debe tener al menos 2 caracteres"),

  tradeName: z.string().optional().or(z.literal("")),
  businessActivity: z.string().optional().or(z.literal("")),

  contact: z
    .string()
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres"),

  phone: z.string().min(1, "El teléfono es requerido"),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .optional()
    .or(z.literal("")),

  street: z.string().min(3, "La calle debe tener al menos 3 caracteres"),

  apartment: z.string().optional().or(z.literal("")),
  region: z.string().min(1, "La región es requerida"),
  comuna: z.string().min(1, "La comuna es requerida"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
```

### Validación de Pagos

**Ubicación:** `/lib/validations/payment-validations.ts`

```typescript
// Schema para asignación individual
export const paymentAllocationSchema = z.object({
  invoiceId: z.string().uuid("ID de factura inválido"),
  allocatedAmount: z.coerce
    .number()
    .positive("El monto debe ser mayor a 0")
    .multipleOf(0.01, "El monto debe tener máximo 2 decimales"),
});

// Schema para pago a factura individual
export const paymentToInvoiceSchema = z.object({
  invoiceId: z.string({ required_error: "Debe seleccionar una factura" }),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  paymentMethodId: z.string({ required_error: "Seleccione un método de pago" }),
  date: z.coerce.date(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  selectedInstallments: z.coerce.number().optional(),
});

// Schema para pago a cliente (múltiples facturas)
export const paymentToCustomerSchema = z.object({
  customerId: z.string({ required_error: "Seleccione un cliente" }),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  paymentMethodId: z.string({ required_error: "Seleccione un método de pago" }),
  date: z.coerce.date(),
  allocations: z
    .array(paymentAllocationSchema)
    .min(1, "Asigne al menos una factura"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
```

### Validación de Facturas

**Ubicación:** `/lib/validations/invoice-validations.ts`

```typescript
export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "El número de factura es requerido"),
  customerId: z.string().uuid("Cliente inválido"),
  subtotal: z.coerce.number().positive("El subtotal debe ser positivo"),
  taxAmount: z.coerce.number().nonnegative("El IVA no puede ser negativo"),
  total: z.coerce.number().positive("El total debe ser positivo"),
  currency: z.string().default("CLP"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  notes: z.string().optional(),
});
```

### Validación de Métodos de Pago

**Ubicación:** `/lib/validations/payment-method-validations.ts`

```typescript
export const paymentMethodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  active: z.boolean().default(true),
  order: z.number().int().nonnegative(),
  icon: z.string().optional(),
  hasInstallments: z.boolean().default(false),
  maxInstallments: z.number().int().positive().optional(),
});
```

---

## LÓGICA DE NEGOCIO

### 1. Cálculo de Balances de Clientes

**Ubicación:** `/lib/business-logic/customer-balance.ts`

```typescript
export async function recalculateCustomerBalances(
  customerId: string,
): Promise<CustomerBalanceResult> {
  // 1. Verificar existencia
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) throw new Error(`Customer not found: ${customerId}`);

  // 2. Obtener facturas con allocations
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    select: {
      id: true,
      total: true,
      dueDate: true,
      allocations: { select: { allocatedAmount: true } },
    },
  });

  // 3. Calcular balances
  const now = new Date();
  let balanceTotal = 0;
  let balanceVigente = 0;
  let balanceVencido = 0;

  for (const invoice of invoices) {
    const total = Number(invoice.total);
    const paidAmount = invoice.allocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocatedAmount),
      0,
    );
    const balance = total - paidAmount;

    if (balance <= 0) continue;

    balanceTotal += balance;

    const isOverdue = isAfter(now, invoice.dueDate);
    if (isOverdue) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  // 4. Actualizar Customer
  await prisma.customer.update({
    where: { id: customerId },
    data: { balanceTotal, balanceVigente, balanceVencido },
  });

  return { balanceTotal, balanceVigente, balanceVencido };
}
```

**Diagrama:**

```
Invoices
  │
  ├─ Inv A: total=1000, paid=300 → balance=700
  ├─ Inv B: total=500, paid=500 → balance=0 (skip)
  └─ Inv C: total=800, paid=200 → balance=600

Results:
  balanceTotal   = 700 + 600 = 1300
  balanceVigente = 700 (dueDate > now) = 700
  balanceVencido = 600 (dueDate < now) = 600
```

**Cuándo llamar:**

- POST /api/invoices
- PUT /api/invoices/[id]
- DELETE /api/invoices/[id]
- POST /api/payments (después de crear allocations)
- Batch job nocturno (pasar de vigente → vencido)

### 2. Distribución FIFO de Pagos

**Ubicación:** `/lib/business-logic/payment-fifo.ts`

```typescript
export function calculateFIFO(
  totalAmount: number,
  invoices: InvoiceWithBalance[],
): FIFOAllocation[] {
  // 1. Ordenar por fecha de emisión (más vieja primero)
  const sorted = [...invoices].sort(
    (a, b) => a.issueDate.getTime() - b.issueDate.getTime(),
  );

  const allocations: FIFOAllocation[] = [];
  let remaining = totalAmount;

  // 2. Asignar monto a cada factura
  for (const invoice of sorted) {
    // Skip si ya está pagada
    if (invoice.balance <= 0) continue;

    // Asignar el menor entre balance pendiente y dinero restante
    const allocated = remaining > 0 ? Math.min(invoice.balance, remaining) : 0;

    allocations.push({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      balance: invoice.balance,
      allocatedAmount: allocated,
      isFullyPaid: allocated >= invoice.balance,
    });

    // Restar del total disponible
    if (allocated > 0) {
      remaining -= allocated;
    }
  }

  return allocations;
}
```

**Ejemplo:**

```
Input:
  totalAmount = 500,000
  invoices = [
    { id: 'INV-1', issueDate: '2025-01-01', balance: 300,000 },
    { id: 'INV-2', issueDate: '2025-02-01', balance: 400,000 },
    { id: 'INV-3', issueDate: '2025-03-01', balance: 200,000 },
  ]

Output:
  [
    { invoiceId: 'INV-1', allocatedAmount: 300,000, isFullyPaid: true },
    { invoiceId: 'INV-2', allocatedAmount: 200,000, isFullyPaid: false },
    { invoiceId: 'INV-3', allocatedAmount: 0, isFullyPaid: false },
  ]
```

**Validación:** `validateAllocationsSum(totalAmount, allocations)` verifica que suma = totalAmount (tolerancia: 0.01)

### 3. Manejo de Cuotas (Installments)

**Ubicación:** `/lib/business-logic/installments.ts`

```typescript
export function generateInstallments(
  paymentAmount: number,
  numberOfInstallments: number,
  paymentDate: Date,
  installmentDays: number = 30,
): Installment[] {
  const installmentAmount = paymentAmount / numberOfInstallments;
  const installments: Installment[] = [];

  for (let i = 1; i <= numberOfInstallments; i++) {
    const dueDate = new Date(paymentDate);
    dueDate.setDate(dueDate.getDate() + installmentDays * i);

    installments.push({
      installmentNumber: i,
      amount: installmentAmount,
      dueDate,
      status: "pending",
    });
  }

  return installments;
}
```

**Flujo:**

1. Usuario crea pago con 3 cuotas
2. Sistema genera 3 Installment records (pending)
3. Cron job verifica diariamente cuotas vencidas
4. Marca como overdue si paidDate is null y dueDate < now
5. Usuario marca manualmente como paid

### 4. Cálculo de Totales

**Ubicación:** `/lib/business-logic/totals.ts`

```typescript
export function calculateInvoiceTotals(
  subtotal: number,
  taxRate: number = 0.19, // IVA Chile
): { subtotal: number; taxAmount: number; total: number } {
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
```

### 5. Status Workflow

**Ubicación:** `/lib/business-logic/invoice-status.ts`

```typescript
// Estados de factura
export const INVOICE_STATUSES = {
  DRAFT: "Borrador", // isInitial: true
  ISSUED: "Emitida", // isInitial: false
  OVERDUE: "Vencida", // isInitial: false
  PAID: "Pagada", // isFinal: true
  CANCELLED: "Anulada", // isFinal: true
};

// Estados de pago
export const PAYMENT_STATUSES = {
  UNPAID: "Sin pagar", // isInitial: true
  PARTIALLY_PAID: "Pagada Parcialmente",
  PAID: "Pagada", // isFinal: true
  OVERDUE: "Vencida",
};

// Transiciones válidas
export function canTransitionStatus(
  from: string,
  to: string,
  statusConfig: InvoiceStatus[],
): boolean {
  const fromStatus = statusConfig.find((s) => s.name === from);
  const toStatus = statusConfig.find((s) => s.name === to);

  // No puedes salir de un estado final
  if (fromStatus?.isFinal) return false;

  // Validar transición específica según reglas de negocio
  // (puede variar por cliente)

  return true;
}
```

---

## TESTING

### Cobertura de Tests

**Total:** 376 tests funcionando

**Distribución:**

- Unit Tests (Vitest): ~280 tests
- E2E Tests (Playwright): ~50 tests
- Integration Tests: ~46 tests

### Unit Tests (Vitest)

**Ubicación:** `/lib/__tests__/`, `/hooks/__tests__/`, `/components/__tests__/`

**Ejemplos:**

1. **Format Tests** (`/lib/__tests__/format.test.ts`)

```typescript
describe("formatCurrency", () => {
  it("formats CLP without decimals", () => {
    expect(formatCurrency(1234.56, "CLP")).toBe("$1.235");
  });

  it("formats USD with decimals", () => {
    expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
  });
});

describe("formatDate", () => {
  it("formats date in short format", () => {
    const result = formatDate("2025-01-15", "short", "es-CL");
    expect(result).toBe("15/01/2025");
  });

  it("formats date in long format", () => {
    const result = formatDate("2025-01-15", "long", "es-CL");
    expect(result).toContain("15");
    expect(result).toContain("enero");
  });
});
```

2. **Customer Balance Tests** (`/lib/business-logic/__tests__/customer-balance.test.ts`)

```typescript
describe("recalculateCustomerBalances", () => {
  it("calculates balance correctly with multiple invoices", async () => {
    // Setup: crear cliente + facturas
    const customer = await createTestCustomer();
    const inv1 = await createTestInvoice(customer.id, 1000);
    const inv2 = await createTestInvoice(customer.id, 500);

    // Crear allocations
    await createAllocation(inv1.id, 300);
    await createAllocation(inv2.id, 200);

    // Execute
    const result = await recalculateCustomerBalances(customer.id);

    // Assert
    expect(result.balanceTotal).toBe(1000);
    expect(result.balanceVigente).toBe(1000); // Sin vencer
  });

  it("skips invoices with zero balance", async () => {
    const customer = await createTestCustomer();
    const inv = await createTestInvoice(customer.id, 1000);
    await createAllocation(inv.id, 1000); // Pagada completamente

    const result = await recalculateCustomerBalances(customer.id);

    expect(result.balanceTotal).toBe(0);
  });
});
```

3. **FIFO Tests** (`/lib/business-logic/__tests__/payment-fifo.test.ts`)

```typescript
describe("calculateFIFO", () => {
  it("allocates payment to oldest invoice first", () => {
    const invoices = [
      {
        id: "inv3",
        issueDate: new Date("2025-03-01"),
        balance: 200,
      },
      {
        id: "inv1",
        issueDate: new Date("2025-01-01"),
        balance: 300,
      },
      {
        id: "inv2",
        issueDate: new Date("2025-02-01"),
        balance: 400,
      },
    ];

    const result = calculateFIFO(500, invoices);

    // inv1 (oldest) gets 300, inv2 gets 200
    expect(result[0].invoiceId).toBe("inv1");
    expect(result[0].allocatedAmount).toBe(300);
    expect(result[1].invoiceId).toBe("inv2");
    expect(result[1].allocatedAmount).toBe(200);
  });
});
```

### Integration Tests

**Ejemplo:** POST /api/customers

```typescript
describe("POST /api/customers", () => {
  it("creates a customer successfully", async () => {
    const res = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        rut: "12.345.678-9",
        razonSocial: "ACME Corp",
        contact: "Juan Pérez",
        phone: "+56912345678",
        street: "Av. Libertad 1234",
        region: "Región Metropolitana",
        comuna: "Santiago",
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.rut).toBe("12345678-9");
    expect(data.razonSocial).toBe("ACME Corp");
  });

  it("rejects duplicate RUT", async () => {
    // Crear primero
    await createCustomer("12.345.678-9", "ACME 1");

    // Intentar crear duplicado
    const res = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        rut: "12.345.678-9",
        razonSocial: "ACME 2",
        // ...
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("RUT ya existe");
  });

  it("validates required fields", async () => {
    const res = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify({
        // Falta rut, razonSocial, etc.
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Validación fallida");
  });
});
```

### E2E Tests (Playwright)

**Ubicación:** `/tests/playwright/`

```typescript
import { test, expect } from "@playwright/test";

test("create customer flow", async ({ page }) => {
  // 1. Navegar a customers
  await page.goto("/customer");
  await expect(page).toHaveTitle(/Clientes/);

  // 2. Abrir dialog de nuevo cliente
  await page.click('button:has-text("Nuevo Cliente")');
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // 3. Llenar formulario
  await page.fill('input[name="rut"]', "12.345.678-9");
  await page.fill('input[name="razonSocial"]', "ACME Corp");
  await page.fill('input[name="contact"]', "Juan Pérez");
  await page.fill('input[name="phone"]', "+56912345678");

  // 4. Enviar
  await page.click('button:has-text("Guardar")');

  // 5. Verificar éxito
  await expect(page.locator("text=Cliente creado")).toBeVisible();
  await expect(page.locator("text=ACME Corp")).toBeVisible();
});

test("search customer", async ({ page }) => {
  // 1. Ir a customers
  await page.goto("/customer");

  // 2. Buscar
  await page.fill('input[placeholder*="Buscar"]', "ACME");

  // 3. Esperar resultados
  await page.waitForTimeout(300); // debounce
  await expect(page.locator("text=ACME")).toBeVisible();
});

test("edit customer", async ({ page }) => {
  // Setup: crear cliente
  const customer = await createTestCustomer();

  // 1. Ir a customers
  await page.goto("/customer");

  // 2. Abrir menú de acciones
  await page.click(`button[title="Acciones para ${customer.rut}"]`);

  // 3. Click en editar
  await page.click("text=Editar");

  // 4. Cambiar datos
  await page.fill('input[name="razonSocial"]', "ACME Corp Nuevo");

  // 5. Guardar
  await page.click('button:has-text("Guardar")');

  // 6. Verificar cambio
  await expect(page.locator("text=ACME Corp Nuevo")).toBeVisible();
});
```

### Configuración Vitest

**Ubicación:** `/vitest.config.mts`

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", ".next"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### Configuración Playwright

**Ubicación:** `/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## CONFIGURACIONES

### TypeScript Config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "target": "ES6",
    "strict": true, // Activado: máxima seguridad de tipos
    "noEmit": true, // Solo type-check, no emit JS
    "jsx": "preserve", // Para Next.js
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"] // Path alias
    }
  }
}
```

**Strict mode habilitado:** Fuerza type safety máximo

### ESLint Config (`eslint.config.mjs`)

```javascript
const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    plugins: ["prettier", "unused-imports"],
    rules: {
      "prettier/prettier": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error", // Autofix
      "unused-imports/no-unused-vars": ["warn", {...}],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  }),
];
```

**Reglas importantes:**

- `unused-imports`: Autofix para imports no usados
- `no-explicit-any`: Advertencia (permitido pero no recomendado)
- `exhaustive-deps`: Previene bugs en hooks

### Tailwind Config (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./components/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Colores custom
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### Next.js Config (`next.config.mjs`)

```javascript
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Fail on lint errors
  },
  typescript: {
    ignoreBuildErrors: false, // Fail on type errors
  },
  images: {
    unoptimized: true, // TODO: Configure CDN for production
  },
};
```

### Prisma Config (`prisma/schema.prisma`)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Preview features:**

- `relationJoins`: Mejor performance para JOINs

---

## INCONSISTENCIAS & ISSUES

### 🔴 INCONSISTENCIAS ENCONTRADAS

#### 1. Duplicación de Hooks de Pagos

**Problema:** Hay dos archivos diferentes con la misma funcionalidad

- `/hooks/use-payments.ts` - Hook de estado para payment form
- `/hooks/queries/use-payments.ts` - Hook de React Query

**Impacto:** Confusión al importar

**Solución recomendada:**

```typescript
// /hooks/use-payments.ts (renombrar a use-payment-form.ts)
export function usePaymentForm() {
  // Estado del formulario de pago
}

// /hooks/queries/use-payments.ts (mantener)
export function usePayments(params?) {
  // React Query para pagos
}
```

#### 2. Código Legacy No Removido

**Problema:** Existen referencias al viejo modelo "Project"

- `/lib/business-logic/project-balance.ts` - DEPRECATED pero aún presente
- Algunos comentarios mencionan "Project" en lugar de "Invoice"

**Impacto:** Confusión al entender la lógica

**Solución:** Remover `/lib/business-logic/project-balance.ts` completamente

#### 3. Inconsistencia en Nombres de Modelos

| Entidad       | Ubicación | Naming              |
| ------------- | --------- | ------------------- |
| Customer      | Schema ✅ | Singular correcto   |
| Invoice       | Schema ✅ | Singular correcto   |
| Payment       | Schema ✅ | Singular correcto   |
| BadgeColor    | Schema ❌ | Debería ser "Badge" |
| PaymentMethod | Schema ✅ | Compound correcto   |

**Problema:** BadgeColor usa compound name innecesario

**Solución:** Podría renombrarse a `Badge` (pero requiere migración)

#### 4. Falta Validación en Algunas APIs

**Problema:** Algunos endpoints no validan entrada con Zod

- POST /api/badge-colors sin validación explícita
- Algunos endpoints opcionalmente validan

**Solución:** Crear validations para todos los schemas

#### 5. Inconsistencia en Error Handling

**Problema:** Algunos handlers usan `try-catch`, otros no validan ZodError

```typescript
// ❌ MALO: No captura ZodError
const body = await request.json();
const parsed = schema.parse(body); // Puede lanzan error no manejado

// ✅ BUENO:
try {
  const parsed = schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ errors: error.errors }, { status: 400 });
  }
}
```

#### 6. Balance Denormalization No Sincronizado

**Problema:** Las tres columnas de balance en Customer se actualizan manualmente

**Riesgo:** Si `recalculateCustomerBalances()` no se llama después de cada operación, quedan desincronizadas

**Solución:**

- Usar database triggers (si Neon lo soporta)
- O mejor: Crear middleware/hook que siempre recalcula
- O: Usar stored procedures

---

### 🟡 WARNINGS & AREAS DE RIESGO

#### 1. Logging de Pino Deshabilitado

**Ubicación:** `/lib/logger.ts` línea 96

```typescript
// Pretty-print DESHABILITADO temporalmente (Next.js 15 incompatibilidad)
```

**Riesgo:** No puedes ver logs bonitos en desarrollo

**Solución:** Usar `console.log` como fallback o resolver incompatibilidad con Next.js 15

#### 2. Paginación Sin Límite

**Ubicación:** `/app/api/customers/route.ts`

```typescript
// Si limit=0 o no especificado, retorna todos los registros
const limit = limitParam === "0" || !limitParam ? undefined : ...;
```

**Riesgo:** Con 1 millón de clientes, puede causar timeout

**Solución:** Siempre imponer un máximo (ej: 1000 si no especificado)

#### 3. Falta Autenticación

**Problema:** NO hay autenticación implementada

- Cualquier usuario puede acceder a `/api/customers`
- No hay usuario logueado
- User model existe pero no se usa

**Solución urgente:** Implementar autenticación (Next.js Auth, Clerk, Auth0, etc.)

#### 4. Falta Rate Limiting

**Problema:** No hay rate limiting en APIs

- Alguien podría hacer DoS fácilmente
- Bulk import sin límite de registros

**Solución:** Implementar rate limiting middleware

#### 5. CORS No Configurado

**Problema:** No hay CORS configurado

**Riesgo:** Frontend en otro dominio no funcionaría

**Solución:** Agregar middleware CORS si es necesario

#### 6. Variables de Entorno Incompletas

**Problema:** `.env.example` no tiene todas las variables

```bash
# Falta:
LOG_LEVEL=debug
NODE_ENV=development
```

**Solución:** Completar `.env.example`

---

## ÁREAS DE OPTIMIZACIÓN

### 1. Performance

#### Query Optimization

```typescript
// ❌ MALO: N+1 queries
const customers = await prisma.customer.findMany();
for (const customer of customers) {
  const payments = await prisma.payment.findMany({
    where: { customerId: customer.id },
  });
}

// ✅ BUENO: Single query con include
const customers = await prisma.customer.findMany({
  include: {
    payments: {
      take: 10,
      orderBy: { date: "desc" },
    },
  },
});
```

#### Caching Strategy

```typescript
// Implementar caching para configuración estática
const paymentMethods = await prisma.paymentMethod.findMany({
  where: { active: true },
});

// Cachear en memoria durante 5 minutos
const cacheKey = `payment-methods-${new Date().getHours()}`;
cache.set(cacheKey, paymentMethods, 5 * 60 * 1000);
```

#### Pagination Optimization

```typescript
// Actualmente: Retorna todos si no especifica limit
// Mejor: Siempre paginar, máximo 1000
const take = Math.min(limit || 100, 1000);
```

### 2. Code Quality

#### Reducir Duplicación

- Consolidar `usePayments` y `use-payment-form.ts`
- Consolidar validations (algunos campos repetidos)

#### Aumentar Cobertura de Tests

- Tests para API routes (falta)
- Tests para componentes UI (falta)
- Tests para transformers (parcial)

#### Mejorar Documentación

- Adicionar JSDoc a funciones complejas
- Documentar API responses en comentarios
- Crear diagrama de flujos

### 3. Database

#### Agregar Análisis de Queries

```sql
-- Identificar queries lentas
EXPLAIN ANALYZE
SELECT c.*, COUNT(p.id) as payment_count
FROM customers c
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.id;
```

#### Considerar Particionamento

Para millones de registros, particionar Invoices por fecha

#### Denormalization Review

- balanceTotal, balanceVigente, balanceVencido están bien
- Considerar: cache de "últimos 5 pagos por cliente"

### 4. Security

#### Implementar Autenticación

```typescript
// Middleware de autenticación
export async function authenticate(request: NextRequest) {
  const token = request.headers.get("authorization");
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Validar token
  const user = await validateToken(token);
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return user;
}
```

#### Row-Level Security

```typescript
// Asegurar que un usuario solo vea sus propios datos
export async function getCustomersSafe(userId: string) {
  return prisma.customer.findMany({
    where: {
      userId, // Filtrar por usuario
    },
  });
}
```

#### Validar Permisos

```typescript
// Verificar que el usuario puede editar este cliente
export async function updateCustomerSafe(
  customerId: string,
  userId: string,
  data: CustomerFormData,
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (customer.userId !== userId) {
    throw new Error("Unauthorized");
  }

  return prisma.customer.update({
    where: { id: customerId },
    data,
  });
}
```

#### SQL Injection Prevention

- ✅ Implementado: Prisma ORM previene por default

#### XSS Prevention

- ✅ Implementado: React escapa HTML por default
- Verificar en casos de contenido renderizado manualmente

### 5. Features Pendientes

#### Invoices (Parcial)

- Modelo creado ✅
- API routes creadas ✅
- UI pages falta ✅
- Integración con pagos falta ✅

#### Reporting

- Dashboard con gráficos de ingresos
- Reporte de clientes morosos
- Proyecciones de flujo de caja

#### Búsqueda Avanzada

- Filtros por rango de fechas
- Filtros por estado
- Búsqueda full-text

#### Exportación

- Exportar a Excel
- Exportar a PDF
- Enviar por email

#### Integración con Terceros

- Integración bancaria (transferencias)
- Integración con sistemas contables
- Webhooks para eventos

---

## RECOMENDACIONES

### 🎯 RECOMENDACIONES CRÍTICAS (Implementar primero)

#### 1. Agregar Autenticación

**Prioridad:** 🔴 CRÍTICA  
**Esfuerzo:** 2-3 días  
**Beneficio:** Seguridad

```typescript
// Opción 1: NextAuth.js
npm install next-auth

// Opción 2: Clerk
npm install @clerk/nextjs

// Opción 3: Auth0
npm install @auth0/nextjs-auth0
```

**Plan:**

- Agregar tabla User con autenticación
- Crear Customer.userId foreign key
- Filtrar por userId en todas las queries
- Proteger rutas públicas

#### 2. Resolver Duplicación de Hooks

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 30 minutos  
**Beneficio:** Claridad

```bash
# Renombrar
mv hooks/use-payments.ts hooks/use-payment-form.ts

# Actualizar imports en toda la app
```

#### 3. Remover Código Legacy

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 15 minutos  
**Beneficio:** Mantenibilidad

```bash
# Remover archivos deprecated
rm lib/business-logic/project-balance.ts

# Buscar referencias a "Project"
grep -r "Project" app/ lib/ components/ --include="*.ts" --include="*.tsx"
```

#### 4. Completar Validaciones

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 2 horas  
**Beneficio:** Robustez

Crear validations para:

- BadgeColor
- InvoiceStatus
- PaymentInvoiceStatus
- Installment

#### 5. Implementar Rate Limiting

**Prioridad:** 🟡 MEDIA  
**Esfuerzo:** 3-4 horas  
**Beneficio:** Seguridad

```typescript
// Librería recomendada
npm install @vercel/og ratelimit

// Middleware
export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1 h"),
  });

  const { success } = await rateLimit.limit(ip);

  if (!success) {
    return new NextResponse("Rate limited", { status: 429 });
  }
}
```

### 🔧 RECOMENDACIONES IMPORTANTES (Próximas semanas)

#### 6. Completar Invoice System

**Prioridad:** 🟢 ALTA  
**Esfuerzo:** 3-4 días  
**Beneficio:** Core feature

- [ ] Crear página de facturas (CRUD)
- [ ] Integración con pagos (FIFO)
- [ ] Estados de factura (workflow)
- [ ] Validación de facturas duplicadas

#### 7. Mejorar Testing

**Prioridad:** 🟢 ALTA  
**Esfuerzo:** 4-5 días  
**Beneficio:** Confianza

- [ ] Tests para API routes (50+ tests)
- [ ] Tests para componentes (30+ tests)
- [ ] E2E tests para flujos críticos (20+ tests)
- [ ] Coverage target: 70%+

#### 8. Documentación API

**Prioridad:** 🔵 MEDIA  
**Esfuerzo:** 2 días  
**Beneficio:** Onboarding

Usar OpenAPI/Swagger:

```bash
npm install swagger-ui-react swagger-jsdoc
```

#### 9. Resolver Warnings de Logger

**Prioridad:** 🔵 MEDIA  
**Esfuerzo:** 1 día  
**Beneficio:** Developer experience

Soluciones:

- Actualizar Pino a versión compatible con Next.js 15
- O usar alternativa: winston, bunyan

#### 10. Completar `.env.example`

**Prioridad:** 🔵 MEDIA  
**Esfuerzo:** 15 minutos  
**Beneficio:** Setup simplificado

```bash
# .env.example
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NODE_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 📈 RECOMENDACIONES FUTURO (Roadmap)

#### 11. Dashboard con Gráficos

- Ingresos por mes (Recharts)
- Top 10 clientes por monto adeudado
- Distribución de estados de factura

#### 12. Reportes Avanzados

- Reporte de morosidad
- Proyección de flujo de caja
- Análisis de patrones de pago

#### 13. Búsqueda Full-Text

```typescript
// Usar pg_search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_customer_search ON customers USING gin (rut, rason_social, email gin_trgm_ops);
```

#### 14. Auditoría & Logs

- Registrar quién hizo qué cambio
- Timestamp en toda modificación
- Histórico de cambios por entidad

#### 15. Exportación & Reportes

- Exportar a Excel (xlsx)
- Exportar a PDF
- Envío automático de reportes por email

#### 16. Integración con Terceros

- Sync con sistema contable (Wenance, Binnacle)
- Integración bancaria (BancoEstado API)
- Webhooks para eventos

---

## CONCLUSIONES

### ✅ FORTALEZAS DEL PROYECTO

1. **Arquitectura sólida**
   - Separación clara de concerns
   - Patrones consistentes
   - Type safety con TypeScript

2. **Database bien modelada**
   - Esquema normalizado
   - Índices estratégicos
   - Denormalización consciente

3. **Testing robusto**
   - 376 tests funcionando
   - Cobertura de unit + integration + E2E
   - Testing library bien configurada

4. **Code quality**
   - ESLint + Prettier configurados
   - TypeScript strict mode
   - Logging estructurado

5. **Documentación**
   - CLAUDE.md excelente
   - Comentarios inline útiles
   - Ejemplos en código

### ⚠️ ÁREAS CRÍTICAS A RESOLVER

1. **Seguridad: Sin autenticación** (CRÍTICO)
2. **Duplicación de hooks** (Confusión)
3. **Código legacy sin remover** (Técnico debt)
4. **Sin rate limiting** (Vulnerabilidad)
5. **Invoice system incompleto** (Feature)

### 📊 RESUMEN EJECUTIVO

| Métrica       | Valor  | Evaluación       |
| ------------- | ------ | ---------------- |
| Modelos DB    | 12     | ✅ Completo      |
| API Routes    | 20+    | ✅ Robusto       |
| Componentes   | 50+    | ✅ Extenso       |
| Tests         | 376    | ✅ Excelente     |
| Type Safety   | Strict | ✅ Máximo        |
| Autenticación | ❌ No  | 🔴 FALTA         |
| Documentación | 7/10   | ✅ Buena         |
| Performance   | 7/10   | ⚠️ Optimizable   |
| Security      | 5/10   | 🔴 Requiere Auth |

### 🚀 NEXT STEPS

**Semana 1:**

- [ ] Implementar autenticación
- [ ] Resolver duplicación de hooks
- [ ] Agregar validations faltantes

**Semana 2-3:**

- [ ] Completar Invoice system
- [ ] Mejorar cobertura de tests
- [ ] Implementar rate limiting

**Semana 4+:**

- [ ] Documentación API
- [ ] Dashboard con gráficos
- [ ] Integración con terceros

---

**Fin del Análisis** 📊
