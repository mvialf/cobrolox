# 💡 Patrones de Testing

> Ejemplos de código y patrones específicos del proyecto Cobrolox

---

## 📚 Índice

1. [Configuración Vitest](#configuración-vitest)
2. [Testing Zod Schemas](#testing-zod-schemas)
3. [Testing React Hook Form](#testing-react-hook-form)
4. [Testing React Query](#testing-react-query)
5. [Testing Hooks Personalizados](#testing-hooks-personalizados)
6. [Testing Componentes](#testing-componentes)
7. [Mocking](#mocking)

---

## Configuración Vitest

### vitest.config.mts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", ".next/**", "**/*.config.ts", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### vitest.setup.ts

```typescript
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup después de cada test
afterEach(() => {
  cleanup();
});

// Mocks globales
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Testing Zod Schemas

### Patrón: Validación de Schemas

```typescript
import { describe, it, expect } from "vitest";
import { invoiceSchema } from "@/lib/validations/invoice-validations";

describe("invoiceSchema", () => {
  const validData = {
    customerId: "123",
    number: "F-001",
    subtotal: 1000,
    IVA: 190,
    total: 1190,
  };

  it("debe validar datos correctos", () => {
    // Usar parse (lanza error si falla)
    expect(() => invoiceSchema.parse(validData)).not.toThrow();

    // O usar safeParse (retorna objeto)
    const result = invoiceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("debe rechazar datos inválidos", () => {
    const invalid = { ...validData, total: 1000 }; // Total incorrecto

    expect(() => invoiceSchema.parse(invalid)).toThrow();

    const result = invoiceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("total");
    }
  });

  it("debe transformar datos", () => {
    const withTransform = invoiceSchema.parse(validData);
    // Verificar transformaciones aplicadas
    expect(withTransform.number).toBe("F-001");
  });
});
```

---

## Testing React Hook Form

### Patrón: Formularios con Validación

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceForm } from '@/components/forms/invoice-form';

describe('InvoiceForm', () => {
  it('debe mostrar errores de validación', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<InvoiceForm onSubmit={onSubmit} />);

    // Submit sin llenar campos
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // Verificar errores
    expect(await screen.findByText(/número es requerido/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('debe llamar onSubmit con datos válidos', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<InvoiceForm onSubmit={onSubmit} />);

    // Llenar formulario
    await user.type(screen.getByLabelText(/número/i), 'F-001');
    await user.type(screen.getByLabelText(/subtotal/i), '1000');

    // Submit
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    // Verificar llamada
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        number: 'F-001',
        subtotal: 1000,
      })
    );
  });

  it('debe limpiar errores al corregir', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    // Submit vacío
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText(/número es requerido/i)).toBeInTheDocument();

    // Corregir
    await user.type(screen.getByLabelText(/número/i), 'F-001');

    // Error desaparece
    expect(screen.queryByText(/número es requerido/i)).not.toBeInTheDocument();
  });
});
```

---

## Testing React Query

### Patrón: Query Helper

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // No retry en tests
        cacheTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Patrón: Testing Query

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useInvoices } from "@/hooks/queries/use-invoices";
import { createQueryWrapper } from "./test-utils";

describe("useInvoices", () => {
  it("debe fetchear invoices", async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "1", number: "F-001", total: 1000 }],
    });

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createQueryWrapper(),
    });

    // Inicial: loading
    expect(result.current.isLoading).toBe(true);

    // Esperar success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verificar datos
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].number).toBe("F-001");
  });

  it("debe manejar errores", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
```

### Patrón: Testing Mutation con Optimistic Update

```typescript
import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';

describe('useUpdateInvoice', () => {
  it('debe hacer optimistic update', async () => {
    const queryClient = new QueryClient();

    // Setup cache inicial
    queryClient.setQueryData(['invoices'], [
      { id: '1', total: 1000 }
    ]);

    const { result } = renderHook(() => useUpdateInvoice(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });

    // Ejecutar mutación
    act(() => {
      result.current.mutate({ id: '1', total: 1500 });
    });

    // Verificar update optimista ANTES de respuesta
    const cached = queryClient.getQueryData(['invoices']);
    expect(cached[0].total).toBe(1500);

    // Esperar success
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('debe hacer rollback en error', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['invoices'], [{ id: '1', total: 1000 }]);

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useUpdateInvoice(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });

    act(() => {
      result.current.mutate({ id: '1', total: 1500 });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verificar rollback
    const cached = queryClient.getQueryData(['invoices']);
    expect(cached[0].total).toBe(1000); // Volvió al valor original
  });
});
```

---

## Testing Hooks Personalizados

### Patrón: Hook Simple

```typescript
import { renderHook, act } from "@testing-library/react";
import { useRutInput } from "@/hooks/use-rut-input";

describe("useRutInput", () => {
  it("debe formatear RUT automáticamente", () => {
    const { result } = renderHook(() => useRutInput());

    act(() => {
      result.current.setValue("123456789");
    });

    expect(result.current.formattedValue).toBe("12.345.678-9");
    expect(result.current.cleanValue).toBe("123456789");
  });

  it("debe validar RUT", () => {
    const { result } = renderHook(() => useRutInput());

    // RUT válido
    act(() => {
      result.current.setValue("12.345.678-9");
    });
    expect(result.current.isValid).toBe(true);

    // RUT inválido
    act(() => {
      result.current.setValue("12.345.678-0");
    });
    expect(result.current.isValid).toBe(false);
  });
});
```

### Patrón: Hook con Timers

```typescript
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";
import { vi } from "vitest";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("debe debouncer valor", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    expect(result.current).toBe("initial");

    // Cambiar valor
    rerender({ value: "updated", delay: 500 });

    // Aún no actualizado
    expect(result.current).toBe("initial");

    // Avanzar tiempo
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Ahora sí actualizado
    expect(result.current).toBe("updated");
  });
});
```

---

## Testing Componentes

### Patrón: Componente Básico

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('debe renderizar children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('debe llamar onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('debe estar disabled', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('debe aplicar variant', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
```

