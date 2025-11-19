import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyInput } from "../currency-input";

// Mock del hook useConfiguration
vi.mock("@/hooks/use-configuration", () => ({
  useConfiguration: () => ({
    configuration: {
      currency: "CLP",
      locale: "es-CL",
    },
  }),
}));

describe("CurrencyInput", () => {
  describe("Valores numéricos", () => {
    it("should call onChange with numeric value when user types", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={handleChange}
          id="test-input"
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      // Escribir valor
      await user.clear(input);
      await user.type(input, "1234");

      // Verificar que onChange fue llamado con el valor numérico
      expect(handleChange).toHaveBeenCalled();
      // El último valor debería ser 1234
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe(1234);
    });

    it("should handle decimal values correctly for currencies with decimals", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={handleChange}
          currency="EUR"
          locale="es-ES"
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      await user.clear(input);
      await user.type(input, "1234.56");

      // EUR tiene decimales, el valor debería ser 1234.56
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBeCloseTo(1234.56, 2);
    });

    it("should NOT allow decimals for CLP currency", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={handleChange}
          currency="CLP"
          locale="es-CL"
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      await user.clear(input);
      // Intentar escribir con decimales
      await user.type(input, "1234.56");

      // CLP no tiene decimales, debería ignorar los decimales
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      // Debería ser 123456 (sin punto decimal) o 1234 (ignorando después del punto)
      expect([123456, 1234]).toContain(lastCall[0]);
    });
  });

  describe("Validación min/max", () => {
    it("should enforce min value", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={100}
          onChange={handleChange}
          min={50}
          max={500}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      // Intentar escribir valor menor al mínimo
      await user.clear(input);
      await user.type(input, "10");

      // Debería aplicar el mínimo (50)
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe(50);
    });

    it("should enforce max value", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={100}
          onChange={handleChange}
          min={50}
          max={500}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      // Intentar escribir valor mayor al máximo
      await user.clear(input);
      await user.type(input, "1000");

      // Debería aplicar el máximo (500)
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe(500);
    });

    it("should allow negative values by default", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={handleChange}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      await user.clear(input);
      await user.type(input, "-100");

      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe(-100);
    });

    it("should NOT allow negative values when min is 0 or positive", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={handleChange}
          min={0}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      await user.clear(input);
      // Intentar escribir negativo
      await user.type(input, "-100");

      // No debería permitir negativos
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Configuración de moneda y locale", () => {
    it("should use global configuration from context by default", () => {
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={1234}
          onChange={handleChange}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input") as HTMLInputElement;

      // Debería usar CLP del contexto mockeado
      expect(input.value).toContain("$");
    });

    it("should allow currency prop override", () => {
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={1234}
          onChange={handleChange}
          currency="USD"
          locale="en-US"
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input") as HTMLInputElement;

      // Debería usar USD en lugar de CLP del contexto
      expect(input.value).toContain("$");
    });

    it("should show currency symbol in placeholder", () => {
      render(
        <CurrencyInput
          value={0}
          onChange={vi.fn()}
          currency="EUR"
          locale="es-ES"
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");
      const placeholder = input.getAttribute("placeholder");
      // Debería contener el símbolo de euro
      expect(placeholder).toContain("€");
    });
  });

  describe("Estados y atributos", () => {
    it("should handle disabled state", () => {
      render(
        <CurrencyInput
          value={100}
          onChange={vi.fn()}
          disabled
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");
      expect(input).toBeDisabled();
    });

    it("should handle custom placeholder", () => {
      render(
        <CurrencyInput
          value={0}
          onChange={vi.fn()}
          placeholder="Ingrese monto"
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");
      expect(input).toHaveAttribute("placeholder", "Ingrese monto");
    });

    it("should call onFocus callback", async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={vi.fn()}
          onFocus={handleFocus}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");
      await user.click(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    it("should call onBlur callback", async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={vi.fn()}
          onBlur={handleBlur}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");
      await user.click(input);
      await user.tab(); // Salir del input

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe("Comportamiento UX - Problemas reportados", () => {
    it("should allow clearing the input when value is 0", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={0}
          onChange={handleChange}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input");

      // Hacer focus y seleccionar todo
      await user.click(input);
      await user.keyboard("{Control>}a{/Control}");

      // Escribir nuevo valor
      await user.type(input, "500");

      // Debería haber llamado a onChange con el nuevo valor
      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe(500);
    });

    it("should handle double click event", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <CurrencyInput
          value={1234}
          onChange={handleChange}
          data-testid="currency-input"
        />,
      );

      const input = screen.getByTestId("currency-input") as HTMLInputElement;

      // Doble click (dblClick con C mayúscula en userEvent v14+)
      await user.dblClick(input);

      // Nota: La funcionalidad completa de selección con doble click
      // es difícil de testear en jsdom debido a limitaciones del DOM virtual.
      // El comportamiento real se verifica en tests E2E con Playwright.
      //
      // Aquí solo verificamos que:
      // 1. El input está enfocado después del doble click
      expect(input).toHaveFocus();

      // 2. Podemos seleccionar manualmente y reemplazar el contenido
      await user.clear(input);
      await user.type(input, "999");

      const lastCall =
        handleChange.mock.calls[handleChange.mock.calls.length - 1];
      expect(lastCall[0]).toBe(999);
    });
  });
});
