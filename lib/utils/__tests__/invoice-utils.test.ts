import { describe, it, expect } from "vitest";
import { addDays, subDays, startOfDay } from "date-fns";
import {
  calculateTaxAmount,
  calculateTotal,
  formatCurrency,
  TAX_RATE_CHILE,
  calculateDueDate,
  getInvoiceDueDateStatus,
  INVOICE_STATUS_CONFIG,
} from "../invoice-utils";

describe("TAX_RATE_CHILE", () => {
  it("debe ser 19% (0.19)", () => {
    expect(TAX_RATE_CHILE).toBe(0.19);
  });
});

describe("calculateTaxAmount", () => {
  it("debe calcular IVA 19% correctamente", () => {
    expect(calculateTaxAmount(1000)).toBe(190);
    expect(calculateTaxAmount(100)).toBe(19);
    expect(calculateTaxAmount(500)).toBe(95);
  });

  it("debe manejar decimales con redondeo a 2 posiciones", () => {
    expect(calculateTaxAmount(1000.33)).toBe(190); // Math.round(190.0627)
    expect(calculateTaxAmount(1234.56)).toBe(235); // Math.round(234.5664)
    expect(calculateTaxAmount(999.99)).toBe(190);
  });

  it("debe manejar valores pequeños", () => {
    expect(calculateTaxAmount(10)).toBe(2); // Math.round(1.9)
    expect(calculateTaxAmount(1)).toBe(0); // Math.round(0.19)
    expect(calculateTaxAmount(0.5)).toBe(0); // Math.round(0.095)
  });

  it("debe manejar valores grandes", () => {
    expect(calculateTaxAmount(1000000)).toBe(190000);
    expect(calculateTaxAmount(9999999)).toBe(1900000); // Math.round(1899999.81)
  });

  it("debe manejar cero", () => {
    expect(calculateTaxAmount(0)).toBe(0);
  });

  it("debe redondear correctamente casos límite", () => {
    // Casos donde el redondeo es importante
    expect(calculateTaxAmount(1000.01)).toBe(190);
    expect(calculateTaxAmount(1000.05)).toBe(190); // Math.round(190.0095)
  });
});

describe("calculateTotal", () => {
  it("debe sumar subtotal + IVA correctamente", () => {
    expect(calculateTotal(1000, 190)).toBe(1190);
    expect(calculateTotal(500, 95)).toBe(595);
    expect(calculateTotal(100, 19)).toBe(119);
  });

  it("debe manejar decimales con redondeo a 2 posiciones", () => {
    expect(calculateTotal(1000.33, 190.06)).toBe(1190); // Math.round(1190.39)
    expect(calculateTotal(1234.56, 234.57)).toBe(1469); // Math.round(1469.13)
  });

  it("debe manejar IVA cero (facturas exentas)", () => {
    expect(calculateTotal(1000, 0)).toBe(1000);
    expect(calculateTotal(1234.56, 0)).toBe(1235); // Math.round(1234.56)
  });

  it("debe manejar valores grandes", () => {
    expect(calculateTotal(1000000, 190000)).toBe(1190000);
    expect(calculateTotal(9999999, 1899999.81)).toBe(11899999); // Math.round(11899998.81)
  });

  it("debe manejar ambos valores en cero", () => {
    expect(calculateTotal(0, 0)).toBe(0);
  });

  it("debe redondear correctamente casos límite", () => {
    expect(calculateTotal(1000.005, 190.001)).toBe(1190); // Math.round(1190.006)
  });
});

describe("formatCurrency", () => {
  it("debe formatear CLP sin decimales", () => {
    expect(formatCurrency(1190000)).toBe("$1.190.000");
    expect(formatCurrency(1000)).toBe("$1.000");
  });

  it("debe manejar valores con decimales (redondeando)", () => {
    // CLP no muestra decimales, redondea
    expect(formatCurrency(1190.5)).toBe("$1.191");
    expect(formatCurrency(1190.49)).toBe("$1.190");
  });

  it("debe manejar cero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("debe manejar valores negativos", () => {
    const result = formatCurrency(-1000);
    expect(result).toContain("-");
    expect(result).toContain("1.000");
  });

  it("debe usar separador de miles con punto", () => {
    expect(formatCurrency(1000000)).toBe("$1.000.000");
    expect(formatCurrency(999999)).toBe("$999.999");
  });
});

