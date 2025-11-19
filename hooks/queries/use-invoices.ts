import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  InvoiceWithBalance,
  InvoiceWithBalanceSerialized,
} from "@/lib/validations/payment-validations";
import type { InvoiceFormData } from "@/lib/validations/invoice-validations";

/**
 * Hooks de React Query para Invoices
 *
 * Convenciones:
 * - Query keys: ['invoices'] para list, ['invoices', id] para single
 * - Soporta filtros: customerId, withBalance, pendingOnly
 * - Mutations invalidan queries relacionadas automáticamente
 */

// ============================================================================
// TYPES
// ============================================================================

/** Params para GET /api/invoices */
export interface InvoicesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  withBalance?: boolean; // Calcular balance (total - paidAmount)
  pendingOnly?: boolean; // Solo facturas con balance > 0
  includeCompleted?: boolean; // Incluir facturas completadas
}

/** Respuesta de GET /api/invoices */
export interface InvoicesResponse {
  invoices: InvoiceWithBalance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// QUERY: GET LIST WITH BALANCE
// ============================================================================

/**
 * Hook para obtener lista de facturas con balance calculado
 *
 * Este hook es CR�TICO para el sistema de pagos porque:
 * 1. Calcula el balance (saldo pendiente) de cada factura
 * 2. Permite filtrar solo facturas pendientes de pago
 * 3. Parsea las fechas correctamente para l�gica FIFO
 *
 * @example
 * // Obtener facturas pendientes de un cliente para FIFO
 * const { data } = useInvoices({
 *   customerId: 'abc-123',
 *   withBalance: true,
 *   pendingOnly: true,
 *   limit: 100,
 * })
 *
 * @example
 * // Buscar facturas por n�mero o cliente
 * const { data } = useInvoices({
 *   search: 'F-001',
 *   withBalance: true,
 * })
 */
export function useInvoices(params: InvoicesQueryParams = {}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async (): Promise<InvoicesResponse> => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.search) searchParams.set("search", params.search);
      if (params.customerId) searchParams.set("customerId", params.customerId);
      if (params.withBalance) searchParams.set("withBalance", "true");
      if (params.pendingOnly) searchParams.set("pendingOnly", "true");
      if (params.includeCompleted !== undefined)
        searchParams.set("includeCompleted", String(params.includeCompleted));

      const response = await fetch(`/api/invoices?${searchParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cargar facturas");
      }

      const data = await response.json();

      // Si withBalance=true, las facturas tienen campos issueDate y dueDate como strings
      // Necesitamos parsearlos a Date objects para que FIFO funcione correctamente
      if (params.withBalance && data.invoices) {
        const { parseInvoicesWithBalance } = await import(
          "@/lib/validations/payment-validations"
        );
        return {
          ...data,
          invoices: parseInvoicesWithBalance(
            data.invoices as InvoiceWithBalanceSerialized[]
          ),
        };
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook especializado para obtener facturas pendientes de un cliente
 *
 * Alias conveniente para el caso de uso más común en pagos:
 * obtener solo facturas con balance pendiente para distribución FIFO.
 *
 * @example
 * const { data, isLoading } = usePendingInvoices('customer-id-123')
 */
export function usePendingInvoices(customerId: string | undefined) {
  return useInvoices({
    customerId,
    withBalance: true,
    pendingOnly: true,
    limit: 100, // Traer todas las pendientes (límite alto)
  });
}

// ============================================================================
// MUTATION: CREATE
// ============================================================================

/**
 * Hook para crear una nueva factura
 *
 * **VALIDACIONES:**
 * - invoiceNumber único (validado en backend)
 * - customerId válido (validado en backend)
 * - total > 0
 * - dueDate >= issueDate
 *
 * **INVALIDACIONES AUTOMÁTICAS:**
 * - `['invoices']` → Refetch lista de facturas
 * - `['customers']` → Refetch clientes (balance puede cambiar)
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const createInvoice = useCreateInvoice()
 *
 * const handleSubmit = async (data: InvoiceFormData) => {
 *   try {
 *     await createInvoice.mutateAsync(data)
 *     toast.success('Factura creada')
 *   } catch (error) {
 *     // Error ya manejado por el hook (toast automático)
 *   }
 * }
 * ```
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InvoiceFormData): Promise<InvoiceWithBalance> => {
      // Eliminar termsDay del payload - solo es para UI
      const { termsDay: _, ...invoiceData } = data;

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear factura");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          // Invalidar todas las queries de invoices
          if (key === "invoices") return true;

          // Invalidar customers (si se muestra balance total del cliente)
          if (key === "customers") return true;

          return false;
        },
      });

      toast.success("Factura creada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error("Error creating invoice:", error);
    },
  });
}

