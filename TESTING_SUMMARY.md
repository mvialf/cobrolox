# Resumen de Tests Unitarios - Cobrolox

**Fecha:** 2025-11-11  
**Proyecto:** Cobrolox (SaaS para facturación y cobros)  
**Stack de Testing:** Vitest + React Testing Library + Testing Library jest-dom

---

## 1. ARCHIVOS DE TEST EXISTENTES

### Tests Unitarios Actuales (16 archivos)

#### Componentes UI (2 tests)

- **`/components/ui/__tests__/button.test.tsx`** (137 líneas)
  - Testing: button component variants, sizes, disabled states, onClick handling, form integration
  - Patrón: Component testing con render + screen queries

- **`/components/ui/__tests__/card.test.tsx`** (180 líneas)
  - Testing: Card composition (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
  - Patrón: Componentes compuestos, testing de slots

#### Hooks Custom (3 tests)

- **`/hooks/__tests__/use-debounce.test.tsx`** (222 líneas)
  - Testing: useDebounce hook con fake timers
  - Patrón: Hook testing con `renderHook`, `act()`, `vi.useFakeTimers()`
  - Cubre: delays personalizados, cancelación de timeouts, valores nulos, casos reales de búsqueda

- **`/hooks/__tests__/use-mobile.test.tsx`** (101 líneas)
  - Testing: useIsMobile hook (responsive breakpoint)
  - Patrón: Testing de hooks con estado de viewport
  - Cubre: breakpoint 768px, tamaños de dispositivos comunes
  - Nota: Tests de cambios dinámicos comentados (limitación de jsdom con matchMedia)

- **`/hooks/queries/__tests__/use-payments.test.tsx`** (995 líneas)
  - Testing: Queries y mutations de pagos (React Query)
  - Funciones testeadas:
    - `usePayments()` - query con paginación
    - `useSearchProjects()` - query con enabled
    - `useCustomerProjects()` - query auxiliar
    - `useCreatePayment()` - CRÍTICO: validaciones de negocio
    - `useUpdatePayment()` - mutation limitada
    - `useDeletePayment()` - optimistic updates + rollback
  - Patrón: QueryClientProvider wrapper, mock global.fetch, waitFor()
  - CRÍTICO: Validaciones de negocio incluidas:
    - Type "Project" debe tener exactamente 1 allocation
    - Type "Customer" debe tener al menos 1 allocation
    - Sum de allocations === amount (tolerancia 0.01)
    - No projectIds duplicados

#### Utilidades (6 tests)

- **`/lib/__tests__/format.test.ts`** (161 líneas)
  - Funciones: `formatCurrency()`, `formatNumber()`, `formatDate()`
  - Patrón: Pure functions, test de múltiples locales (es-CL, en-US, es-AR, MXN)
  - Cubre: decimales, valores negativos, ceros, edge cases

- **`/lib/__tests__/utils.test.ts`**
  - (No revisado en profundidad, pero existe)

- **`/lib/utils/__tests__/invoice-utils.test.ts`**
  - (No revisado en profundidad, pero existe)

- **`/lib/transformers/__tests__/payment-transformers.test.ts`**
  - (No revisado en profundidad, pero existe)

#### Lógica de Negocio (4 tests)

- **`/lib/business-logic/__tests__/totals.test.ts`** (181 líneas)
  - Funciones: `calculateProjectTotal()`, `calculateTax()`, `validateProjectTotal()`, `calculateSubtotalFromTotal()`
  - Patrón: Cálculos matemáticos, validación de inputs
  - Cubre: IVA 19% de Chile, decimales, valores grandes, números muy pequeños
  - Validaciones: montos negativos, tasas inválidas (< 0% o > 100%)

- **`/lib/business-logic/__tests__/customer-balance.test.ts`** (324 líneas)
  - Funciones: `calculateCustomerBalances()`, `recalculateCustomerBalances()`
  - Patrón: INTEGRATION TEST (usa Prisma + BD real)
  - Fixtures: beforeAll/afterAll con creación/limpieza de datos
  - Cubre: balanceTotal, balanceVigente, balanceVencido, facturas pagadas completamente
  - Edge cases: facturas justo en límite de vencimiento

- **`/lib/business-logic/__tests__/payment-fifo.test.ts`** (100+ líneas)
  - Funciones: `calculateFIFO()`, `validateAllocationsSum()`, `filterInvoicesWithBalance()`
  - Patrón: Algoritmo FIFO para asignación de pagos
  - Cubre: distribución ordenada por fecha, balances parciales

- **`/lib/business-logic/__tests__/installments.test.ts`**
  - (No revisado en profundidad, pero existe)

#### Tests E2E (4 tests - Playwright, NO UNITARIOS)

- `/tests/e2e/example.spec.ts`
- `/tests/e2e/critical-flow.spec.ts`
- `/tests/e2e/payment-to-customer.spec.ts`
- `/tests/e2e/payments.spec.ts`

---

## 2. CONFIGURACIÓN DE TESTING

### Archivo: `vitest.config.mts`

```typescript
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom", // Browser-like environment
    setupFiles: ["./vitest.setup.ts"], // Setup global mocks
    globals: true, // Vitest functions globally available
    css: true, // Support CSS imports
    testTimeout: 10000, // Timeout aumentado para Radix UI
    include: [
      "**/__tests__/**/*.{test,spec}.{ts,tsx}",
      "**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".next",
      "build",
      "**/e2e/**",
      "tests/e2e/**",
    ],
    deps: {
      optimizer: {
        web: {
          include: ["@radix-ui/react-*"],
        },
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "vitest.setup.ts",
        "**/*.config.{ts,js}",
        "**/types/**",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### Archivo: `vitest.setup.ts`

Mocks globales configurados:

- **IntersectionObserver** - Usado por Radix UI
- **ResizeObserver** - Usado por react-resizable-panels
- **window.matchMedia** - Responsive queries
- **HTMLElement methods** - scrollIntoView, hasPointerCapture, releasePointerCapture
- **PointerEvent** - Mock para interacciones con pointer
- **DOMRect** - Usado por getBoundingClientRect()
- **Cleanup** - afterEach cleanup automático

### Scripts en `package.json`

```json
{
  "test": "vitest", // Run tests in watch mode
  "test:ui": "vitest --ui", // UI dashboard
  "test:coverage": "vitest --coverage", // Coverage report
  "test:e2e": "playwright test" // E2E tests
}
```

### Dependencias de Testing

```json
{
  "@playwright/test": "^1.56.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.2.0",
  "@testing-library/user-event": "^14.6.1",
  "@vitest/coverage-v8": "^1.6.1",
  "@vitest/ui": "^1.6.0",
  "jsdom": "^27.0.0",
  "vitest": "^1.6.0"
}
```

---

## 3. PATRONES DE TESTING IDENTIFICADOS

### Patrón 1: Component Testing

**Usado en:** button.test.tsx, card.test.tsx

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Button", () => {
  it("debe renderizar correctamente", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("debe manejar click", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Patrón 2: Hook Testing con Fake Timers

**Usado en:** use-debounce.test.tsx

```typescript
import { renderHook, act } from "@testing-library/react";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("debe debounce con delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    );

    rerender({ value: "changed" });
    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("changed");
  });
});
```

### Patrón 3: React Query Testing

**Usado en:** use-payments.test.tsx

```typescript
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
}

