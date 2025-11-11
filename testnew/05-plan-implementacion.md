# 🗓️ Plan de Implementación Detallado

> Roadmap semana por semana para implementar todos los tests unitarios

---

## 📊 Resumen del Plan

- **Duración Total:** 5-6 semanas (205 horas)
- **Estrategia:** Prioridad → Dependencias → Complejidad
- **Enfoque:** Implementar fundamentos primero, construir sobre ellos

---

## 🎯 Fase 1: Fundamentos Críticos (Semanas 1-2)

**Objetivo:** Completar tests críticos sin dependencias
**Duración:** 62 horas (~10 días)

### Semana 1

#### Día 1-2 (10 horas) - RUT Validations ✅ COMPLETADO
- [x] `lib/rut-validations.ts` (49 tests)
  - rutSchema Zod (15 tests)
  - rutSchemaOptional (4 tests)
  - rutHelpers.format() (7 tests)
  - rutHelpers.clean() (7 tests)
  - rutHelpers.validate() (7 tests)
  - rutHelpers.getCheckDigit() (6 tests)
  - Integración (3 tests)
- **Checkpoint:** ✅ 100% cobertura en RUT, base para clientes
- **Fecha:** 2025-11-11
- **Hallazgos:** Usa biblioteca rut.js, requiere RUTs chilenos válidos reales

#### Día 3-4 (6.25 horas) - Invoice Validations
- [ ] `lib/validations/invoice-validations.ts` (25 tests)
  - invoiceSchema Zod (15 tests)
  - parseInvoicesWithBalance (5 tests)
  - Edge cases financieros (5 tests)
- **Checkpoint:** Validación financiera robusta

#### Día 4-5 (6.7 horas) - Installments Expansion
- [ ] `lib/business-logic/installments.ts` (20 tests adicionales)
  - Absorción de centavos (4 tests)
  - Números grandes (2 tests)
  - Casos extremos (6 tests)
  - Precisión decimal (3 tests)
  - calculateInstallmentDates (5 tests)
- **Checkpoint:** División de cuotas sin bugs

### Semana 2

#### Día 6-8 (12.5 horas) - Invoice Import
- [ ] `lib/import/invoice-import.ts` (25 tests)
  - calculateIVAFromSubtotal (6 tests)
  - processInvoiceRow (10 tests)
  - validateInvoiceBatch (9 tests)
- **Checkpoint:** Importación masiva segura

#### Día 9-10 (10 horas) - RUT Input Hook
- [ ] `hooks/use-rut-input.ts` (20 tests)
  - Estados formattedValue/cleanValue (6 tests)
  - handleChange sanitización (4 tests)
  - handleBlur formateo (3 tests)
  - Validación isValid (3 tests)
  - clear y integración (4 tests)
- **Checkpoint:** UX de entrada de RUT perfecta

#### Día 11-15 (18.75 horas) - Payment to Customer Form
- [ ] `components/forms/payment-to-customer-form.tsx` (25 tests)
  - handleCalculateFIFO (8 tests)
  - handleChangeAllocation (5 tests)
  - handleRemoveAllocation (3 tests)
  - Validación submit (9 tests)
- **Checkpoint:** FIFO manual sin errores

**✅ Fin Fase 1: 145 tests, 62 horas**

---

## 🎯 Fase 2: Funcionalidad Core (Semanas 3-5)

**Objetivo:** Completar tests importantes de funcionalidad
**Duración:** 107 horas (~13 días)

### Semana 3 - Hooks React Query (40 horas)

#### Día 1-3 (15 horas) - use-invoices
- [ ] `hooks/queries/use-invoices.ts` (25 tests)
  - useInvoices query (8 tests)
  - useCreateInvoice mutation (6 tests)
  - useUpdateInvoice optimistic (6 tests)
  - useDeleteInvoice cascading (5 tests)

#### Día 4-6 (15 horas) - use-customers
- [ ] `hooks/queries/use-customers.ts` (25 tests)
  - Mismo patrón que use-invoices
  - Especial atención a RUT en queries

#### Día 7-8 (10 horas) - use-installments
- [ ] `hooks/queries/use-installments.ts` (15 tests)
  - Menos mutations que otros hooks
  - Relación con paymentId

**Checkpoint Semana 3:** Queries y mutations robustas

### Semana 4 - Formularios e Importación (42 horas)

#### Día 1-2 (11.25 horas) - Invoice Form
- [ ] `components/forms/invoice-form.tsx` (15 tests)
  - useEffect: IVA auto-cálculo (6 tests)
  - useEffect: dueDate (4 tests)
  - useEffect: CLP redondeo (3 tests)
  - Edge cases (2 tests)

