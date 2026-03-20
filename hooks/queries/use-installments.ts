import { useQuery } from "@tanstack/react-query";

/**
 * Hooks de React Query para Installments
 *
 * Convenciones:
 * - Query keys: ['installments'] para list
 * - Los installments se crean automáticamente cuando se crea un Payment con selectedInstallments > 1
 * - El status se deriva de dueDate en el backend (no se almacena)
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
  status: string;
  isOverdue: boolean;
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
