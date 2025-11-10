# Customer Balance Columns

**Estado:** ✅ Implementado (2025-01-07)

## Resumen

Sistema de balance almacenado en el modelo `Customer` para optimizar consultas de informes de cobros.

## Columnas Agregadas

### `balanceTotal` (Decimal)

- Suma de todos los balances de facturas del cliente
- Balance = Invoice.total - suma(allocations)

### `balanceVigente` (Decimal)

- Suma de balance de facturas NO vencidas
- Criterio: `dueDate >= now()`

### `balanceVencido` (Decimal)

- Suma de balance de facturas vencidas
- Criterio: `dueDate < now()`

## Decisión Técnica

Se eligió **Opción B: Columnas Almacenadas** sobre cálculo dinámico porque:

✅ **Pros:**

- Performance crítico para informes (muchas lecturas vs pocas escrituras)
- Queries instantáneos para dashboards
- Facilita ordenamiento y filtrado por balance
- Patrón común en sistemas de facturación

⚠️ **Contras manejados:**

- Sincronización: Se recalcula automáticamente después de crear/modificar facturas o pagos
- Complejidad: Encapsulada en función única `recalculateCustomerBalances()`

## Single Source of Truth

```typescript
// lib/business-logic/customer-balance.ts
recalculateCustomerBalances(customerId: string)
```

Esta función:

1. Obtiene todas las facturas del cliente
2. Calcula balance de cada factura (total - paidAmount)
3. Clasifica por vigente/vencido según `dueDate`
4. Actualiza las 3 columnas en Customer

## Puntos de Integración

Se llama automáticamente después de:

- ✅ `POST /api/invoices` - Crear factura
- ✅ `POST /api/payments` - Crear pago con allocations
- ⏳ `PUT /api/invoices/[id]` - Modificar factura (futuro)
- ⏳ `DELETE /api/invoices/[id]` - Eliminar factura (futuro)
- ⏳ Job nocturno - Recalcular facturas que vencieron (futuro)

## Testing

### Tests Unitarios

`lib/business-logic/__tests__/customer-balance.test.ts`

✅ 8 tests (todos pasan):

- Cálculo correcto de balances
- Persistencia en BD
- Actualización al cambiar pagos
- Cliente sin facturas
- Edge cases (facturas con balance 0, límite de vencimiento)

### Verificación Manual

```bash
# Ver balances de todos los clientes
npx tsx scripts/check-customer-balances.ts
```

## Migración Inicial

Después de aplicar el schema:

```bash
# Recalcular balances de todos los clientes existentes
npx tsx scripts/recalculate-all-customer-balances.ts
```

## Uso en Frontend

Las columnas se retornan automáticamente en `GET /api/customers`:

```typescript
const response = await fetch("/api/customers");
const { customers } = await response.json();

customers.forEach((customer) => {
  console.log(customer.balanceTotal); // Balance total
  console.log(customer.balanceVigente); // Balance vigente
  console.log(customer.balanceVencido); // Balance vencido
});
```

## Índices

```prisma
@@index([balanceTotal])     // Para ordenar por deuda total
@@index([balanceVencido])   // Para priorizar clientes con deuda vencida
```

## Próximos Pasos

1. **Job Nocturno** - Recalcular balances diariamente
   - Detectar facturas que pasaron de vigente → vencido
   - Actualizar balanceVigente/balanceVencido

2. **Columnas en DataTable** - Mostrar en `/customer`
   - Columna "Balance Total"
   - Columna "Vigente"
   - Columna "Vencido"

3. **Dashboard de Cobros**
   - Top 10 clientes con mayor deuda vencida
   - Total cartera vigente vs vencida
   - Evolución mensual

## Referencias

- Schema: `prisma/schema.prisma:46-49`
- Lógica: `lib/business-logic/customer-balance.ts`
- Tests: `lib/business-logic/__tests__/customer-balance.test.ts`
- Scripts: `scripts/recalculate-all-customer-balances.ts`
