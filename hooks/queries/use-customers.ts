import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CustomerFormData } from "@/lib/validations/customer-validations";

// El tipo Customer se define en el contexto donde se usa (app/customer/columns.tsx)
// Este hook retorna el tipo genérico que viene de la API
export type Customer = {
  id: string;
  rut: string;
  razonSocial: string;
  tradeName: string | null;
  contact: string;
  phone: string;
  email: string | null;
  balanceTotal?: number;
  balanceVigente?: number; // Derivado al consultar (no almacenado)
  balanceVencido?: number; // Derivado al consultar (no almacenado)
  [key: string]: unknown;
};

/**
 * Hooks de React Query para Customers
 *
 * Convenciones:
 * - Query keys: ['customers'] para list, ['customers', id] para single
 * - Mutations invalidan queries relacionadas automáticamente
 * - Delete usa optimistic updates para UX más rápida
 */

// ============================================================================
// TYPES
// ============================================================================

/** Params para GET /api/customers */
export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

/** Respuesta de GET /api/customers */
export interface CustomersResponse {
  customers: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Datos para PUT /api/customers/[id] */
export interface UpdateCustomerData {
  id: string;
  data: CustomerFormData;
}

// ============================================================================
// QUERY: GET LIST
// ============================================================================

/**
 * Hook para obtener lista de clientes con paginación y búsqueda
 *
 * @param params - Filtros opcionales
 * @param params.page - Número de página (default: 1)
 * @param params.limit - Registros por página (default: 1000)
 * @param params.search - Término de búsqueda (RUT, razón social, nombre contacto)
 *
 * @returns Query con customers
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCustomers({
 *   limit: 100,
 *   search: 'Acme'
 * })
 * ```
 */
export function useCustomers(params: CustomersQueryParams = {}) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: async (): Promise<CustomersResponse> => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.search) searchParams.set("search", params.search);

      const response = await fetch(`/api/customers?${searchParams}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cargar clientes");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados "frescos"
    gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache
  });
}

// ============================================================================
// QUERY: GET SINGLE
// ============================================================================

/**
 * Hook para obtener un cliente específico por ID
 *
 * @param customerId - UUID del cliente
 * @returns Query con customer individual
 *
 * @example
 * ```tsx
 * const { data: customer, isLoading } = useCustomer(customerId)
 * ```
 */
export function useCustomer(customerId?: string) {
  return useQuery({
    queryKey: ["customers", customerId],
    queryFn: async (): Promise<Customer> => {
      if (!customerId) throw new Error("customerId requerido");

      const response = await fetch(`/api/customers/${customerId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al cargar cliente");
      }

      return response.json();
    },
    enabled: Boolean(customerId), // Solo ejecutar si hay customerId
  });
}

// ============================================================================
// MUTATION: CREATE
// ============================================================================

/**
 * Hook para crear un nuevo cliente
 *
 * **VALIDACIONES:**
 * - RUT único (validado en backend)
 * - Formato RUT válido (validado en frontend + backend)
 * - Email válido (opcional)
 *
 * **INVALIDACIONES AUTOMÁTICAS:**
 * - `['customers']` → Refetch lista de clientes
 * - `['invoices']` → Refetch facturas (puede afectar filtros por cliente)
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const createCustomer = useCreateCustomer()
 *
 * const handleSubmit = async (data: CustomerFormData) => {
 *   try {
 *     await createCustomer.mutateAsync(data)
 *     toast.success('Cliente creado')
 *   } catch (error) {
 *     // Error ya manejado por el hook (toast automático)
 *   }
 * }
 * ```
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerFormData): Promise<Customer> => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear cliente");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          // Invalidar todas las queries de customers
          if (key === "customers") return true;

          // Invalidar invoices (filtros por cliente pueden cambiar)
          if (key === "invoices") return true;

          return false;
        },
      });

      toast.success("Cliente creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error("Error creating customer:", error);
    },
  });
}

// ============================================================================
// MUTATION: UPDATE
// ============================================================================

/**
 * Hook para actualizar un cliente existente
 *
 * **Campos editables:**
 * - Todos los campos de CustomerFormData
 *
 * **RESTRICCIÓN:**
 * - No se puede cambiar el RUT si el cliente tiene facturas asociadas
 *   (validado en backend)
 *
 * **INVALIDACIONES:**
 * - `['customers']` → Refetch lista
 * - `['customers', id]` → Refetch individual
 * - `['invoices']` → Refetch facturas (nombre cliente puede cambiar)
 *
 * @example
 * ```tsx
 * const updateCustomer = useUpdateCustomer()
 *
 * updateCustomer.mutate({
 *   id: 'abc-123',
 *   data: { razonSocial: 'Nuevo nombre', ... }
 * })
 * ```
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateCustomerData): Promise<Customer> => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar cliente");
      }

      return response.json();
    },
    onSuccess: (_updatedCustomer) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];

          // Invalidar lista de customers
          if (key === "customers") return true;

          // Invalidar invoices (nombre cliente puede haber cambiado)
          if (key === "invoices") return true;

          return false;
        },
      });

      toast.success("Cliente actualizado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message);
      console.error("Error updating customer:", error);
    },
  });
}

// ============================================================================
// MUTATION: DELETE (con Optimistic Update)
// ============================================================================

/**
 * Hook para eliminar un cliente
 *
 * **COMPORTAMIENTO:**
 * - Soft delete: Marca como deleted en DB pero no elimina físicamente
 * - Optimistic update: Remueve de UI inmediatamente (rollback si falla)
 *
 * **RESTRICCIÓN:**
 * - No se puede eliminar si tiene facturas asociadas (validado en backend)
 *
 * **INVALIDACIONES:**
 * - `['customers']` → Refetch lista de clientes
 *
 * @returns Mutation object
 *
 * @example
 * ```tsx
 * const deleteCustomer = useDeleteCustomer()
 *
 * <Button
 *   onClick={() => deleteCustomer.mutate(customer.id)}
 *   disabled={deleteCustomer.isPending && deleteCustomer.variables === customer.id}
 * >
 *   {deleteCustomer.isPending && deleteCustomer.variables === customer.id
 *     ? <Loader2 className="animate-spin" />
 *     : 'Eliminar'}
 * </Button>
 * ```
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar cliente");
      }
    },
    // ✅ Optimistic update: remover del UI inmediatamente
    onMutate: async (id) => {
      // Cancel in-flight queries para evitar override
      await queryClient.cancelQueries({ queryKey: ["customers"] });

      // Snapshot del estado anterior (para rollback si falla)
      const previousData = queryClient.getQueryData(["customers"]);

      // Optimistic update: remover customer de todas las queries
      queryClient.setQueriesData<CustomersResponse>(
        { queryKey: ["customers"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            customers: old.customers.filter((c) => c.id !== id),
          };
        }
      );

      return { previousData };
    },
    // ✅ Rollback en caso de error
    onError: (error: Error, id, context) => {
      // Restaurar estado anterior
      if (context?.previousData) {
        queryClient.setQueryData(["customers"], context.previousData);
      }
      toast.error(error.message);
      console.error("Error deleting customer:", error);
    },
    // ✅ Refetch para asegurar consistencia
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente eliminado exitosamente");
    },
  });
}