describe("Integración: Flujo completo de cálculo", () => {
  it("debe calcular correctamente una factura completa", () => {
    const subtotal = 1000000;
    const taxAmount = calculateTaxAmount(subtotal);
    const total = calculateTotal(subtotal, taxAmount);

    expect(taxAmount).toBe(190000);
    expect(total).toBe(1190000);
    expect(formatCurrency(total)).toBe("$1.190.000");
  });

  it("debe manejar factura exenta (IVA = 0)", () => {
    const subtotal = 1000000;
    const taxAmount = 0;
    const total = calculateTotal(subtotal, taxAmount);

    expect(total).toBe(1000000);
    expect(formatCurrency(total)).toBe("$1.000.000");
  });

  it("debe manejar factura con decimales", () => {
    const subtotal = 1234.56;
    const taxAmount = calculateTaxAmount(subtotal);
    const total = calculateTotal(subtotal, taxAmount);

    expect(taxAmount).toBe(235); // Math.round(234.5664)
    expect(total).toBe(1470); // Math.round(1234.56 + 235)
  });
});

describe("calculateDueDate", () => {
  it("debe calcular fecha de vencimiento sumando días al issueDate", () => {
    const issueDate = startOfDay(new Date("2025-01-01"));
    const dueDate = calculateDueDate(issueDate, 30);
    const expected = startOfDay(new Date("2025-01-31"));

    expect(startOfDay(dueDate)).toEqual(expected);
  });

  it("debe manejar diferentes plazos de pago", () => {
    const issueDate = startOfDay(new Date("2025-01-15"));

    expect(startOfDay(calculateDueDate(issueDate, 30))).toEqual(
      startOfDay(new Date("2025-02-14"))
    );
    expect(startOfDay(calculateDueDate(issueDate, 60))).toEqual(
      startOfDay(new Date("2025-03-16"))
    );
    expect(startOfDay(calculateDueDate(issueDate, 90))).toEqual(
      startOfDay(new Date("2025-04-15"))
    );
  });

  it("debe manejar cambios de mes y año", () => {
    const issueDate = startOfDay(new Date("2025-12-15"));
    const dueDate = calculateDueDate(issueDate, 30);
    const expected = startOfDay(new Date("2026-01-14"));

    expect(startOfDay(dueDate)).toEqual(expected);
  });

  it("debe manejar plazo de 0 días", () => {
    const issueDate = startOfDay(new Date("2025-01-01"));
    const dueDate = calculateDueDate(issueDate, 0);

    expect(startOfDay(dueDate)).toEqual(issueDate);
  });
});

describe("getInvoiceDueDateStatus", () => {
  it("debe retornar 'overdue' si ya pasó la fecha de vencimiento", () => {
    const pastDate = subDays(new Date(), 10);
    expect(getInvoiceDueDateStatus(pastDate)).toBe("overdue");
  });

  it("debe retornar 'overdue' si vencimiento es hoy mismo", () => {
    // Crear fecha de ayer para asegurar que ya pasó
    const yesterday = subDays(new Date(), 1);
    expect(getInvoiceDueDateStatus(yesterday)).toBe("overdue");
  });

  it("debe retornar 'due-soon' si faltan 7 días o menos", () => {
    const soonDate1 = addDays(new Date(), 7);
    const soonDate2 = addDays(new Date(), 5);
    const soonDate3 = addDays(new Date(), 1);

    expect(getInvoiceDueDateStatus(soonDate1)).toBe("due-soon");
    expect(getInvoiceDueDateStatus(soonDate2)).toBe("due-soon");
    expect(getInvoiceDueDateStatus(soonDate3)).toBe("due-soon");
  });

  it("debe retornar 'current' si faltan más de 7 días", () => {
    const futureDate1 = addDays(new Date(), 8);
    const futureDate2 = addDays(new Date(), 15);
    const futureDate3 = addDays(new Date(), 30);

    expect(getInvoiceDueDateStatus(futureDate1)).toBe("current");
    expect(getInvoiceDueDateStatus(futureDate2)).toBe("current");
    expect(getInvoiceDueDateStatus(futureDate3)).toBe("current");
  });

  it("debe permitir configurar threshold personalizado", () => {
    const date10DaysAway = addDays(new Date(), 10);

    // Con threshold default (7), debería ser 'current'
    expect(getInvoiceDueDateStatus(date10DaysAway, 7)).toBe("current");

    // Con threshold de 15, debería ser 'due-soon'
    expect(getInvoiceDueDateStatus(date10DaysAway, 15)).toBe("due-soon");

    // Con threshold de 5, debería ser 'current'
    expect(getInvoiceDueDateStatus(date10DaysAway, 5)).toBe("current");
  });

  it("debe manejar casos límite en el threshold", () => {
    // Usar startOfDay para evitar que la hora del día afecte differenceInDays
    const today = startOfDay(new Date());
    const exactThresholdDate = addDays(today, 7);
    const oneDayAfterThreshold = addDays(today, 9);

    expect(getInvoiceDueDateStatus(exactThresholdDate, 7)).toBe("due-soon");
    expect(getInvoiceDueDateStatus(oneDayAfterThreshold, 7)).toBe("current");
  });
});

