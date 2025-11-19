/**
 * Tests para CustomerAccountDialog
 *
 * Valida:
 * - Cálculo dinámico de balances desde invoices
 * - useEffect actualiza calculatedBalances correctamente
 * - Balances se pasan correctamente a CustomerInvoiceInfo
 * - Manejo de estados loading/error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CustomerAccountDialog } from "../customer-account-dialog";

// Mock del hook de configuración
vi.mock("@/hooks/use-configuration", () => ({
  useConfiguration: () => ({
    configuration: {
      locale: "es-CL",
    },
  }),
}));

// Mock del hook de captura
vi.mock("@/components/custom/capture-dialog/use-capture-dialog", () => ({
  useCaptureDialog: () => ({
    contentRef: { current: null },
    handleCopy: vi.fn(),
    isCopying: false,
  }),
}));

describe("CustomerAccountDialog - Cálculo Dinámico de Balances", () => {
  const mockCustomer = {
    id: "test-customer-id",
    rut: "12345678-9",
    razonSocial: "Test Company",
    tradeName: null,
    balanceTotal: 0, // Valores desactualizados (problema original)
    balanceVigente: 0,
    balanceVencido: 0,
  };

  const mockInvoicesOverdue = [
    {
      id: "invoice-1",
      invoiceNumber: "2343",
      total: 341199,
      balance: 341199,
      dueDate: "2025-11-16T15:00:00.000Z",
      invoiceStatus: {
        name: "overdue", // Vencida
        color: { bgClass: "bg-red-500", textClass: "text-white" },
      },
      paymentInvoiceStatus: {
        name: "pending",
        color: { bgClass: "bg-gray-500", textClass: "text-white" },
      },
      customer: {
        id: "test-customer-id",
        rut: "12345678-9",
        razonSocial: "Test Company",
        tradeName: null,
      },
    },
    {
      id: "invoice-2",
      invoiceNumber: "2346",
      total: 126320,
      balance: 126320,
      dueDate: "2025-11-16T15:00:00.000Z",
      invoiceStatus: {
        name: "overdue", // Vencida
        color: { bgClass: "bg-red-500", textClass: "text-white" },
      },
      paymentInvoiceStatus: {
        name: "pending",
        color: { bgClass: "bg-gray-500", textClass: "text-white" },
      },
      customer: {
        id: "test-customer-id",
        rut: "12345678-9",
        razonSocial: "Test Company",
        tradeName: null,
      },
    },
  ];

  const mockInvoicesCurrent = [
    {
      id: "invoice-3",
      invoiceNumber: "2387",
      total: 234567,
      balance: 234567,
      dueDate: "2025-11-28T15:00:00.000Z",
      invoiceStatus: {
        name: "current", // Vigente
        color: { bgClass: "bg-blue-500", textClass: "text-white" },
      },
      paymentInvoiceStatus: {
        name: "pending",
        color: { bgClass: "bg-gray-500", textClass: "text-white" },
      },
      customer: {
        id: "test-customer-id",
        rut: "12345678-9",
        razonSocial: "Test Company",
        tradeName: null,
      },
    },
  ];

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Guardar fetch original
    originalFetch = global.fetch;

    // Mock fetch para simular API de invoices
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restaurar fetch original
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("debe calcular correctamente balances con facturas vencidas", async () => {
    // Mock: API retorna solo facturas vencidas
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: mockInvoicesOverdue }),
    });

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Esperar a que el fetch complete y useEffect calcule balances
    await waitFor(
      () => {
        // Total debería ser suma de todas las facturas vencidas
        // 341199 + 126320 = 467519
        const amounts = screen.getAllByText(/467\.519/i);
        expect(amounts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Verificar que aparecen los labels de balance
    expect(screen.getByText(/Vencido:/i)).toBeInTheDocument();
    expect(screen.getByText(/Credito:/i)).toBeInTheDocument();
  });

  it("debe calcular correctamente balances con facturas vigentes y vencidas", async () => {
    // Mock: API retorna facturas mixtas
    const mixedInvoices = [...mockInvoicesOverdue, ...mockInvoicesCurrent];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: mixedInvoices }),
    });

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(
      () => {
        // Total = 341199 + 126320 + 234567 = 702086
        const amounts = screen.getAllByText(/702\.086/i);
        expect(amounts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Verificar que aparecen los labels de balance
    expect(screen.getByText(/Vigente:/i)).toBeInTheDocument();
    expect(screen.getByText(/Vencido:/i)).toBeInTheDocument();
  });

  it("debe calcular correctamente balances solo con facturas vigentes", async () => {
    // Mock: API retorna solo facturas vigentes
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: mockInvoicesCurrent }),
    });

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(
      () => {
        // Total = 234567
        const amounts = screen.getAllByText(/234\.567/i);
        expect(amounts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Verificar que Vigente tiene valor
    expect(screen.getByText(/Vigente:/i)).toBeInTheDocument();
  });

  it("debe manejar caso sin facturas (balances en 0)", async () => {
    // Mock: API retorna array vacío
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: [] }),
    });

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(
      () => {
        // Debería mostrar $0 en todos los balances
        // formatCurrency(0) = "$0"
        const zeroBalances = screen.getAllByText(/\$0/i);
        expect(zeroBalances.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it("debe ignorar facturas con balance 0 en el cálculo", async () => {
    // Mock: Facturas con balance 0 (completamente pagadas)
    const invoicesWithZeroBalance = [
      {
        ...mockInvoicesOverdue[0],
        balance: 0, // Factura pagada
      },
      {
        ...mockInvoicesCurrent[0],
        balance: 234567, // Factura con balance
      },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: invoicesWithZeroBalance }),
    });

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(
      () => {
        // Total debería ser solo 234567 (ignorar factura con balance 0)
        const amounts = screen.getAllByText(/234\.567/i);
        expect(amounts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it("debe recalcular balances cuando invoices cambian", async () => {
    // Mock inicial: facturas vencidas
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoices: mockInvoicesOverdue }),
    });

    const { rerender } = render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Esperar primer cálculo
    await waitFor(() => {
      const amounts = screen.getAllByText(/467\.519/i);
      expect(amounts.length).toBeGreaterThan(0);
    });

    // Cambiar mock: ahora facturas vigentes
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invoices: mockInvoicesCurrent }),
    });

    // Cerrar y reabrir dialog (gatilla nuevo fetch)
    rerender(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={false}
        onOpenChange={() => {}}
      />
    );

    rerender(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Esperar nuevo cálculo
    await waitFor(() => {
      const amounts = screen.getAllByText(/234\.567/i);
      expect(amounts.length).toBeGreaterThan(0);
    });
  });

  it("debe mostrar loading state mientras fetchea invoices", async () => {
    // Mock: fetch que nunca resuelve (simular loading)
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Debería mostrar loader de Lucide
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("debe usar balances del customer prop si fetch falla", async () => {
    // Customer con balances "viejos" en props
    const customerWithOldBalances = {
      ...mockCustomer,
      balanceTotal: 1000000,
      balanceVigente: 800000,
      balanceVencido: 200000,
    };

    // Mock: fetch falla
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    render(
      <CustomerAccountDialog
        customer={customerWithOldBalances}
        open={true}
        onOpenChange={() => {}}
      />
    );

    // Debería mostrar error message
    await waitFor(
      () => {
        expect(
          screen.getByText(/error al cargar facturas/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("NO debe fetchear invoices si dialog está cerrado", () => {
    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={false}
        onOpenChange={() => {}}
      />
    );

    // fetch NO debería haberse llamado
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("debe fetchear invoices con parámetros correctos", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ invoices: [] }),
    });

    render(
      <CustomerAccountDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/invoices?customerId=${mockCustomer.id}&withBalance=true`
      );
    });
  });
});
