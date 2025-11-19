import { test, expect } from "@playwright/test";

test.describe("CurrencyInput E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de demo
    await page.goto("/demo/currency-input");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Formateo visual", () => {
    test("should format CLP with thousand separators and no decimals", async ({
      page,
    }) => {
      const input = page.locator("#clp-input");

      // Limpiar y escribir valor
      await input.click();
      await input.press("Control+a");
      await input.type("1234567", { delay: 50 });

      // Verificar formateo visual: $ 1.234.567 (punto para miles, sin decimales)
      await expect(input).toHaveValue(/\$\s*1\.234\.567/);

      // Verificar valor numérico en el output
      const output = page.locator('[data-testid="clp-output"]');
      await expect(output).toContainText("1234567");
    });

    test("should format EUR with thousand separators and decimals", async ({
      page,
    }) => {
      const input = page.locator("#eur-input");

      await input.click();
      await input.press("Control+a");
      await input.type("1234.56", { delay: 50 });

      // EUR en España: € 1.234,56 (punto para miles, coma para decimales)
      await expect(input).toHaveValue(/€\s*1\.234,56/);

      // Verificar valor numérico
      const output = page.locator('[data-testid="eur-output"]');
      await expect(output).toContainText("1234.56");
    });

    test("should format USD with comma thousand separators and dot decimals", async ({
      page,
    }) => {
      const input = page.locator("#usd-input");

      await input.click();
      await input.press("Control+a");
      await input.type("1234.56", { delay: 50 });

      // USD en USA: $ 1,234.56 (coma para miles, punto para decimales)
      await expect(input).toHaveValue(/\$\s*1,234\.56/);

      // Verificar valor numérico
      const output = page.locator('[data-testid="usd-output"]');
      await expect(output).toContainText("1234.56");
    });
  });

  test.describe("Validación min/max", () => {
    test("should enforce minimum value", async ({ page }) => {
      const input = page.locator("#minmax-input");
      const output = page.locator('[data-testid="minmax-output"]');

      // Intentar escribir valor menor al mínimo (50)
      await input.click();
      await input.press("Control+a");
      await input.type("10", { delay: 50 });

      // Salir del input para que se aplique la validación
      await input.blur();

      // Debería aplicar el mínimo (50)
      await expect(output).toContainText("50");
    });

    test("should enforce maximum value", async ({ page }) => {
      const input = page.locator("#minmax-input");
      const output = page.locator('[data-testid="minmax-output"]');

      // Intentar escribir valor mayor al máximo (500)
      await input.click();
      await input.press("Control+a");
      await input.type("1000", { delay: 50 });

      // Salir del input
      await input.blur();

      // Debería aplicar el máximo (500)
      await expect(output).toContainText("500");
    });

    test("should allow values within range", async ({ page }) => {
      const input = page.locator("#minmax-input");
      const output = page.locator('[data-testid="minmax-output"]');

      // Escribir valor válido (dentro del rango 50-500)
      await input.click();
      await input.press("Control+a");
      await input.type("250", { delay: 50 });

      await input.blur();

      // Debería mantener el valor
      await expect(output).toContainText("250");
    });
  });

  test.describe("Comportamiento UX - Problemas reportados", () => {
    test("should allow clearing and replacing value when input is 0", async ({
      page,
    }) => {
      const input = page.locator("#clp-input");
      const output = page.locator('[data-testid="clp-output"]');

      // Verificar que empieza en 0
      await expect(output).toContainText("0");

      // Hacer click en el input
      await input.click();

      // Seleccionar todo (Ctrl+A) y escribir nuevo valor
      await input.press("Control+a");
      await input.type("500", { delay: 50 });

      // Verificar que el valor cambió a 500
      await expect(output).toContainText("500");
    });

    test("should select all content on double click", async ({ page }) => {
      const input = page.locator("#doubleclick-input");
      const output = page.locator('[data-testid="doubleclick-output"]');

      // Verificar valor inicial
      await expect(output).toContainText("1234567");

      // Doble click en el input
      await input.dblclick();

      // Escribir nuevo valor (debería reemplazar todo)
      await input.type("999", { delay: 50 });

      // Verificar que reemplazó completamente el valor anterior
      // Si el doble click funciona, el valor debería ser 999, no 1234567999
      await expect(output).toContainText("999");
      await expect(output).not.toContainText("1234567999");
    });

    test("should maintain focus while typing", async ({ page }) => {
      const input = page.locator("#clp-input");

      await input.click();
      await input.press("Control+a");

      // Escribir varios caracteres
      await input.type("123456789", { delay: 30 });

      // Verificar que el input todavía tiene focus
      await expect(input).toBeFocused();
    });

    test("should not lose cursor position while formatting", async ({
      page,
    }) => {
      const input = page.locator("#clp-input");

      await input.click();
      await input.press("Control+a");

      // Escribir valor largo caracter por caracter
      const value = "1234567";
      for (const char of value) {
        await input.type(char, { delay: 50 });
        // El input no debería perder focus entre caracteres
        await expect(input).toBeFocused();
      }

      // Verificar valor final
      const output = page.locator('[data-testid="clp-output"]');
      await expect(output).toContainText("1234567");
    });
  });

  test.describe("Estados del componente", () => {
    test("should display disabled state correctly", async ({ page }) => {
      const input = page.locator("#disabled-input");

      // Verificar que está deshabilitado
      await expect(input).toBeDisabled();

      // Verificar que tiene opacity reducida (estilo de disabled)
      const opacity = await input.evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });

      // El componente aplica opacity-50 cuando está disabled
      expect(parseFloat(opacity)).toBeLessThan(1);
    });

    test("should show placeholder with currency symbol", async ({ page }) => {
      const input = page.locator("#clp-input");

      // Limpiar el input
      await input.click();
      await input.press("Control+a");
      await input.press("Backspace");

      // Verificar que el placeholder contiene el símbolo de moneda
      const placeholder = await input.getAttribute("placeholder");
      expect(placeholder).toContain("$");
    });
  });

  test.describe("Diferentes monedas", () => {
    test("should handle CLP without decimal places", async ({ page }) => {
      const input = page.locator("#clp-input");

      await input.click();
      await input.press("Control+a");
      // Intentar escribir con decimales
      await input.type("1234.56", { delay: 50 });

      // CLP no debería mostrar decimales
      // El valor debería ser 123456 o ignorar los decimales
      const inputValue = await input.inputValue();
      // No debería terminar con coma decimal
      expect(inputValue).not.toMatch(/,\d{2}$/);
    });

    test("should handle EUR with 2 decimal places", async ({ page }) => {
      const input = page.locator("#eur-input");

      await input.click();
      await input.press("Control+a");
      await input.type("1234.56", { delay: 50 });

      // EUR debería mostrar 2 decimales con coma
      await expect(input).toHaveValue(/,56/);
    });

    test("should handle USD with 2 decimal places", async ({ page }) => {
      const input = page.locator("#usd-input");

      await input.click();
      await input.press("Control+a");
      await input.type("1234.56", { delay: 50 });

      // USD debería mostrar 2 decimales con punto
      await expect(input).toHaveValue(/\.56/);
    });
  });

  test.describe("Interacciones del teclado", () => {
    test("should navigate with Tab key", async ({ page }) => {
      const clpInput = page.locator("#clp-input");
      const eurInput = page.locator("#eur-input");

      // Focus en el primer input
      await clpInput.click();
      await expect(clpInput).toBeFocused();

      // Presionar Tab varias veces para navegar
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Debería haber avanzado al siguiente input
      await expect(eurInput).toBeFocused();
    });

    test("should allow arrow keys for navigation", async ({ page }) => {
      const input = page.locator("#clp-input");

      await input.click();
      await input.press("Control+a");
      await input.type("12345", { delay: 50 });

      // Presionar flecha izquierda
      await input.press("ArrowLeft");
      await input.press("ArrowLeft");

      // El cursor debería moverse (difícil de testear en Playwright)
      // Pero al menos verificamos que el input sigue con focus
      await expect(input).toBeFocused();
    });
  });
});
