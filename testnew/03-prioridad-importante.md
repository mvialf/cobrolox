# 🟠 Tests de Prioridad IMPORTANTE

> **11 archivos - 199 test cases - 107 horas**
>
> Funcionalidad core del sistema. Alta prioridad después de tests críticos.

---

## Resumen

| #   | Archivo                                      | Tests | Horas | Categoría       |
| --- | -------------------------------------------- | ----- | ----- | --------------- |
| 1   | hooks/queries/use-invoices.ts                | 25    | 15    | Hooks Queries   |
| 2   | hooks/queries/use-customers.ts               | 25    | 15    | Hooks Queries   |
| 3   | hooks/queries/use-installments.ts            | 15    | 10    | Hooks Queries   |
| 4   | components/forms/invoice-form.tsx            | 15    | 11.25 | Formularios     |
| 5   | components/forms/payment-to-invoice-form.tsx | 12    | 9     | Formularios     |
| 6   | lib/import/excel-parser.ts                   | 20    | 10    | Importación     |
| 7   | lib/import/customer-import.ts                | 18    | 9     | Importación     |
| 8   | lib/validations/customer-validations.ts      | 20    | 5     | Validaciones    |
| 9   | lib/transformers/invoice-transformers.ts     | 12    | 4.5   | Transformadores |
| 10  | lib/invoice-status.ts                        | 12    | 3     | Lógica Negocio  |
| 11  | components/data-table/data-table.tsx         | 18    | 10.8  | Componentes     |

---

## 1-3. Hooks Queries (React Query)

### Patrón Común - 25 tests por hook

Cada hook de React Query necesita tests de:

#### `useXQuery(params)` - Single query (8 tests)

