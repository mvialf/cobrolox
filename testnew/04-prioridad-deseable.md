# 🟡 Tests de Prioridad DESEABLE

> **7 archivos - 83 test cases - 36 horas**
>
> Nice to have. Mejora confianza en refactors y calidad general.

---

## Resumen

| #   | Archivo                                            | Tests | Horas |
| --- | -------------------------------------------------- | ----- | ----- |
| 1   | hooks/use-todo-list.ts                             | 18    | 6     |
| 2   | components/custom/todo/todo-list.tsx               | 15    | 9     |
| 3   | components/custom/todo/todo-list-field.tsx         | 10    | 6     |
| 4   | lib/alerts/balance-alerts.ts                       | 10    | 5     |
| 5   | lib/regiones-chile.ts                              | 10    | 2.5   |
| 6   | components/data-table/data-table-column-header.tsx | 8     | 4.8   |
| 7   | Expansión de tests existentes                      | 20    | 8     |

---

## 1. hooks/use-todo-list.ts (18 tests)

### Modo no controlado - Estado interno

```typescript
describe("useTodoList - No controlado", () => {
  it("debe agregar todo con UUID", () => {
    const { result } = renderHook(() => useTodoList());

    act(() => {
      result.current.addTodo("Nueva tarea");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBeDefined();
    expect(result.current.todos[0].text).toBe("Nueva tarea");
    expect(result.current.todos[0].completed).toBe(false);
  });

  it("debe hacer trim de texto", () => {
    const { result } = renderHook(() => useTodoList());

    act(() => {
      result.current.addTodo("  Tarea con espacios  ");
    });

    expect(result.current.todos[0].text).toBe("Tarea con espacios");
  });

  it("debe rechazar texto vacío", () => {
    const { result } = renderHook(() => useTodoList());

    act(() => {
      result.current.addTodo("   ");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("debe alternar completed", () => {
    const { result } = renderHook(() =>
      useTodoList({
        initialTodos: [{ id: "1", text: "Tarea", completed: false }],
      }),
    );

    act(() => {
      result.current.toggleTodo("1");
    });

    expect(result.current.todos[0].completed).toBe(true);

    act(() => {
      result.current.toggleTodo("1");
    });

    expect(result.current.todos[0].completed).toBe(false);
  });

  it("debe eliminar todo", () => {
    const { result } = renderHook(() =>
      useTodoList({
        initialTodos: [{ id: "1", text: "Tarea" }],
      }),
    );

    act(() => {
      result.current.deleteTodo("1");
    });

    expect(result.current.todos).toHaveLength(0);
  });
});
```

### Modo controlado

```typescript
describe("useTodoList - Controlado", () => {
  it("debe llamar onTodosChange al agregar", () => {
    const onTodosChange = vi.fn();
    const { result } = renderHook(() =>
      useTodoList({
        todos: [],
        onTodosChange,
      }),
    );

    act(() => {
      result.current.addTodo("Nueva tarea");
    });

    expect(onTodosChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ text: "Nueva tarea" }),
      ]),
    );
  });

  it("no debe modificar estado interno en modo controlado", () => {
    const onTodosChange = vi.fn();
    const { result } = renderHook(() =>
      useTodoList({
        todos: [{ id: "1", text: "Tarea externa" }],
        onTodosChange,
      }),
    );

    expect(result.current.todos).toEqual([{ id: "1", text: "Tarea externa" }]);

    act(() => {
      result.current.addTodo("Nueva");
    });

    // Estado no cambia, solo llama callback
    expect(result.current.todos).toEqual([{ id: "1", text: "Tarea externa" }]);
  });
});
```

### Estadísticas

```typescript
describe("useTodoList - Estadísticas", () => {
  it("debe calcular stats.total", () => {
    const { result } = renderHook(() =>
      useTodoList({
        initialTodos: [
          { id: "1", text: "A", completed: false },
          { id: "2", text: "B", completed: true },
        ],
      }),
    );

    expect(result.current.stats.total).toBe(2);
  });

  it("debe calcular stats.completed", () => {
    const { result } = renderHook(() =>
      useTodoList({
        initialTodos: [
          { id: "1", text: "A", completed: false },
          { id: "2", text: "B", completed: true },
          { id: "3", text: "C", completed: true },
        ],
      }),
    );

    expect(result.current.stats.completed).toBe(2);
  });

  it("debe calcular stats.pending", () => {
    const { result } = renderHook(() =>
      useTodoList({
        initialTodos: [
          { id: "1", text: "A", completed: false },
          { id: "2", text: "B", completed: true },
        ],
      }),
    );

    expect(result.current.stats.pending).toBe(1);
  });
});
```

---

## 2-3. Componentes TODO (25 tests)

### todo-list.tsx (15 tests)

- Auto-sort de completadas
- Dialog de confirmación
- Focus management
- Keyboard handlers

### todo-list-field.tsx (10 tests)