#### Día 3-4 (9 horas) - Payment to Invoice Form
- [ ] `components/forms/payment-to-invoice-form.tsx` (12 tests)
  - Auto-completado amount (4 tests)
  - Validaciones (8 tests)

#### Día 5-6 (10 horas) - Excel Parser
- [ ] `lib/import/excel-parser.ts` (20 tests)
  - parseExcelDate (5 tests)
  - parseExcelDecimal (5 tests)
  - parseExcelString (5 tests)
  - Edge cases (5 tests)

#### Día 7-8 (9 horas) - Customer Import
- [ ] `lib/import/customer-import.ts` (18 tests)
  - Validación RUT en batch
  - Email válido
  - Duplicados

**Checkpoint Semana 4:** Formularios e importación completos

### Semana 5 - Validaciones y Transformadores (25 horas)

#### Día 1-2 (5 horas) - Customer Validations
- [ ] `lib/validations/customer-validations.ts` (20 tests)
  - customerSchema Zod
  - RUT validation integration
  - Address fields

#### Día 2-3 (4.5 horas) - Invoice Transformers
- [ ] `lib/transformers/invoice-transformers.ts` (12 tests)
  - parseInvoicesWithBalance expansion
  - transformInvoiceForAPI

#### Día 3-4 (3 horas) - Invoice Status
- [ ] `lib/invoice-status.ts` (12 tests)
  - calculateInvoiceStatus matriz 3×3
  - calculatePaymentStatus

#### Día 5-8 (10.8 horas) - Data Table
- [ ] `components/data-table/data-table.tsx` (18 tests)
  - Sorting state (5 tests)
  - Filtering (5 tests)
  - Paginación dual (5 tests)
  - Row selection (3 tests)

**Checkpoint Semana 5:** Transformadores y estados completos

**✅ Fin Fase 2: 199 tests, 107 horas**

---

## 🎯 Fase 3: Calidad y Extras (Semana 6+)

**Objetivo:** Completar tests deseables y expansiones
**Duración:** 36 horas (~5 días)

### Semana 6 - Componentes TODO y Utilidades

#### Día 1-2 (6 horas) - use-todo-list
- [ ] `hooks/use-todo-list.ts` (18 tests)
  - Modo no controlado (9 tests)
  - Modo controlado (6 tests)
  - Estadísticas (3 tests)

#### Día 2-3 (9 horas) - todo-list
- [ ] `components/custom/todo/todo-list.tsx` (15 tests)
  - Auto-sort (5 tests)
  - Dialog confirmación (5 tests)
  - Focus management (5 tests)

#### Día 4 (6 horas) - todo-list-field
- [ ] `components/custom/todo/todo-list-field.tsx` (10 tests)
  - React Hook Form (5 tests)
  - Disabled state (3 tests)
  - Validation (2 tests)

#### Día 5 (5 horas) - Balance Alerts
- [ ] `lib/alerts/balance-alerts.ts` (10 tests)
  - formatBalanceFailureMessage (6 tests)
  - sendSlackAlert (4 tests)

#### Día 5-6 (2.5 horas) - Regiones Chile
- [ ] `lib/regiones-chile.ts` (10 tests)
  - getRegionById (3 tests)
  - getComunasByRegionId (4 tests)
  - getRegionByComunaId (3 tests)

#### Día 6 (4.8 horas) - Data Table Column Header
- [ ] `components/data-table/data-table-column-header.tsx` (8 tests)
  - Sorteable columns (4 tests)
  - Hide column (2 tests)
  - Non-sorteable (2 tests)

#### Día 7 (8 horas) - Expansión Tests Existentes
- [ ] invoice-utils.test.ts (+5-10 tests)
- [ ] payment-transformers.test.ts (+6-10 tests)
- [ ] utils.test.ts (+5-8 tests)

**✅ Fin Fase 3: 83 tests, 36 horas**

---

## 📋 Dependencias y Bloqueadores

### Orden OBLIGATORIO

```
1. rut-validations.ts
   ↓
2. customer-validations.ts, use-rut-input.ts, customer-import.ts

3. invoice-validations.ts
   ↓
4. payment-validations.ts, invoice-import.ts, invoice-form.tsx

5. excel-parser.ts
   ↓
6. customer-import.ts, invoice-import.ts

7. invoice-transformers.ts
   ↓
8. use-invoices.ts

9. payment-transformers.ts
   ↓
10. use-payments.ts (expansión)
```