```typescript
describe("useInvoices", () => {
  it("debe construir query params correctamente", async () => {
    const { result } = renderHook(
      () => useInvoices({ status: "overdue", customerId: "123" }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verificar que fetch fue llamado con URL correcta
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("status=overdue&customerId=123"),
    );
  });

  it("debe transformar datos (parseInvoicesWithBalance)", async () => {
    const mockData = [
      { id: "1", issueDate: "2025-01-01T00:00:00Z", total: 1000, paid: 300 },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useInvoices(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verificar transformación
    expect(result.current.data[0].issueDate).toBeInstanceOf(Date);
    expect(result.current.data[0].balance).toBe(700);
  });

  it("debe manejar errores HTTP", async () => {
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

#### `useCreateX()` - Mutation (6 tests)

```typescript
describe('useCreateInvoice', () => {
  it('debe crear factura', async () => {
    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: createQueryWrapper()
    });

    act(() => {
      result.current.mutate({ number: 'F-001', total: 1000 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('debe invalidar queries relacionadas en onSuccess', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateInvoice(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });

    act(() => {
      result.current.mutate({ number: 'F-001' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(['invoices']);
    expect(invalidateSpy).toHaveBeenCalledWith(['customers']); // Invalidar related
  });
});
```

#### `useUpdateX()` - Optimistic Update (6 tests)

```typescript
describe('useUpdateInvoice', () => {
  it('debe hacer optimistic update', async () => {
    const queryClient = new QueryClient();

    // Setup cache inicial
    queryClient.setQueryData(['invoices'], [
      { id: '1', number: 'F-001', total: 1000 }
    ]);

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

    // Verificar update optimista ANTES de respuesta
    const cached = queryClient.getQueryData(['invoices']);
    expect(cached[0].total).toBe(1500); // Ya actualizado
  });

  it('debe hacer rollback en error', async () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(['invoices'], [
      { id: '1', total: 1000 }
    ]);

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

#### `useDeleteX()` - Cascading Invalidation (5 tests)

```typescript
describe('useDeleteInvoice', () => {
  it('debe invalidar queries en cascada', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteInvoice(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    });

    act(() => {
      result.current.mutate('invoice-id-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Debe invalidar múltiples queries
    expect(invalidateSpy).toHaveBeenCalledWith(['invoices']);
    expect(invalidateSpy).toHaveBeenCalledWith(['customers']); // Customer balance cambia
    expect(invalidateSpy).toHaveBeenCalledWith(['payments']); // Si tenía pagos
  });
});
```

### Aplicar este patrón a:

- ✅ hooks/queries/use-invoices.ts (25 tests)
- ✅ hooks/queries/use-customers.ts (25 tests)
- ✅ hooks/queries/use-installments.ts (15 tests - menos mutations)

---

## 4. components/forms/invoice-form.tsx

**Tests necesarios:** 15 - 11.25 horas

### useEffect: Cálculo automático de IVA y total (6 tests)

```typescript
describe('InvoiceForm - Auto-cálculo IVA', () => {
  it('debe calcular IVA cuando subtotal cambia', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    const subtotalInput = screen.getByLabelText(/subtotal/i);
    await user.type(subtotalInput, '1000');

    // IVA debe ser 190 (19%)
    const ivaInput = screen.getByLabelText(/iva/i);
    expect(ivaInput).toHaveValue(190);

    // Total debe ser 1190
    const totalInput = screen.getByLabelText(/total/i);
    expect(totalInput).toHaveValue(1190);
  });

  it('debe poner IVA = 0 cuando isExemptFromTax = true', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.type(screen.getByLabelText(/subtotal/i), '1000');

    const exemptCheckbox = screen.getByLabelText(/exenta/i);
    await user.click(exemptCheckbox);

    expect(screen.getByLabelText(/iva/i)).toHaveValue(0);
    expect(screen.getByLabelText(/total/i)).toHaveValue(1000);
  });

  it('debe recalcular IVA al desmarcar exención', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.type(screen.getByLabelText(/subtotal/i), '1000');
    await user.click(screen.getByLabelText(/exenta/i)); // Marcar

    expect(screen.getByLabelText(/iva/i)).toHaveValue(0);

    await user.click(screen.getByLabelText(/exenta/i)); // Desmarcar

    expect(screen.getByLabelText(/iva/i)).toHaveValue(190); // Recalculado
  });
});
```

### useEffect: Cálculo de dueDate (4 tests)

```typescript
describe('InvoiceForm - Cálculo dueDate', () => {
  it('debe calcular dueDate = issueDate + termsDay', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.type(screen.getByLabelText(/fecha emisión/i), '2025-01-01');
    await user.type(screen.getByLabelText(/días plazo/i), '30');

    const dueDateInput = screen.getByLabelText(/fecha vencimiento/i);
    expect(dueDateInput).toHaveValue('2025-01-31');
  });

  it('debe actualizar dueDate cuando issueDate cambia', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.type(screen.getByLabelText(/fecha emisión/i), '2025-01-01');
    await user.type(screen.getByLabelText(/días plazo/i), '30');

    // Cambiar issueDate
    await user.clear(screen.getByLabelText(/fecha emisión/i));
    await user.type(screen.getByLabelText(/fecha emisión/i), '2025-02-01');

    expect(screen.getByLabelText(/fecha vencimiento/i)).toHaveValue('2025-03-03'); // +30
  });
});
```

### useEffect: Redondeo CLP (3 tests)

```typescript
describe('InvoiceForm - Redondeo CLP', () => {
  it('debe redondear a entero cuando currency = CLP', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.selectOptions(screen.getByLabelText(/moneda/i), 'CLP');
    await user.type(screen.getByLabelText(/subtotal/i), '1000.50');

    // CLP redondea
    expect(screen.getByLabelText(/subtotal/i)).toHaveValue(1001); // Redondeado
  });

  it('debe mantener 2 decimales cuando currency = USD', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    await user.selectOptions(screen.getByLabelText(/moneda/i), 'USD');
    await user.type(screen.getByLabelText(/subtotal/i), '1000.50');

    expect(screen.getByLabelText(/subtotal/i)).toHaveValue(1000.50); // Sin redondeo
  });
});
```

---

## 5. components/forms/payment-to-invoice-form.tsx

**Tests necesarios:** 12 - 9 horas

### Auto-completado de amount (4 tests)

```typescript
describe('PaymentToInvoiceForm', () => {
  it('debe auto-completar amount con balance de factura', async () => {
    const invoice = { id: '1', number: 'F-001', balance: 500 };
    const user = userEvent.setup();
    render(<PaymentToInvoiceForm invoices={[invoice]} />);

    const selectInvoice = screen.getByLabelText(/factura/i);
    await user.selectOptions(selectInvoice, 'F-001');

    // Amount debe auto-completarse
    expect(screen.getByLabelText(/monto/i)).toHaveValue(500);
  });

  it('debe actualizar amount al cambiar factura', async () => {
    const invoices = [
      { id: '1', number: 'F-001', balance: 500 },
      { id: '2', number: 'F-002', balance: 800 },
    ];
    const user = userEvent.setup();
    render(<PaymentToInvoiceForm invoices={invoices} />);

    await user.selectOptions(screen.getByLabelText(/factura/i), 'F-001');
    expect(screen.getByLabelText(/monto/i)).toHaveValue(500);

    await user.selectOptions(screen.getByLabelText(/factura/i), 'F-002');
    expect(screen.getByLabelText(/monto/i)).toHaveValue(800); // Actualizado
  });
});
```

### Validaciones (8 tests)

```typescript
describe('PaymentToInvoiceForm - Validaciones', () => {
  it('debe validar factura seleccionada en submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToInvoiceForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/seleccione.*factura/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('debe validar amount > 0', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToInvoiceForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/monto/i), '0');
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/monto.*mayor que 0/i)).toBeInTheDocument();
  });

  it('debe validar amount <= balance', async () => {
    const invoice = { id: '1', balance: 500 };
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PaymentToInvoiceForm invoice={invoice} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/monto/i));
    await user.type(screen.getByLabelText(/monto/i), '600'); // > balance

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(screen.getByText(/excede.*balance/i)).toBeInTheDocument();
  });

  it('debe mostrar warning visual si amount > balance', async () => {
    const invoice = { id: '1', balance: 500 };
    const user = userEvent.setup();
    render(<PaymentToInvoiceForm invoice={invoice} />);

    await user.type(screen.getByLabelText(/monto/i), '600');

    // Debe aparecer warning badge/alert
    expect(screen.getByRole('alert')).toHaveTextContent(/excede/i);
  });
});
```

---

## 6-7. Importación (Excel Parser + Customer Import)

### lib/import/excel-parser.ts (20 tests)

```typescript
describe("parseExcelDate", () => {
  it("debe convertir Excel serial a Date", () => {
    // 44927 = 2025-01-01 en Excel
    expect(parseExcelDate(44927)).toEqual(new Date("2025-01-01"));
  });

  it("debe parsear string ISO", () => {
    expect(parseExcelDate("2025-01-01T00:00:00Z")).toBeInstanceOf(Date);
  });

  it("debe retornar Date si ya es Date", () => {
    const date = new Date();
    expect(parseExcelDate(date)).toBe(date);
  });

  it("debe retornar null para null/undefined", () => {
    expect(parseExcelDate(null)).toBeNull();
    expect(parseExcelDate(undefined)).toBeNull();
  });
});

describe("parseExcelDecimal", () => {
  it("debe parsear número", () => {
    expect(parseExcelDecimal(1234.56)).toBe(1234.56);
  });

  it("debe parsear string", () => {
    expect(parseExcelDecimal("1234.56")).toBe(1234.56);
  });

  it("debe parsear string con comas", () => {
    expect(parseExcelDecimal("1,234.56")).toBe(1234.56);
  });

  it("debe retornar 0 para null", () => {
    expect(parseExcelDecimal(null)).toBe(0);
  });

  it("debe lanzar error para string inválido", () => {
    expect(() => parseExcelDecimal("abc")).toThrow();
  });
});
```

### lib/import/customer-import.ts (18 tests)

Similar a invoice-import pero con validación de RUT y email.

---

## 8. lib/validations/customer-validations.ts

**Tests necesarios:** 20 - 5 horas

Similar a invoice-validations pero enfocado en:

- Validación de RUT (usa rut-validations)
- Email válido
- Campos de dirección opcionales
- Batch de clientes (duplicados por RUT)

---

## 9. lib/transformers/invoice-transformers.ts

**Tests necesarios:** 12 - 4.5 horas

```typescript
describe("parseInvoicesWithBalance", () => {
  it("debe convertir ISO strings a Date", () => {
    /* ... */
  });
  it("debe calcular balance = total - paid", () => {
    /* ... */
  });
  it("debe manejar null dates", () => {
    /* ... */
  });
});

describe("transformInvoiceForAPI", () => {
  it("debe limpiar campos opcionales vacíos", () => {
    /* ... */
  });
  it("debe convertir Date a ISO string", () => {
    /* ... */
  });
});
```

---

## 10. lib/invoice-status.ts

**Tests necesarios:** 12 - 3 horas

### Matriz de Estados (3×3)

```typescript
describe("calculateInvoiceStatus", () => {
  describe("facturas pagadas (balance = 0)", () => {
    it('debe retornar "completed" si balance = 0 (sin importar fecha)', () => {
      const invoice = { balance: 0, dueDate: new Date("2024-01-01") };
      expect(calculateInvoiceStatus(invoice)).toBe("completed");
    });
  });

  describe("facturas vencidas (dueDate < now)", () => {
    it('debe retornar "overdue" si balance > 0 y vencida', () => {
      const invoice = {
        balance: 500,
        paid: 0,
        dueDate: new Date("2024-12-01"), // Pasado
      };

      expect(calculateInvoiceStatus(invoice)).toBe("overdue");
    });
  });

  describe("facturas vigentes (dueDate >= now)", () => {
    it('debe retornar "current" si balance > 0 y no vencida', () => {
      const invoice = {
        balance: 500,
        dueDate: new Date("2025-12-31"), // Futuro
      };

      expect(calculateInvoiceStatus(invoice)).toBe("current");
    });
  });
});

describe("calculatePaymentStatus", () => {
  it('debe retornar "pending" si paid = 0', () => {
    expect(calculatePaymentStatus({ paid: 0, balance: 1000 })).toBe("pending");
  });

  it('debe retornar "partial" si paid > 0 && balance > 0', () => {
    expect(calculatePaymentStatus({ paid: 500, balance: 500 })).toBe("partial");
  });

  it('debe retornar "paid" si balance = 0', () => {
    expect(calculatePaymentStatus({ paid: 1000, balance: 0 })).toBe("paid");
  });
});
```

---

## 11. components/data-table/data-table.tsx

**Tests necesarios:** 18 - 10.8 horas

```typescript
describe('DataTable - Estado', () => {
  it('debe actualizar sorting state', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);

    const headerButton = screen.getByRole('button', { name: /nombre/i });
    await user.click(headerButton);

    // Verificar que tabla está ordenada
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Aaa'); // Orden alfabético
  });

  it('debe manejar paginación interna', async () => {
    const data = Array(50).fill({}).map((_, i) => ({ id: i, name: `Item ${i}` }));
    render(<DataTable columns={columns} data={data} pageSize={10} />);

    expect(screen.getByText(/página 1 de 5/i)).toBeInTheDocument();

    // Cambiar página
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/página 2 de 5/i)).toBeInTheDocument();
  });

  it('debe usar paginación externa si manualPagination=true', () => {
    const onPaginationChange = vi.fn();
    render(
      <DataTable
        data={data}
        manualPagination
        pageCount={10}
        onPaginationChange={onPaginationChange}
      />
    );

    // No debe paginar internamente
    expect(screen.getAllByRole('row')).toHaveLength(data.length + 1);
  });
});
```

---

## ✅ Checklist

### Hooks Queries (40 hrs)

- [ ] hooks/queries/use-invoices.ts
- [ ] hooks/queries/use-customers.ts
- [ ] hooks/queries/use-installments.ts

### Formularios (20.25 hrs)

- [ ] components/forms/invoice-form.tsx
- [ ] components/forms/payment-to-invoice-form.tsx

### Importación (19 hrs)

- [ ] lib/import/excel-parser.ts
- [ ] lib/import/customer-import.ts

### Validaciones/Transformadores (12.5 hrs)

- [ ] lib/validations/customer-validations.ts
- [ ] lib/transformers/invoice-transformers.ts
- [ ] lib/invoice-status.ts

### Componentes (10.8 hrs)

- [ ] components/data-table/data-table.tsx

---

**Total Importante:** 199 test cases - 107 horas

**Próximo:** [04-prioridad-deseable.md](./04-prioridad-deseable.md)