- React Hook Form integration
- Error display
- Disabled state
- Validation

---

## 4. lib/alerts/balance-alerts.ts (10 tests)

```typescript
describe("formatBalanceFailureMessage", () => {
  it("debe formatear mensaje para Slack", () => {
    const customer = { name: "Cliente A", rut: "12.345.678-9" };
    const failures = [
      {
        invoiceNumber: "F-001",
        balance: 1000,
        dueDate: new Date("2025-01-01"),
      },
    ];

    const message = formatBalanceFailureMessage(customer, failures);

    expect(message).toContain("Cliente A");
    expect(message).toContain("12.345.678-9");
    expect(message).toContain("F-001");
    expect(message).toContain("$1,000");
  });

  it("debe manejar múltiples facturas", () => {
    const failures = [
      { invoiceNumber: "F-001", balance: 1000 },
      { invoiceNumber: "F-002", balance: 2000 },
    ];

    const message = formatBalanceFailureMessage(customer, failures);

    expect(message).toContain("F-001");
    expect(message).toContain("F-002");
    expect(message).toContain("Total: $3,000");
  });
});

describe("sendSlackAlert", () => {
  it("debe enviar mensaje a Slack", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await sendSlackAlert("Test message");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("slack.com"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Test message"),
      }),
    );
  });

  it("debe manejar errores HTTP", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(sendSlackAlert("Test")).rejects.toThrow();
  });
});
```

---

## 5. lib/regiones-chile.ts (10 tests)

```typescript
describe("getRegionById", () => {
  it("debe retornar región correcta", () => {
    const region = getRegionById("13"); // Región Metropolitana
    expect(region).toEqual({
      id: "13",
      nombre: "Región Metropolitana de Santiago",
    });
  });

  it("debe retornar null si no existe", () => {
    expect(getRegionById("99")).toBeNull();
  });
});

describe("getComunasByRegionId", () => {
  it("debe filtrar comunas por región", () => {
    const comunas = getComunasByRegionId("13");
    expect(comunas).toContainEqual(
      expect.objectContaining({ nombre: "Santiago" }),
    );
    expect(comunas).toContainEqual(
      expect.objectContaining({ nombre: "Providencia" }),
    );
  });

  it("debe retornar array vacío si región no existe", () => {
    expect(getComunasByRegionId("99")).toEqual([]);
  });
});

describe("getRegionByComunaId", () => {
  it("debe navegar relación comuna → región", () => {
    const region = getRegionByComunaId("13101"); // Santiago
    expect(region.id).toBe("13");
  });
});
```

---

## 6. components/data-table/data-table-column-header.tsx (8 tests)

```typescript
describe('DataTableColumnHeader', () => {
  it('debe mostrar dropdown si columna es sorteable', () => {
    render(
      <DataTableColumnHeader column={mockSorteableColumn} title="Nombre" />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('no debe mostrar dropdown si no es sorteable', () => {
    render(
      <DataTableColumnHeader column={mockNonSorteableColumn} title="Acciones" />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('debe alternar sorting asc/desc', async () => {
    const user = userEvent.setup();
    const toggleSorting = vi.fn();

    render(
      <DataTableColumnHeader column={{ toggleSorting }} title="Nombre" />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText(/ascendente/i));

    expect(toggleSorting).toHaveBeenCalledWith(false); // asc
  });

  it('debe ocultar columna', async () => {
    const user = userEvent.setup();
    const toggleVisibility = vi.fn();

    render(
      <DataTableColumnHeader
        column={{ toggleVisibility }}
        title="Nombre"
      />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText(/ocultar/i));

    expect(toggleVisibility).toHaveBeenCalledWith(false);
  });
});
```

---

## 7. Expansión de Tests Existentes (20 tests)

### invoice-utils.test.ts

- parseInvoicesWithBalance edge cases
- calculateInvoiceBalance con allocations
- isInvoiceOverdue con timezone

### installments.test.ts

- ✅ YA CUBIERTO en prioridad crítica

### payment-transformers.test.ts

- Transformación con allocations vacías
- Tipo "project" vs "customer" validación

### utils.test.ts

- cn() className utility
- Otros helpers

---

## ✅ Checklist

### Componentes TODO (21 hrs)

- [ ] hooks/use-todo-list.ts
- [ ] components/custom/todo/todo-list.tsx
- [ ] components/custom/todo/todo-list-field.tsx

### Utilidades (12 hrs)

- [ ] lib/alerts/balance-alerts.ts
- [ ] lib/regiones-chile.ts
- [ ] components/data-table/data-table-column-header.tsx

### Expansión (8 hrs)

- [ ] invoice-utils.test.ts
- [ ] payment-transformers.test.ts
- [ ] utils.test.ts

---

**Total Deseable:** 83 test cases - 36 horas

**Próximo:** [05-plan-implementacion.md](./05-plan-implementacion.md)