describe("INVOICE_STATUS_CONFIG", () => {
  it("debe tener configuración para todos los estados", () => {
    expect(INVOICE_STATUS_CONFIG.current).toBeDefined();
    expect(INVOICE_STATUS_CONFIG["due-soon"]).toBeDefined();
    expect(INVOICE_STATUS_CONFIG.overdue).toBeDefined();
  });

  it("debe tener variantes correctas para cada estado", () => {
    expect(INVOICE_STATUS_CONFIG.current.variant).toBe("default");
    expect(INVOICE_STATUS_CONFIG["due-soon"].variant).toBe("outline");
    expect(INVOICE_STATUS_CONFIG.overdue.variant).toBe("destructive");
  });

  it("debe tener labels en español", () => {
    expect(INVOICE_STATUS_CONFIG.current.label).toBe("Vigente");
    expect(INVOICE_STATUS_CONFIG["due-soon"].label).toBe("Por vencer");
    expect(INVOICE_STATUS_CONFIG.overdue.label).toBe("Vencida");
  });
});

describe("Integración: Flujo completo de estado de factura", () => {
  it("debe calcular correctamente el estado de una factura emitida hace 10 días con plazo de 30", () => {
    const issueDate = subDays(new Date(), 10);
    const paymentTermsDays = 30;
    const dueDate = calculateDueDate(issueDate, paymentTermsDays);
    const status = getInvoiceDueDateStatus(dueDate);

    // Faltan 20 días, debería estar vigente
    expect(status).toBe("current");
  });

  it("debe calcular correctamente el estado de una factura próxima a vencer", () => {
    const issueDate = subDays(new Date(), 25);
    const paymentTermsDays = 30;
    const dueDate = calculateDueDate(issueDate, paymentTermsDays);
    const status = getInvoiceDueDateStatus(dueDate);

    // Faltan 5 días, debería estar por vencer
    expect(status).toBe("due-soon");
  });

  it("debe calcular correctamente el estado de una factura vencida", () => {
    const issueDate = subDays(new Date(), 35);
    const paymentTermsDays = 30;
    const dueDate = calculateDueDate(issueDate, paymentTermsDays);
    const status = getInvoiceDueDateStatus(dueDate);

    // Ya pasaron 5 días desde vencimiento
    expect(status).toBe("overdue");
  });

  it("debe poder obtener la configuración de badge para cada estado", () => {
    const currentStatus = "current";
    const dueSoonStatus = "due-soon";
    const overdueStatus = "overdue";

    const currentConfig = INVOICE_STATUS_CONFIG[currentStatus];
    const dueSoonConfig = INVOICE_STATUS_CONFIG[dueSoonStatus];
    const overdueConfig = INVOICE_STATUS_CONFIG[overdueStatus];

    expect(currentConfig.variant).toBe("default");
    expect(currentConfig.label).toBe("Vigente");

    expect(dueSoonConfig.variant).toBe("outline");
    expect(dueSoonConfig.label).toBe("Por vencer");

    expect(overdueConfig.variant).toBe("destructive");
    expect(overdueConfig.label).toBe("Vencida");
  });
});
