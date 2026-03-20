import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { recalculateCustomerBalancesWithRetry } from "../customer-balance-retry";

// Mocks de dependencias
vi.mock("../customer-balance", () => ({
  recalculateCustomerBalances: vi.fn(),
}));

vi.mock("@/lib/alerts/balance-alerts", () => ({
  sendBalanceCalculationFailureAlert: vi.fn(),
}));

import { recalculateCustomerBalances } from "../customer-balance";
import { sendBalanceCalculationFailureAlert } from "@/lib/alerts/balance-alerts";

const mockRecalculate = vi.mocked(recalculateCustomerBalances);
const mockSendAlert = vi.mocked(sendBalanceCalculationFailureAlert);

function createMockLogger() {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("recalculateCustomerBalancesWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debe retornar true si recalculación exitosa al primer intento", async () => {
    mockRecalculate.mockResolvedValue(undefined);
    const logger = createMockLogger();

    const result = await recalculateCustomerBalancesWithRetry(
      "customer-1",
      logger
    );

    expect(result).toBe(true);
    expect(mockRecalculate).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("debe reintentar y retornar true si éxito en segundo intento", async () => {
    mockRecalculate
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockResolvedValueOnce(undefined);

    const logger = createMockLogger();

    const promise = recalculateCustomerBalancesWithRetry("customer-1", logger);

    // Avanzar el timer del delay del primer retry (1000ms * 1)
    await vi.advanceTimersByTimeAsync(1000);

    const result = await promise;

    expect(result).toBe(true);
    expect(mockRecalculate).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("debe retornar false y enviar alerta tras agotar todos los reintentos", async () => {
    mockRecalculate.mockRejectedValue(new Error("DB down"));
    mockSendAlert.mockResolvedValue(undefined);
    const logger = createMockLogger();

    const promise = recalculateCustomerBalancesWithRetry("customer-1", logger, {
      maxRetries: 3,
      baseDelayMs: 100,
    });

    // Avanzar timers para cada retry
    await vi.advanceTimersByTimeAsync(100); // retry 1 delay
    await vi.advanceTimersByTimeAsync(200); // retry 2 delay

    const result = await promise;

    expect(result).toBe(false);
    expect(mockRecalculate).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(mockSendAlert).toHaveBeenCalledTimes(1);
    expect(mockSendAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "customer-1",
        attempts: 3,
      })
    );
  });

  it("debe usar backoff lineal (baseDelay * attempt)", async () => {
    mockRecalculate
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValueOnce(undefined);

    const logger = createMockLogger();

    const promise = recalculateCustomerBalancesWithRetry("customer-1", logger, {
      maxRetries: 3,
      baseDelayMs: 100,
    });

    // Primer retry: delay = 100 * 1 = 100ms
    await vi.advanceTimersByTimeAsync(100);
    // Segundo retry: delay = 100 * 2 = 200ms
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe(true);
    expect(mockRecalculate).toHaveBeenCalledTimes(3);
  });

  it("debe usar valores por defecto (maxRetries=3, baseDelayMs=1000)", async () => {
    mockRecalculate.mockRejectedValue(new Error("fail"));
    mockSendAlert.mockResolvedValue(undefined);
    const logger = createMockLogger();

    const promise = recalculateCustomerBalancesWithRetry("customer-1", logger);

    await vi.advanceTimersByTimeAsync(1000); // attempt 1 delay
    await vi.advanceTimersByTimeAsync(2000); // attempt 2 delay

    const result = await promise;
    expect(result).toBe(false);
    expect(mockRecalculate).toHaveBeenCalledTimes(3);
  });

  it("debe logear debug con número de intentos cuando éxito después de retry", async () => {
    mockRecalculate
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockResolvedValueOnce(undefined);

    const logger = createMockLogger();

    const promise = recalculateCustomerBalancesWithRetry("customer-1", logger, {
      baseDelayMs: 100,
    });
    await vi.advanceTimersByTimeAsync(100);
    await promise;

    // Debe logear con attempt > 1
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "customer-1", attempt: 2 }),
      expect.stringContaining("2 attempts")
    );
  });
});
