import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hooks de React Query para Installments
 *
 * Convenciones:
 * - Query keys: ['installments'] para list, ['installments', id] para single
 * - Los installments solo se pueden actualizar (mark as paid), no crear/eliminar directamente
 * - Se crean automáticamente cuando se crea un Payment con selectedInstallments > 1
 * - Mutations invalidan queries relacionadas automáticamente
 */

// ============================================================================
// TYPES
// ============================================================================

/** Params para GET /api/installments */
export interface InstallmentsQueryParams {
  page?: number;
  limit?: number;
  status?: "pending" | "paid";
  paymentId?: string;
  customerId?: string;
}

/** Installment type (simplificado para query) */
export interface Installment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  payment: {
    id: string;
    amount: number;
    currency: string;
    date: string;
    reference: string | null;
    status: string;
    selectedInstallments: number | null;
    customer: {
      id: string;
      name: string;
    };
    paymentMethod: {
      id: string;
      name: string;
    };
    allocations: Array<{
      id: string;
      allocatedAmount: number;
      project: {
        id: string;
        projectNumber: string;
        projectName: string | null;
      };
    }>;
  };
}

/** Stats agregadas de installments (calculadas en backend sobre el total) */
export interface InstallmentsStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
}

/** Respuesta de GET /api/installments */
export interface InstallmentsResponse {
  installments: Installment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: InstallmentsStats;
}

// ============================================================================
// QUERY: GET LIST
// ============================================================================

/**
 * Hook para obtener lista de cuotas con filtros
 *
 * @param params - Filtros opcionales
 * @param params.page - Número de página (default: 1)
 * @param params.limit - Registros por página (default: 1000)
 * @param params.status - Filtrar por estado: "pending" | "paid"
 * @param params.paymentId - Filtrar por pago específico
 * @param params.customerId - Filtrar por cliente
 *
 * @returns Query con installments
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useInstallments({
 *   limit: 100,
 *   status: 'pending'
 * })
 * ```
 */
export function useInstallments(params: InstallmentsQueryParams = {}) {
  return useQuery({
    queryKey: ["installments", params],
    queryFn: async (): Promise<InstallmentsResponse> => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.status) searchParams.set("status", params.status);
      if (params.paymentId) searchParams.set("paymentId", params.paymentId);
      if (params.customerId) searchParams.set("customerId", params.customerId);

      const response = await fetch(`/api/installments?${searchParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cargar cuotas");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// ============================================================================
// MUTATION: MARK AS PAID
// ============================================================================

/**
 * Hook para marcar una cuota como pagada
 *
 * **COMPORTAMIENTO:**
 * - Actualiza status a "paid"
 * - Establece paidDate a fecha actual
 *
 * **VALIDACIONES:**
 * - Solo cuotas con status "pending" pueden marcarse como pagadas
 *
 * **INVALIDACIONES AUTOMÁTICAS:**
 * - `['installments']` → Refetch lista de cuotas
 * - `['payments']` → Refetch pagos (puede afectar visualización)
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const markAsPaid = useMarkInstallmentAsPaid()
 *
 * <Button
 *   onClick={() => markAsPaid.mutate(installment.id)}
 *   disabled={markAsPaid.isPending}
 * >
 *   Marcar como pagado
 * </Button>
 * ```
 */
export function useMarkInstallmentAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Installment> => {
      const response = await fetch(`/api/installments/${id}/mark-as-paid`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al marcar cuota como pagada");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          // Invalidar installments
          if (key === "installments") return true;

          // Invalidar payments (puede afectar visualización de cuotas)
          if (key === "payments") return true;

          return false;
        },
      });

      toast.success("Cuota marcada como pagada");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error("Error marking installment as paid:", error);
    },
  });
}

// ============================================================================
// MUTATION: MARK AS PENDING
// ============================================================================

/**
 * Hook para revertir una cuota a estado pendiente
 *
 * **COMPORTAMIENTO:**
 * - Actualiza status a "pending"
 * - Limpia paidDate a null
 *
 * **VALIDACIONES:**
 * - Solo cuotas con status "paid" pueden revertirse
 *
 * **INVALIDACIONES:**
 * - `['installments']` → Refetch lista
 * - `['payments']` → Refetch pagos
 *
 * @example
 * ```tsx
 * const markAsPending = useMarkInstallmentAsPending()
 *
 * markAsPending.mutate(installment.id)
 * ```
 */
export function useMarkInstallmentAsPending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Installment> => {
      const response = await fetch(`/api/installments/${id}/mark-as-pending`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al revertir cuota");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          if (key === "installments") return true;
          if (key === "payments") return true;

          return false;
        },
      });

      toast.success("Cuota revertida a pendiente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error("Error reverting installment:", error);
    },
  });
}
