/**
 * Tests para /api/cron/recalculate-balances
 *
 * Valida:
 * - Autenticación con CRON_SECRET
 * - Rechazo de requests sin auth
 * - Rechazo de requests con auth incorrecta
 * - Ejecución de recalculateAllCustomers
 * - Response con stats correctos
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import * as customerBalance from "@/lib/business-logic/customer-balance";

// Mock de recalculateAllCustomers
vi.mock("@/lib/business-logic/customer-balance", () => ({
  recalculateAllCustomers: vi.fn(),
}));

// Mock de logger middleware (withLogging devuelve la función sin modificar)
vi.mock("@/lib/logger-middleware", () => ({
  withLogging: (fn: Function) => fn,
}));

describe("POST /api/cron/recalculate-balances", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Setup environment
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = "test-secret-key";

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  /**
   * Helper para crear mock de NextRequest
   */
  const createMockRequest = (authHeader?: string) => {
    return {
      headers: {
        get: vi.fn((name: string) => {
          if (name === "authorization") return authHeader;
          return null;
        }),
      },
    } as any;
  };

  /**
   * Helper para crear mock de logger (segundo parámetro de withLogging)
   */
  const createMockLogger = () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  });

  describe("Autenticación", () => {
    it("debe rechazar request sin Authorization header", async () => {
      const mockRequest = createMockRequest();
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { receivedAuth: "missing" },
        "Unauthorized cron job attempt",
      );
    });

    it("debe rechazar request con Authorization incorrecta", async () => {
      const mockRequest = createMockRequest("Bearer wrong-secret");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { receivedAuth: "present" },
        "Unauthorized cron job attempt",
      );
    });

    it("debe rechazar request con formato de Authorization incorrecto", async () => {
      // Sin "Bearer " prefix
      const mockRequest = createMockRequest("test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("debe aceptar request con Authorization correcta", async () => {
      // Mock recalculateAllCustomers
      vi.mocked(customerBalance.recalculateAllCustomers).mockResolvedValue(5);

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);

      expect(response.status).toBe(200);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe("Ejecución del Cron Job", () => {
    it("debe ejecutar recalculateAllCustomers cuando auth es correcta", async () => {
      vi.mocked(customerBalance.recalculateAllCustomers).mockResolvedValue(10);

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      await POST(mockRequest, mockLogger as any);

      expect(customerBalance.recalculateAllCustomers).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Starting scheduled customer balance recalculation",
      );
    });

    it("debe retornar stats correctos en response", async () => {
      const mockCount = 42;
      vi.mocked(customerBalance.recalculateAllCustomers).mockResolvedValue(
        mockCount,
      );

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.customersProcessed).toBe(mockCount);
      expect(data.durationMs).toBeGreaterThanOrEqual(0);
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
    });

    it("debe loggear éxito con stats", async () => {
      vi.mocked(customerBalance.recalculateAllCustomers).mockResolvedValue(7);

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      await POST(mockRequest, mockLogger as any);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          customersProcessed: 7,
          durationMs: expect.any(Number),
          durationSeconds: expect.any(Number),
        }),
        "Customer balance recalculation completed successfully",
      );
    });

    it("debe medir duración correctamente", async () => {
      // Mock que toma tiempo
      vi.mocked(customerBalance.recalculateAllCustomers).mockImplementation(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return 5;
        },
      );

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      // Duración debería existir y ser mayor a 0
      expect(data.durationMs).toBeDefined();
      expect(data.durationMs).toBeGreaterThan(0);
    });
  });

  describe("Manejo de Errores", () => {
    it("debe manejar error de recalculateAllCustomers", async () => {
      const errorMessage = "Database connection failed";
      vi.mocked(customerBalance.recalculateAllCustomers).mockRejectedValue(
        new Error(errorMessage),
      );

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Error recalculating balances");
      expect(data.message).toBe(errorMessage);
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        "Error during scheduled balance recalculation",
      );
    });

    it("debe manejar error desconocido (no Error object)", async () => {
      vi.mocked(customerBalance.recalculateAllCustomers).mockRejectedValue(
        "String error",
      );

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Error recalculating balances");
      expect(data.message).toBe("Unknown error");
    });
  });

  describe("Edge Cases", () => {
    it("debe manejar CRON_SECRET no definido en env", async () => {
      delete process.env.CRON_SECRET;

      const mockRequest = createMockRequest("Bearer anything");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);

      // Debería rechazar porque `Bearer ${undefined}` !== "Bearer anything"
      expect(response.status).toBe(401);
    });

    it("debe manejar correctamente 0 customers procesados", async () => {
      vi.mocked(customerBalance.recalculateAllCustomers).mockResolvedValue(0);

      const mockRequest = createMockRequest("Bearer test-secret-key");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customersProcessed).toBe(0);
      expect(data.success).toBe(true);
    });

    it("debe manejar Authorization header con espacios extras", async () => {
      // Espacios antes/después del Bearer
      const mockRequest = createMockRequest("  Bearer test-secret-key  ");
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);

      // No debería matchear porque no es exactamente "Bearer test-secret-key"
      expect(response.status).toBe(401);
    });

    it("debe ser case-sensitive con CRON_SECRET", async () => {
      process.env.CRON_SECRET = "TestSecret";

      const mockRequest = createMockRequest("Bearer testsecret"); // lowercase
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);

      expect(response.status).toBe(401);
    });
  });

  describe("Integración con Vercel Cron", () => {
    it("debe funcionar con header exacto que Vercel envía", async () => {
      // Vercel envía: Authorization: Bearer <CRON_SECRET>
      vi.mocked(customerBalance.recalculateAllCustomers).mockResolvedValue(3);

      const mockRequest = createMockRequest(
        `Bearer ${process.env.CRON_SECRET}`,
      );
      const mockLogger = createMockLogger();

      const response = await POST(mockRequest, mockLogger as any);

      expect(response.status).toBe(200);
      expect(customerBalance.recalculateAllCustomers).toHaveBeenCalled();
    });
  });
});