describe("usePayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("debe cargar pagos", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ payments: [], pagination: {} }),
    });

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.payments).toEqual([]);
  });
});
```

### Patrón 4: Pure Function Testing

**Usado en:** format.test.ts, totals.test.ts

```typescript
describe("formatCurrency", () => {
  it("debe formatear CLP sin decimales", () => {
    expect(formatCurrency(1234.56, "CLP")).toBe("$1.235");
  });

  it("debe manejar valores negativos", () => {
    const result = formatCurrency(-1234.56, "USD");
    expect(result).toContain("-");
  });
});
```

### Patrón 5: Integration Testing con Prisma

**Usado en:** customer-balance.test.ts

```typescript
describe("customer-balance", () => {
  let testCustomerId: string;

  beforeAll(async () => {
    const customer = await prisma.customer.create({
      data: {
        /* ... */
      },
    });
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    await prisma.customer.deleteMany({ where: { id: testCustomerId } });
  });

  it("debe calcular balances correctamente", async () => {
    const result = await calculateCustomerBalances(testCustomerId);
    expect(result.balanceTotal).toBe(900000);
  });
});
```

### Patrón 6: Mocking de API Calls

**Usado en:** use-payments.test.tsx

```typescript
it("debe manejar error de API", async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "Error al cargar pagos" }),
  });

  const { result } = renderHook(() => usePayments());

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.error?.message).toContain("Error al cargar pagos");
});
```

### Patrón 7: Optimistic Updates y Rollback

**Usado en:** use-payments.test.tsx (deletePayment)

```typescript
it("debe hacer optimistic update", async () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["payments"], initialData);

  global.fetch = vi
    .fn()
    .mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 100))
    );

  const { result } = renderHook(() => useDeletePayment(), { wrapper });
  result.current.mutate("pay-1");

  await waitFor(() => {
    const cachedData = queryClient.getQueryData(["payments"]);
    expect(cachedData?.payments).toHaveLength(1); // Removido inmediatamente
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

---

## 4. UTILIDADES Y HELPERS DE TESTING

### Setup Global

- `vitest.setup.ts` - Configura mocks de APIs del navegador
- `@testing-library/jest-dom` - Custom matchers (toBeInTheDocument, etc)

### Helpers en Tests

- **createWrapper()** - Factory function para QueryClientProvider en React Query tests
- **renderHook()** - Testing Library function para hooks
- **userEvent.setup()** - Simula interacciones realistas del usuario
- **vi.useFakeTimers()** - Timers controlables para tests async
- **act()** - Wrappea actualizaciones de estado en hooks

### Matchers Usados

- `expect(element).toBeInTheDocument()`
- `expect(element).toHaveClass("class-name")`
- `expect(element).toHaveAttribute("attr", "value")`
- `expect(element).toBeDisabled()`
- `expect(result).toBeCloseTo(expected, 2)` - Para decimales
- `expect(result).toMatch(/regex/)`
- `expect(result).toContain("string")`
- `expect(fn).toHaveBeenCalledTimes(1)`

---

## 5. ESTRUCTURA DE CARPETAS DE TESTS

```
Cobrolox/
├── components/
│   └── ui/
│       └── __tests__/          # Tests junto a componentes
│           ├── button.test.tsx
│           └── card.test.tsx
├── hooks/
│   ├── __tests__/
│   │   ├── use-debounce.test.tsx
│   │   └── use-mobile.test.tsx
│   └── queries/
│       └── __tests__/
│           └── use-payments.test.tsx
├── lib/
│   ├── __tests__/
│   │   ├── format.test.ts
│   │   └── utils.test.ts
│   ├── utils/
│   │   └── __tests__/
│   │       └── invoice-utils.test.ts
│   ├── transformers/
│   │   └── __tests__/
│   │       └── payment-transformers.test.ts
│   └── business-logic/
│       └── __tests__/
│           ├── totals.test.ts
│           ├── customer-balance.test.ts
│           ├── payment-fifo.test.ts
│           └── installments.test.ts
├── tests/
│   └── e2e/                    # Tests E2E separados
│       ├── example.spec.ts
│       ├── critical-flow.spec.ts
│       ├── payment-to-customer.spec.ts
│       └── payments.spec.ts
├── vitest.config.mts
├── vitest.setup.ts
└── playwright.config.ts
```

**Convención:** Tests colocados en carpeta `__tests__/` junto al código (colocation)

---

## 6. COBERTURA Y TIPOS DE TESTS

### Por Categoría

| Categoría           | Cantidad | Líneas    | Tipo                        |
| ------------------- | -------- | --------- | --------------------------- |
| Componentes UI      | 2        | ~300      | Snapshot-like + interaction |
| Hooks Custom        | 3        | ~400      | Hook testing + fake timers  |
| React Query         | 1        | 995       | Query/mutation testing      |
| Utilidades          | 3        | ~300      | Pure function testing       |
| Lógica Negocio      | 4        | ~800      | Unit + Integration          |
| **Total Unitarios** | **13**   | **~3200** | **Unit + Integration**      |
| E2E (Playwright)    | 4        | ?         | E2E                         |

### Por Criticidad

**CRÍTICO** (Lógica de Negocio):

- `useCreatePayment()` - Validaciones de allocations, tipos de pago, sumas
- `totals.test.ts` - Cálculos de IVA, validaciones de tasa
- `customer-balance.test.ts` - Balances, vigente vs vencido
- `payment-fifo.test.ts` - Algoritmo FIFO

**IMPORTANTE** (Componentes Base):

- Button, Card - Base components
- useDebounce, useMobile - Common hooks

**SOPORTE** (Utilidades):

- formatters, transformers, invoice-utils

---

## 7. HALLAZGOS CLAVE

### Strengths

✅ **Buena cobertura de lógica crítica** - Validaciones de pagos y cálculos
✅ **Patrones consistentes** - Uso uniforme de vitest + React Testing Library
✅ **Integration tests** - customer-balance.test.ts prueba contra BD real
✅ **Mocking realista** - Global fetch mocks, QueryClient wrapping
✅ **Setup limpio** - vitest.setup.ts maneja mocks de Radix UI y APIs del navegador
✅ **Async handling** - Buen uso de waitFor(), act(), fake timers

### Gaps/Mejoras Posibles

⚠️ **Falta testing de utilidades** - invoice-utils, payment-transformers no revisados
⚠️ **useIsMobile no testea cambios dinámicos** - Limitación de jsdom documentada
⚠️ **Falta snapshot testing** - Card component podría beneficiarse
⚠️ **Cobertura incompleta** - No todos los hooks/utilidades tienen tests
⚠️ **Mock global.fetch** - Aunque funciona, podría usar MSW para más realismo
⚠️ **Falta fixture factories** - Mock data es inline, podría centralizarse

---

## 8. COMANDOS DE TESTING

```bash
# Run all tests in watch mode
npm run test

# Run with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- use-debounce.test.tsx

# Run tests matching pattern
npm run test -- --grep "formatCurrency"

# Run E2E tests (Playwright)
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug

# View E2E report
npm run test:e2e:report
```

---

## 9. PRÓXIMOS PASOS RECOMENDADOS

1. **Completar tests faltantes:**
   - `invoice-utils` utilities
   - `payment-transformers` transformer functions
   - `installments` business logic
   - Componentes de formularios (Form, Input, etc)

2. **Mejorar cobertura:**
   - Añadir snapshot tests para componentes UI complejos
   - Test error boundaries
   - Test integrations con React Query cache invalidation

3. **Optimizar tests:**
   - Centralizar mock data en factories
   - Considerar MSW para mocking de API más realista
   - Documentar patrones en guía de testing

4. **CI/CD:**
   - Ejecutar tests en pipeline antes de merge
   - Coverage gates (e.g., >80%)
   - Separar unitarios (rápidos) de integration tests

---

## 10. REFERENCIAS DOCUMENTALES

Documentación inline en:

- `/vitest.config.mts` - Configuración
- `/vitest.setup.ts` - Global mocks
- `/hooks/queries/__tests__/use-payments.test.tsx` - Patrones avanzados (secciones con comentarios ===)
- `/lib/business-logic/__tests__/customer-balance.test.ts` - Integration patterns

---

**Generado automáticamente para Cobrolox - Template SaaS para Chile**
