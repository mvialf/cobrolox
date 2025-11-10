# Actualización Automática de Balances de Clientes

**Estado:** ✅ Implementado (2025-01-07)

## Flujo Completo: Registrar Pago → Actualizar Balances

### 1️⃣ Usuario Registra Pago

**Ubicación:** `/customer` table → botón "Registrar pago" en dropdown

```tsx
// app/customer/columns.tsx
<PaymentToCustomerDialog
  open={paymentDialogOpen}
  onOpenChange={setPaymentDialogOpen}
  preselectedCustomerId={customer.id}
  onSuccess={() => {
    // Callback para actualizar tabla
    onCustomerUpdated?.();
  }}
/>
```

### 2️⃣ Dialog Envía Request al Backend

**Componente:** `PaymentToCustomerDialog`

```tsx
// components/dialogs/payments/payment-to-customer-dialog.tsx:lines 70-82
const response = await fetch("/api/payments", {
  method: "POST",
  body: JSON.stringify(paymentData),
});

if (response.ok) {
  toast.success("Pago registrado exitosamente");
  onOpenChange(false);
  onSuccess?.(); // ← Llama callback
  router.refresh(); // ← Revalida Server Components
}
```

### 3️⃣ Backend Crea Pago y Actualiza Balances

**API Route:** `POST /api/payments`

```typescript
// app/api/payments/route.ts:lines 456-587

// 1. Crear pago con allocations
const payment = await prisma.payment.create({
  data: {
    customerId,
    amount,
    allocations: { create: [...] }
  }
});

// 2. Recalcular balances automáticamente
await recalculateCustomerBalances(customerId);
//     ↓
//     Actualiza en BD:
//     - balanceTotal
//     - balanceVigente
//     - balanceVencido

// 3. Retornar response
return NextResponse.json(payment, { status: 201 });
```

**Función de Recálculo:**

```typescript
// lib/business-logic/customer-balance.ts
async function recalculateCustomerBalances(customerId: string) {
  // 1. Obtener todas las facturas del cliente
  const invoices = await prisma.invoice.findMany({
    where: { customerId },
    include: { allocations: true },
  });

  // 2. Calcular balances
  let balanceTotal = 0;
  let balanceVigente = 0;
  let balanceVencido = 0;

  for (const invoice of invoices) {
    const balance = invoice.total - sum(invoice.allocations);
    if (balance <= 0) continue;

    balanceTotal += balance;

    if (invoice.dueDate < now) {
      balanceVencido += balance;
    } else {
      balanceVigente += balance;
    }
  }

  // 3. Actualizar Customer en BD
  await prisma.customer.update({
    where: { id: customerId },
    data: { balanceTotal, balanceVigente, balanceVencido },
  });
}
```

### 4️⃣ Frontend Actualiza Tabla

**Página:** `app/customer/page.tsx`

```typescript
// Callback configurado en table meta
const handleCustomerUpdated = async () => {
  await fetchCustomers(); // ← Re-fetch desde API
};

// Pasado al DataTable
<DataTable
  columns={columns}
  data={customers}
  meta={{
    onCustomerUpdated: handleCustomerUpdated
  }}
/>
```

**Flujo de actualización:**

```
Dialog cierra
    ↓
onSuccess() llamado
    ↓
onCustomerUpdated() ejecutado
    ↓
fetchCustomers() hace GET /api/customers
    ↓
API retorna clientes con balances actualizados
    ↓
setCustomers(newData) actualiza estado
    ↓
DataTable re-renderiza con nuevos balances
```

## Diagrama de Secuencia

```
Usuario                Dialog              API /payments         DB            API /customers        Tabla
   |                      |                      |                |                  |                |
   |--[Registrar pago]--->|                      |                |                  |                |
   |                      |--[POST payment]----->|                |                  |                |
   |                      |                      |--[CREATE]----->|                  |                |
   |                      |                      |                |                  |                |
   |                      |                      |--[recalculate]>|                  |                |
   |                      |                      |                |--[UPDATE]------->|                |
   |                      |                      |                | balanceTotal     |                |
   |                      |                      |                | balanceVigente   |                |
   |                      |                      |                | balanceVencido   |                |
   |                      |                      |                |                  |                |
   |                      |<--[201 Created]------|                |                  |                |
   |                      |                      |                |                  |                |
   |<--[Dialog cierra]----|                      |                |                  |                |
   |                      |                      |                |                  |                |
   |                      |--[onSuccess()]-------|----------------|--[GET /customers]>|                |
   |                      |                      |                |                  |                |
   |                      |                      |                |                  |<--[data]-------|
   |                      |                      |                |                  |                |
   |<-----------------------------------------------------------[Tabla actualizada]------------------|
```

## Puntos Clave

### ✅ Actualización Doble (Backend + Frontend)

**Backend (BD):**

- Automático después de cada operación
- Garantizado por `recalculateCustomerBalances()`
- Sincronizado con transacciones

**Frontend (UI):**

- Automático vía callback `onSuccess`
- Refetch completo de datos
- Estado actualizado en React

### ✅ Manejo de Errores

**Si falla el recálculo:**

```typescript
try {
  await recalculateCustomerBalances(customerId);
} catch (error) {
  // Log error pero NO fallar el request
  // El pago ya fue creado exitosamente
  paymentLogger.warn("Failed to recalculate...");
}
```

**El pago NO se revierte** - El balance se puede recalcular después manualmente.

### ✅ Otras Operaciones que Actualizan

El mismo patrón se aplica a:

1. **Crear Factura** → `POST /api/invoices` → `recalculateCustomerBalances()`
2. **Editar Cliente** → `onCustomerUpdated()` → `fetchCustomers()`
3. **Eliminar Cliente** → `handleCustomerDeleted()` → `fetchCustomers()`

## Testing

### Manual

1. Abrir `/customer`
2. Click en dropdown → "Registrar pago"
3. Registrar pago a 1+ facturas
4. Verificar que columnas de balance se actualizan sin reload

### Automático (TODO)

```typescript
// tests/e2e/customer-balance-update.spec.ts
test("debe actualizar balances después de registrar pago", async ({ page }) => {
  // 1. Navegar a /customer
  // 2. Capturar balance inicial
  // 3. Registrar pago
  // 4. Verificar balance actualizado (sin reload)
});
```

## Próximos Pasos

1. **Job Nocturno** - Recalcular balances de todos los clientes diariamente
2. **Webhook/SSE** - Push updates en tiempo real (opcional)
3. **Optimistic Updates** - Actualizar UI antes de response del servidor
4. **Indicator Visual** - Loading spinner mientras recalcula

---

**Documentos relacionados:**

- [customer-balance-columns.md](./customer-balance-columns.md) - Implementación de columnas
- [payment-to-customer.md](../architecture/02-business-flows/payment-to-customer.md) - Flujo de pago
