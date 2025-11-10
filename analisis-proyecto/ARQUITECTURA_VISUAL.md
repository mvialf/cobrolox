# Arquitectura Visual del Proyecto Cobrolox

## 1. DIAGRAMA DE CAPAS

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTACIÓN (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │ Components   │  │  UI Library  │      │
│  │   (App)      │  │  (Client)    │  │ (shadcn/ui)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┬─┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   APLICACIÓN (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React Query │  │  React Hook  │  │   Context    │      │
│  │  (Data)      │  │  Form (UI)   │  │   (Config)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┬─┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   API (Next.js Routes)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Customers  │  │  Payments    │  │  Invoices    │      │
│  │   /api/*     │  │   /api/*     │  │   /api/*     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┬─┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   LÓGICA DE NEGOCIO                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Balance    │  │    FIFO      │  │ Installment  │      │
│  │ Calculation  │  │ Allocation   │  │   Logic      │      │
│  │ (Validations)│  │ (Validations)│  │(Validations) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────────────────────────────┬─┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA ACCESS (ORM)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Prisma Client (Singleton)                   │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │        Schema & Migrations                  │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┬─┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Neon (Serverless PostgreSQL)                        │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │ │Customers │ │Invoices  │ │Payments  │              │  │
│  │ │          │ │          │ │          │              │  │
│  │ │Balance   │ │Status    │ │Methods   │              │  │
│  │ │denorm    │ │          │ │Installm. │              │  │
│  │ └──────────┘ └──────────┘ └──────────┘              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. FLUJO DE DATOS (Data Flow)

### Crear Cliente

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario                                                      │
│    └─ Completa formulario en NewCustomerDialog                │
│       └─ Validado con customerSchema (Zod)                    │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. useCreateCustomer() Mutation (React Query)                   │
│    └─ mutate(formData)                                          │
│       └─ POST /api/customers                                    │
│          └─ Body: formData                                      │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. API Handler (POST /api/customers)                            │
│    └─ Recibe JSON body                                          │
│       └─ Valida con customerSchema.parse()                      │
│          └─ Verifica RUT único en DB                            │
│             └─ prisma.customer.create()                         │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Prisma ORM                                                   │
│    └─ Traduce a SQL                                             │
│       └─ INSERT INTO customers (...)                            │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PostgreSQL Database                                          │
│    └─ Inserta row en tabla customers                            │
│       └─ Retorna customer con ID generado                       │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. API Response                                                 │
│    └─ NextResponse.json(customer, { status: 201 })              │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. React Query Mutation Success                                 │
│    └─ onSuccess callback                                        │
│       └─ queryClient.invalidateQueries(['customers'])           │
│          └─ toast.success('Cliente creado')                     │
│             └─ setOpen(false) // Cierra dialog                  │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI Update                                                    │
│    └─ useCustomers() query refetch automático                   │
│       └─ DataTable re-renderiza con nuevo cliente               │
│          └─ Usuario ve el cliente en la lista                   │
└─────────────────────────────────────────────────────────────────┘
```

### Crear Pago a Factura (FIFO)

```
┌──────────────────────────────────────────────────────────┐
│ 1. Usuario selecciona factura                            │
│    └─ Selecciona método de pago                          │
│       └─ Ingresa monto y fecha                           │
└─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│ 2. usePaymentForm Hook                                   │
│    └─ Valida con paymentToInvoiceSchema                  │
│       └─ Calcula allocations (FIFO)                      │
│          └─ calculateFIFO(amount, [selectedInvoice])     │
└─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│ 3. FIFO Logic (business-logic)                           │
│    └─ Ordena facturas por issueDate (vieja → nueva)      │
│       └─ Distribuye monto secuencialmente                │
│          └─ Retorna: [{ invoiceId, allocatedAmount }]    │
└─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Usuario revisa preview                                │
│    └─ Muestra cuales facturas se pagarán                 │
│       └─ Confirma o modifica manualmente                 │
│          └─ Envía: POST /api/payments                    │
└─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│ 5. API Handler (POST /api/payments)                      │
│    └─ Valida payload                                     │
│       └─ Verifica suma de allocations = amount           │
│          └─ prisma.payment.create() con allocations      │
│             └─ Crea Payment + N PaymentAllocation        │
└─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│ 6. Recalcular Balance del Cliente                        │
│    └─ recalculateCustomerBalances(customerId)            │
│       └─ Obtiene todas las facturas                      │
│          └─ Suma allocations pagadas                     │
│             └─ Calcula balanceTotal/Vigente/Vencido      │
│                └─ Actualiza columnas en Customer         │
└─────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────┐
│ 7. React Query Invalidates                               │
│    └─ ['payments'], ['invoices'], ['customers']          │
│       └─ Todos los datos se refetch automáticamente      │
│          └─ UI se actualiza con datos nuevos             │
└──────────────────────────────────────────────────────────┘
```

---

## 3. ESTRUCTURA DE COMPONENTES

### Árbol de Componentes (Customer Page)

```
CustomersPage (Server Component)
│
└─ AppLayout (Client Component)
   │
   ├─ AppSidebar
   │  └─ SidebarNav
   │     ├─ NavLink (Dashboard)
   │     ├─ NavLink (Clientes)
   │     ├─ NavLink (Pagos)
   │     ├─ NavLink (Facturas)
   │     └─ NavLink (Configuración)
   │
   ├─ SidebarInset
   │  │
   │  └─ PageHeader
   │     ├─ Breadcrumbs
   │     ├─ h1 (Title)
   │     ├─ p (Description)
   │     └─ NewCustomerDialog (Action)
   │
   └─ Content Area
      │
      ├─ useCustomers() Hook
      │  └─ React Query (GET /api/customers)
      │     └─ returns { customers, pagination }
      │
      └─ DataTable
         │
         ├─ SearchInput
         │  └─ useDebounce
         │     └─ Triggers search on /api/customers?search=
         │
         ├─ TableHeader
         │  ├─ RUT
         │  ├─ Razón Social
         │  ├─ Teléfono
         │  ├─ Balance Total
         │  └─ Balance Vencido
         │
         ├─ TableBody
         │  └─ TableRow (para cada customer)
         │     ├─ TableCell (RUT formateado)
         │     ├─ TableCell (razonSocial)
         │     ├─ TableCell (phone)
         │     ├─ TableCell (formatCurrency)
         │     ├─ TableCell (formatCurrency rojo si vencido)
         │     └─ DataTableRowActions
         │        ├─ EditCustomerDialog
         │        │  └─ CustomerForm (edit mode)
         │        ├─ CustomerAccountDialog
         │        │  └─ Ver detalles
         │        └─ ConfirmDeleteDialog
         │           └─ Delete mutation
         │
         └─ Pagination Controls
            ├─ Previous button
            ├─ Page numbers
            └─ Next button
```

### Customer Dialog + Form Hierarchy

```
NewCustomerDialog (Client)
│
├─ DialogContent
│  ├─ DialogHeader
│  │  └─ DialogTitle ("Nuevo Cliente")
│  │
│  ├─ DialogDescription
│  │
│  └─ CustomerForm
│     │
│     ├─ Form (react-hook-form)
│     │  └─ FormField[] (validación Zod)
│     │
│     ├─ FormField name="rut"
│     │  └─ RutInput
│     │     └─ useRutInput() Hook
│     │        └─ Formatea automáticamente
│     │
│     ├─ FormField name="razonSocial"
│     │  └─ Input
│     │
│     ├─ FormField name="contact"
│     │  └─ Input
│     │
│     ├─ FormField name="phone"
│     │  └─ PhoneInput
│     │
│     ├─ FormField name="email"
│     │  └─ Input (type="email")
│     │
│     ├─ AddressFields (Component reutilizable)
│     │  ├─ FormField name="street"
│     │  │  └─ Input
│     │  ├─ FormField name="region"
│     │  │  └─ Combobox (options: regiones-chile.json)
│     │  └─ FormField name="comuna"
│     │     └─ Combobox (cascada desde region)
│     │
│     └─ Button type="submit" (disabled={isPending})
│
└─ onSuccess Callback
   └─ Cierra dialog
      └─ React Query invalida ['customers']
         └─ toast.success()
```

---

## 4. FLUJO DE ESTADO (State Management)

### Customer Page State Flow

```
┌─────────────────────────────────────────┐
│  Server State (React Query)              │
│  ┌─────────────────────────────────────┐│
│  │ useCustomers()                      ││
│  │ - queryKey: ['customers', params]   ││
│  │ - staleTime: 5 min                  ││
│  │ - data: { customers, pagination }   ││
│  │ - isLoading, isError                ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │ ← Refetch en:
               │   - Window focus
               │   - Manual via invalidateQueries
               │   - Mutation success
               │
┌──────────────▼──────────────────────────┐
│  Form State (React Hook Form)            │
│  ┌─────────────────────────────────────┐│
│  │ useForm({ schema, defaultValues })  ││
│  │ - control                            ││
│  │ - formState: { errors, isDirty }    ││
│  │ - watch(), reset(), setValue()       ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  UI State (useState)                     │
│  ┌─────────────────────────────────────┐│
│  │ isEditDialogOpen: boolean            ││
│  │ editingCustomer?: Customer           ││
│  │ isDeleteConfirmOpen: boolean         ││
│  │ deletingCustomerId?: string          ││
│  │ searchQuery: string                  ││
│  │ currentPage: number                  ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Global State (Context)                  │
│  ┌─────────────────────────────────────┐│
│  │ ConfigurationContext                ││
│  │ - paymentMethods: PaymentMethod[]    ││
│  │ - invoiceStatuses: InvoiceStatus[]   ││
│  │ - badgeColors: BadgeColor[]          ││
│  │ - isLoading: boolean                 ││
│  └─────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

---

## 5. MODELO DE DATOS (Entity Relationship)

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ name            │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ (FUTURE: usersId FK)
         │
         ▼
┌──────────────────────────────────┐
│         Customer                  │
├──────────────────────────────────┤
│ id (PK)                          │
│ rut (UNIQUE)                     │
│ razonSocial                      │
│ tradeName                        │
│ businessActivity                 │
│ contact, phone, email            │
│ street, apartment, region, comuna│
│                                  │
│ balanceTotal (denorm)    ◄──┐    │
│ balanceVigente (denorm)  ◄──┤    │
│ balanceVencido (denorm)  ◄──┤    │
│ createdAt, updatedAt        │    │
└────────┬─────────────┬──────┘    │
         │             │           │
         │             └───────────┘
    1:N │                   ↑ (Recalculado por:
         │                   - Invoice create/delete
         │                   - PaymentAllocation change
         │
    ┌────▼──────────────┐   ┌────────────────────┐
    │    Invoice        │   │  PaymentMethod     │
    ├──────────────────┤   ├────────────────────┤
    │ id (PK)          │   │ id (PK)            │
    │ invoiceNumber    │   │ name (UNIQUE)      │
    │ customerId (FK)  │   │ active             │
    │ subtotal         │   │ order              │
    │ taxAmount        │   │ hasInstallments    │
    │ total            │   │ maxInstallments    │
    │ currency         │   │ createdAt, updated │
    │ issueDate        │   └────┬───────────────┘
    │ dueDate          │        │
    │ invoiceStatusId  │      1:N
    │ paymentStatus    │        │
    │ notes            │        ▼
    │ createdAt        │   ┌────────────────────┐
    └────┬─────────────┘   │    Payment         │
         │                 ├────────────────────┤
         │              N:M│ id (PK)            │
         ├────────────────►│ customerId (FK)    │
         │                 │ paymentMethodId(FK)│
         │                 │ amount, currency   │
         │                 │ date               │
         │                 │ type ("Invoice")   │
         │                 │ selectedInstallm.. │
    ┌────▼──────────────┐  │ createdAt, updated │
    │ PaymentAllocation │  └────┬───────────────┘
    ├──────────────────┤       │
    │ id (PK)          │      1:N
    │ paymentId (FK)   │       │
    │ invoiceId (FK)   │       ▼
    │ allocatedAmount  │  ┌────────────────────┐
    │ createdAt        │  │   Installment      │
    └──────────────────┘  ├────────────────────┤
                          │ id (PK)            │
    ┌──────────────────┐  │ paymentId (FK)     │
    │ InvoiceStatus    │  │ installmentNumber  │
    ├──────────────────┤  │ amount             │
    │ id (PK)          │  │ dueDate            │
    │ name (UNIQUE)    │  │ paidDate           │
    │ colorId (FK)     │  │ status             │
    │ order            │  │ createdAt, updated │
    │ isInitial        │  └────────────────────┘
    │ isFinal          │
    │ isActive         │
    │ createdAt        │
    └──────────────────┘

Legend:
  (PK) = Primary Key
  (FK) = Foreign Key
  1:N = One-to-Many
  N:M = Many-to-Many (Join table)
  (denorm) = Denormalized column
```

---

## 6. DIAGRAMA DE TRANSACCIONES DB

### Crear Invoice + Pago FIFO

```
BEGIN TRANSACTION
│
├─ 1. INSERT INTO invoices (customer_id, amount, ...)
│  └─ Retorna: invoice_id
│
├─ 2. INSERT INTO payments (customer_id, amount, ...)
│  └─ Retorna: payment_id
│
├─ 3. INSERT INTO payment_allocations (payment_id, invoice_id, amount)
│     (puede ser múltiple si FIFO)
│     └─ Allocation 1: (payment_id, invoice_A, $300)
│     └─ Allocation 2: (payment_id, invoice_B, $200)
│
├─ 4. UPDATE customers
│     SET balanceTotal = ?,
│         balanceVigente = ?,
│         balanceVencido = ?
│     WHERE id = customer_id
│
└─ COMMIT
   └─ Si error en cualquier paso: ROLLBACK (todo se revierte)
```

### Transaction Safety Guarantees

```
ACID Properties:
│
├─ Atomicity (A)
│  └─ Todo o nada
│     - Si falla allocations, invoice y payment se revierten
│
├─ Consistency (C)
│  └─ Datos siempre válidos
│     - balanceTotal = suma de balance de facturas
│     - No puede haber payment sin customer válido
│
├─ Isolation (I)
│  └─ Transacciones no interfieren
│     - Dos usuarios creando pagos simultáneamente: OK
│
└─ Durability (D)
   └─ Una vez COMMIT: datos permanentes
      - Aunque caiga el servidor
```

---

## 7. FLUJO DE API REQUEST-RESPONSE

### GET /api/customers?search=ACME&page=1&limit=100

```
CLIENT ────────────────────────────────────────────────────────► SERVER
       │ GET /api/customers
       │ Query: { search: "ACME", page: "1", limit: "100" }
       │ Headers: {...}
       │
       ├─────────────────────────────────────────────────────►
                                                    middleware: withLogging
                                                    │
                                                    ├─ generateRequestId()
                                                    ├─ logger.debug()
                                                    │
                                                    └─ handler()
                                                       │
                                                       ├─ Parse searchParams
                                                       ├─ Validate (page, limit)
                                                       ├─ Build WHERE clause
                                                       │  └─ OR [
                                                       │      razonSocial LIKE,
                                                       │      rut LIKE,
                                                       │      email LIKE
                                                       │    ]
                                                       ├─ prisma.customer.findMany()
                                                       ├─ prisma.customer.count()
                                                       │
                                                       └─ Return NextResponse.json()
       ◄─────────────────────────────────────────────────────
       │ Status: 200 OK
       │ Headers: { Content-Type: "application/json" }
       │ Body: {
       │   customers: [
       │     {
       │       id: "uuid",
       │       rut: "12345678-9",
       │       razonSocial: "ACME Corp",
       │       balanceTotal: 5000,
       │       ...
       │     }
       │   ],
       │   pagination: {
       │     page: 1,
       │     limit: 100,
       │     total: 350,
       │     totalPages: 4
       │   }
       │ }
       │
CLIENT ◄─────────────────────────────────────────────────────── SERVER
```

### POST /api/customers

```
CLIENT ────────────────────────────────────────────────────────► SERVER
       │ POST /api/customers
       │ Body: {
       │   rut: "12.345.678-9",
       │   razonSocial: "ACME Corp",
       │   contact: "Juan",
       │   phone: "+56912345678",
       │   email: "juan@acme.com",
       │   street: "Av. Libertad 123",
       │   region: "Región Metropolitana",
       │   comuna: "Santiago"
       │ }
       │
       ├─────────────────────────────────────────────────────►
                                                    middleware: withLogging
                                                    │
                                                    └─ handler()
                                                       │
                                                       ├─ request.json()
                                                       ├─ customerSchema.parse()
                                                       │  └─ Validates RUT format
                                                       ├─ Check RUT unique
                                                       │  ├─ prisma.customer.findUnique()
                                                       │  ├─ Exists? Return 400
                                                       │  └─ OK: Continue
                                                       ├─ prisma.customer.create()
                                                       │
                                                       └─ Return NextResponse.json()
       ◄─────────────────────────────────────────────────────
       │ Status: 201 Created
       │ Body: {
       │   id: "uuid",
       │   rut: "12345678-9",
       │   razonSocial: "ACME Corp",
       │   balanceTotal: 0,
       │   balanceVigente: 0,
       │   balanceVencido: 0,
       │   ...
       │ }
       │
CLIENT ◄─────────────────────────────────────────────────────── SERVER
       │
       └─ React Query mutation success
          │
          ├─ onSuccess callback
          ├─ queryClient.invalidateQueries(['customers'])
          ├─ toast.success('Cliente creado')
          └─ Dialog closes
```

---

## 8. TABLA COMPARATIVA: Características vs Estado

| Característica               | Implementado | Completado | Estado |
| ---------------------------- | ------------ | ---------- | ------ |
| **CRUD Customers**           | ✅           | ✅         | 100%   |
| **CRUD Payments**            | ✅           | ✅         | 100%   |
| **CRUD Invoices**            | ✅           | 🟡         | 70%    |
| **Payment Methods**          | ✅           | ✅         | 100%   |
| **Installments**             | ✅           | ✅         | 100%   |
| **Balance Calculation**      | ✅           | ✅         | 100%   |
| **FIFO Allocation**          | ✅           | ✅         | 100%   |
| **Invoice Status**           | ✅           | ✅         | 100%   |
| **Regional (RUT, regiones)** | ✅           | ✅         | 100%   |
| **Validations (Zod)**        | ✅           | 🟡         | 80%    |
| **UI Components**            | ✅           | ✅         | 100%   |
| **Tests (Unit)**             | ✅           | ✅         | 95%    |
| **Tests (E2E)**              | ✅           | 🟡         | 60%    |
| **Authentication**           | ❌           | ❌         | 0%     |
| **Authorization**            | ❌           | ❌         | 0%     |
| **Rate Limiting**            | ❌           | ❌         | 0%     |
| **Documentación API**        | ❌           | ❌         | 0%     |
| **Dashboard/Gráficos**       | ❌           | ❌         | 0%     |

---

## 9. ÍNDICES EN BASE DE DATOS

### Estrategia de Indexación

```
CUSTOMER table
├─ PRIMARY KEY: id
├─ UNIQUE: rut
├─ INDEX: razonSocial (búsqueda por nombre)
├─ INDEX: email (búsqueda por correo)
├─ INDEX: balanceTotal (ordena por monto adeudado)
└─ INDEX: balanceVencido (filtro de morosos)

INVOICE table
├─ PRIMARY KEY: id
├─ UNIQUE: invoiceNumber
├─ INDEX: customerId (FK lookup)
├─ INDEX: invoiceStatusId (FK lookup)
├─ INDEX: paymentInvoiceStatusId (FK lookup)
├─ INDEX: issueDate (rango de fechas)
├─ INDEX: dueDate (facturas próximas a vencer)
└─ COMPOSITE: invoiceNumber (búsqueda rápida)

PAYMENT table
├─ PRIMARY KEY: id
├─ INDEX: customerId (FK lookup)
├─ INDEX: paymentMethodId (FK lookup)
├─ INDEX: date (rango temporal)
├─ INDEX: type (filtro Invoice vs Customer)
└─ COMPOSITE: (type, date DESC) (listado por tipo/fecha)

PAYMENT_ALLOCATION table
├─ PRIMARY KEY: id
├─ INDEX: paymentId (FK lookup, cascade delete)
└─ INDEX: invoiceId (FK lookup, cascade delete)

INSTALLMENT table
├─ PRIMARY KEY: id
├─ INDEX: paymentId (FK lookup, cascade delete)
└─ COMPOSITE: (status, dueDate) (find overdue cuotas)
```

---

## 10. RESUMEN ARQUITECTÓNICO

```
┌─────────────────────────────────────────────────────────────┐
│                     COBROLOX STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND (Browser)                                         │
│  ├─ Next.js 15 Pages (App Router)                          │
│  ├─ React 19 Components (Functional)                       │
│  ├─ shadcn/ui (50+ componentes)                            │
│  ├─ TailwindCSS v4 (Styling)                               │
│  └─ React Query (Server state)                             │
│                                                             │
│  ↓                                                          │
│                                                             │
│  API LAYER (Backend)                                        │
│  ├─ Next.js Route Handlers                                 │
│  ├─ TypeScript Strict                                      │
│  ├─ Zod Validation                                         │
│  ├─ Pino Logging                                           │
│  └─ withLogging Middleware                                 │
│                                                             │
│  ↓                                                          │
│                                                             │
│  BUSINESS LOGIC                                             │
│  ├─ Balance Calculation (denorm)                           │
│  ├─ FIFO Payment Allocation                                │
│  ├─ Installment Generation                                 │
│  ├─ Status Management                                      │
│  └─ Import/Export Logic                                    │
│                                                             │
│  ↓                                                          │
│                                                             │
│  DATA ACCESS (ORM)                                          │
│  ├─ Prisma Client (Singleton)                              │
│  ├─ Schema Migrations                                      │
│  ├─ Relaciones (1:N, N:M)                                  │
│  └─ Indices Strategy                                       │
│                                                             │
│  ↓                                                          │
│                                                             │
│  DATABASE (PostgreSQL)                                      │
│  ├─ 10 Models (User, Customer, Invoice, Payment...)        │
│  ├─ Neon Serverless                                        │
│  ├─ Transacciones ACID                                     │
│  └─ Full-text search ready                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Diagramas generados:** 10  
**Niveles de detalle:** 5 (UI → API → Logic → ORM → DB)  
**Casos de uso:** 3 (Create Customer, Create Payment, Transaction Safety)