### Patrón: Componente con Usuario Interaction

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from '@/components/custom/todo/todo-list';

describe('TodoList', () => {
  it('debe agregar todo', async () => {
    const user = userEvent.setup();
    render(<TodoList />);

    const input = screen.getByPlaceholderText(/nueva tarea/i);
    await user.type(input, 'Comprar leche');
    await user.click(screen.getByRole('button', { name: /agregar/i }));

    expect(screen.getByText('Comprar leche')).toBeInTheDocument();
    expect(input).toHaveValue(''); // Input limpio
  });

  it('debe alternar completado', async () => {
    const user = userEvent.setup();
    render(<TodoList initialTodos={[{ id: '1', text: 'Tarea', completed: false }]} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('debe eliminar con confirmación', async () => {
    const user = userEvent.setup();
    render(<TodoList initialTodos={[{ id: '1', text: 'Tarea' }]} />);

    // Click eliminar
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // Aparece dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Confirmar
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    // Tarea eliminada
    expect(screen.queryByText('Tarea')).not.toBeInTheDocument();
  });
});
```

---

## Mocking

### Mock de fetch global

```typescript
beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("debe fetchear datos", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: "test" }),
  });

  const result = await fetchData();
  expect(result).toEqual({ data: "test" });
});
```

### Mock de módulos

```typescript
// Mock completo
vi.mock("@/lib/rut-validations", () => ({
  validateRUT: vi.fn(() => true),
  cleanRUT: vi.fn((rut) => rut),
}));

// Mock parcial
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    cn: vi.fn((...args) => args.join(" ")),
  };
});
```

### Mock de Date/Time

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01"));
});

afterEach(() => {
  vi.useRealTimers();
});

it("debe usar fecha mockeada", () => {
  expect(new Date()).toEqual(new Date("2025-01-01"));
});
```

---

## 🎯 Best Practices

1. **Arrange-Act-Assert:** Estructura clara
2. **Un concepto por test:** Tests enfocados
3. **Descriptive names:** `debe hacer X cuando Y`
4. **Setup/Teardown:** beforeEach/afterEach para limpieza
5. **Avoid implementation details:** Testear comportamiento, no implementación
6. **Use data-testid solo si necesario:** Preferir queries semánticas (getByRole, getByLabelText)

---

**Última actualización:** 2025-11-11