// ============================================================================
// MUTATION: UPDATE
// ============================================================================

/**
 * Hook para actualizar una factura existente
 *
 * **RESTRICCIÓN:**
 * - No se puede editar si tiene pagos asociados (validado en backend)
 *
 * **INVALIDACIONES:**
 * - `['invoices']` → Refetch lista
 * - `['invoices', id]` → Refetch individual
 * - `['customers']` → Refetch clientes (balance puede cambiar)
 * - `['payments']` → Refetch pagos (allocations pueden mostrar data vieja)
 *
 * @example
 * ```tsx
 * const updateInvoice = useUpdateInvoice()
 *
 * updateInvoice.mutate({
 *   id: 'abc-123',
 *   data: { total: 150000, ... }
 * })
 * ```
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: InvoiceFormData;
    }): Promise<InvoiceWithBalance> => {
      // Eliminar termsDay del payload
      const { termsDay: _, ...invoiceData } = data;

      const response = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar factura");
      }

      return response.json();
    },
    onSuccess: (_updatedInvoice) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          // Invalidar invoices
          if (key === "invoices") return true;

          // Invalidar customers (balance puede haber cambiado)
          if (key === "customers") return true;

          // Invalidar payments (allocations muestran invoice data)
          if (key === "payments") return true;

          return false;
        },
      });

      toast.success("Factura actualizada exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error("Error updating invoice:", error);
    },
  });
}

// ============================================================================
// MUTATION: DELETE (con Optimistic Update)
// ============================================================================

/**
 * Hook para eliminar una factura
 *
 * **COMPORTAMIENTO:**
 * - Soft delete o hard delete según configuración backend
 * - Optimistic update: Remueve de UI inmediatamente (rollback si falla)
 *
 * **RESTRICCIÓN:**
 * - No se puede eliminar si tiene pagos asociados (validado en backend)
 *
 * **INVALIDACIONES:**
 * - `['invoices']` → Refetch lista de facturas
 * - `['customers']` → Refetch clientes (balance se libera)
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const deleteInvoice = useDeleteInvoice()
 *
 * <Button
 *   onClick={() => deleteInvoice.mutate(invoice.id)}
 *   disabled={deleteInvoice.isPending && deleteInvoice.variables === invoice.id}
 * >
 *   Eliminar
 * </Button>
 * ```
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar factura");
      }
    },
    // ✅ Optimistic update: remover del UI inmediatamente
    onMutate: async (id) => {
      // Cancel in-flight queries para evitar override
      await queryClient.cancelQueries({ queryKey: ["invoices"] });

      // Snapshot del estado anterior (para rollback si falla)
      const previousData = queryClient.getQueryData(["invoices"]);

      // Optimistic update: remover invoice de todas las queries
      queryClient.setQueriesData<InvoicesResponse>(
        { queryKey: ["invoices"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            invoices: old.invoices.filter((inv) => inv.id !== id),
          };
        }
      );

      return { previousData };
    },
    // ✅ Rollback en caso de error
    onError: (error: Error, id, context) => {
      // Restaurar estado anterior
      if (context?.previousData) {
        queryClient.setQueryData(["invoices"], context.previousData);
      }
      toast.error(error.message);
      console.error("Error deleting invoice:", error);
    },
    // ✅ Refetch para asegurar consistencia
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          // Invalidar invoices
          if (key === "invoices") return true;

          // Invalidar customers (balance se liberó)
          if (key === "customers") return true;

          return false;
        },
      });

      toast.success("Factura eliminada exitosamente");
    },
  });
}