### Tests que PUEDEN hacerse en PARALELO

- Semana 1: RUT validations + Invoice validations (sin dependencias entre sí)
- Semana 4: Excel parser + Regiones chile (independientes)
- Semana 5: Todos los transformadores (si schemas están listos)
- Semana 6: Todos los componentes TODO

---

## ✅ Criterios de Aceptación

### Por Fase

**Fase 1 (Crítico):**
- ✅ 100% cobertura en RUT validations
- ✅ 95%+ cobertura en invoice validations
- ✅ 0 bugs en división de cuotas
- ✅ Importación masiva sin fallos
- ✅ FIFO manual 100% preciso

**Fase 2 (Importante):**
- ✅ 85%+ cobertura en hooks queries
- ✅ Optimistic updates funcionando
- ✅ Formularios sin bugs de cálculo
- ✅ Importación Excel robusta
- ✅ Estados de factura correctos

**Fase 3 (Deseable):**
- ✅ 70%+ cobertura en componentes TODO
- ✅ Utilidades sin errores
- ✅ Data table funcional completo

### Checkpoints Diarios

Al final de cada día:
- [ ] Todos los tests pasan (npm run test)
- [ ] TypeScript sin errores (npm run typecheck)
- [ ] ESLint sin warnings (npm run lint)
- [ ] Coverage aumentó según lo planeado
- [ ] Commit con mensaje descriptivo

---

## 🚨 Manejo de Riesgos

### Riesgo 1: Tests tardan más de lo estimado
**Mitigación:**
- Reevaluar complejidad después de Fase 1
- Ajustar plan si necesario
- Priorizar críticos sobre deseables

### Riesgo 2: Descubrir bugs en tests existentes
**Mitigación:**
- Documentar bugs encontrados
- Crear issues para tracking
- Fix inmediato si es crítico

### Riesgo 3: Dependencias bloqueantes imprevistas
**Mitigación:**
- Revisar dependencies al inicio de cada día
- Tener plan B para tests bloqueados
- Trabajar en tests independientes mientras

---

## 📈 Tracking de Progreso

### Métricas Semanales

| Semana | Tests Planeados | Tests Completados | Horas Estimadas | Horas Reales |
|--------|-----------------|-------------------|-----------------|--------------|
| 1      | 75              | -                 | 33              | -            |
| 2      | 70              | -                 | 29              | -            |
| 3      | 65              | -                 | 40              | -            |
| 4      | 65              | -                 | 39.25           | -            |
| 5      | 62              | -                 | 27.8            | -            |
| 6      | 83              | -                 | 36              | -            |
| **Total** | **420**       | **-**             | **205**         | **-**        |

### Checkboxes de Progreso

Marcar ✅ conforme se completan:

**Fase 1 (Crítico):**
- [x] lib/rut-validations.ts ✅ 2025-11-11
- [ ] lib/validations/invoice-validations.ts
- [ ] lib/business-logic/installments.ts
- [ ] lib/import/invoice-import.ts
- [ ] hooks/use-rut-input.ts
- [ ] components/forms/payment-to-customer-form.tsx

**Fase 2 (Importante):**
- [ ] hooks/queries/use-invoices.ts
- [ ] hooks/queries/use-customers.ts
- [ ] hooks/queries/use-installments.ts
- [ ] components/forms/invoice-form.tsx
- [ ] components/forms/payment-to-invoice-form.tsx
- [ ] lib/import/excel-parser.ts
- [ ] lib/import/customer-import.ts
- [ ] lib/validations/customer-validations.ts
- [ ] lib/transformers/invoice-transformers.ts
- [ ] lib/invoice-status.ts
- [ ] components/data-table/data-table.tsx

**Fase 3 (Deseable):**
- [ ] hooks/use-todo-list.ts
- [ ] components/custom/todo/todo-list.tsx
- [ ] components/custom/todo/todo-list-field.tsx
- [ ] lib/alerts/balance-alerts.ts
- [ ] lib/regiones-chile.ts
- [ ] components/data-table/data-table-column-header.tsx
- [ ] Expansión tests existentes

---

## 🎓 Lecciones Aprendidas

> Actualizar después de cada fase

### Fase 1
- Lección 1: ...
- Lección 2: ...
- Ajustes al plan: ...

### Fase 2
- Lección 1: ...
- Lección 2: ...
- Ajustes al plan: ...

### Fase 3
- Lección 1: ...
- Lección 2: ...
- Ajustes al plan: ...

---

**Última actualización:** 2025-11-11
**Versión:** 1.0.0
