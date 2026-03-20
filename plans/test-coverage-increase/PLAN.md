# Aumento de Cobertura de Tests

> **Estado**: `done`

## Contexto

Incrementar la cobertura de tests del proyecto de 375 a 524 tests, priorizando módulos de lógica pura crítica (importación, validaciones, retry) que no tenían cobertura. Ver `CONTEXT.md` para la investigación completa.

## Scope

**Incluye**: Tests unitarios para 13 módulos sin cobertura + fix de 3 tests rotos, organizados en 4 fases.
**Excluye**: Tests de hooks de queries (use-customers, use-invoices), tests de API routes, tests e2e.

## Decisiones de diseno

- **Tier 1 extendido con `regiones-chile.ts` y `use-rut-input.ts`**: Mover estos dos archivos de Tier 2 al Tier 1 porque son funciones puras con alto uso en la app y fáciles de testear. Los schemas triviales de enums quedan en Tier 2 con estimación reducida. Alternativa descartada: mantener la organización original — los schemas de enums tienen menor ROI que estas utilidades.

- **~3-5 tests por schema trivial en vez de ~5-8**: Los schemas de `badge-color`, `invoice-status`, `payment-method`, `payment-invoice-status` son declarativos con lógica mínima. Focalizarse en los `refine()` y edge cases, no en validar que Zod funciona. Alternativa descartada: cobertura exhaustiva de cada campo — es testear el framework, no el código.

- **Fix de tests rotos como paso independiente en Fase 0**: Cambio trivial (actualizar strings) ejecutado inmediatamente. Alternativa descartada: incluirlo dentro de la Fase 1.

## Fases completadas

### Fase 0: Fix de tests rotos

- [x] Fix 2 strings de log en `recalculate-balances/__tests__/route.test.ts`
- [x] Fix test de threshold sensible a hora en `invoice-utils.test.ts` (preexistente)
- Resultado: 375/375 pasan

### Fase 1: Import + utilidades puras (+100 tests)

- [x] `lib/import/__tests__/excel-parser.test.ts` — 26 tests
- [x] `lib/import/__tests__/invoice-import.test.ts` — 20 tests
- [x] `lib/import/__tests__/customer-import.test.ts` — 15 tests
- [x] `lib/validations/__tests__/installment-validations.test.ts` — 11 tests
- [x] `lib/validations/__tests__/invitation-validations.test.ts` — 16 tests
- [x] `lib/__tests__/regiones-chile.test.ts` — 12 tests
- Resultado: 475/475 pasan

### Fase 2: Hook useRutInput + customer-balance-retry (+17 tests)

- [x] `lib/business-logic/__tests__/customer-balance-retry.test.ts` — 6 tests
- [x] `hooks/__tests__/use-rut-input.test.tsx` — 11 tests
- Resultado: 492/492 pasan

### Fase 3: Schemas de validacion restantes (+32 tests)

- [x] `lib/validations/__tests__/customer-validations.test.ts` — 6 tests
- [x] `lib/validations/__tests__/badge-color-validations.test.ts` — 7 tests
- [x] `lib/validations/__tests__/invoice-status-validations.test.ts` — 6 tests
- [x] `lib/validations/__tests__/payment-method-validations.test.ts` — 7 tests
- [x] `lib/validations/__tests__/payment-invoice-status-validations.test.ts` — 6 tests
- Resultado: 524/524 pasan

## Estado actual

**Paso en curso**: --
**Ultimo completado**: Fase 3 (todas las fases completadas)
**Siguiente accion concreta**: Ninguna — plan completo
**Bloqueadores**: Ninguno
