"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

/**
 * Página de demo para CurrencyInput
 *
 * Propósito:
 * - Testing E2E con Playwright
 * - Verificación visual de formateo
 * - Demostración de diferentes configuraciones
 */
export default function DemoCurrencyInputPage() {
  const [clpAmount, setClpAmount] = useState(0);
  const [eurAmount, setEurAmount] = useState(0);
  const [usdAmount, setUsdAmount] = useState(0);
  const [minMaxAmount, setMinMaxAmount] = useState(100);
  const [doubleClickAmount, setDoubleClickAmount] = useState(1234567);

  return (
    <AppLayout
      pageTitle="Demo: CurrencyInput"
      pageDescription="Página de testing para el componente CurrencyInput"
    >
      <div className="space-y-6">
        {/* CLP - Sin decimales */}
        <Card>
          <CardHeader>
            <CardTitle>CLP (Chile) - Sin decimales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clp-input">Monto en CLP</Label>
              <CurrencyInput
                id="clp-input"
                value={clpAmount}
                onChange={setClpAmount}
                currency="CLP"
                locale="es-CL"
              />
            </div>
            <div
              data-testid="clp-output"
              className="text-sm text-muted-foreground"
            >
              Valor numérico: <span className="font-mono">{clpAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* EUR - Con decimales */}
        <Card>
          <CardHeader>
            <CardTitle>EUR (España) - Con decimales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="eur-input">Monto en EUR</Label>
              <CurrencyInput
                id="eur-input"
                value={eurAmount}
                onChange={setEurAmount}
                currency="EUR"
                locale="es-ES"
              />
            </div>
            <div
              data-testid="eur-output"
              className="text-sm text-muted-foreground"
            >
              Valor numérico: <span className="font-mono">{eurAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* USD - Con decimales */}
        <Card>
          <CardHeader>
            <CardTitle>USD (USA) - Con decimales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="usd-input">Monto en USD</Label>
              <CurrencyInput
                id="usd-input"
                value={usdAmount}
                onChange={setUsdAmount}
                currency="USD"
                locale="en-US"
              />
            </div>
            <div
              data-testid="usd-output"
              className="text-sm text-muted-foreground"
            >
              Valor numérico: <span className="font-mono">{usdAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Min/Max Validation */}
        <Card>
          <CardHeader>
            <CardTitle>Validación Min/Max</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minmax-input">Monto (mín: 50, máx: 500)</Label>
              <CurrencyInput
                id="minmax-input"
                value={minMaxAmount}
                onChange={setMinMaxAmount}
                min={50}
                max={500}
                currency="CLP"
                locale="es-CL"
              />
            </div>
            <div
              data-testid="minmax-output"
              className="text-sm text-muted-foreground"
            >
              Valor numérico: <span className="font-mono">{minMaxAmount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Doble Click Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test: Doble Click para Seleccionar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="doubleclick-input">
                Haz doble click para seleccionar todo
              </Label>
              <CurrencyInput
                id="doubleclick-input"
                value={doubleClickAmount}
                onChange={setDoubleClickAmount}
                currency="CLP"
                locale="es-CL"
              />
            </div>
            <div
              data-testid="doubleclick-output"
              className="text-sm text-muted-foreground"
            >
              Valor numérico:{" "}
              <span className="font-mono">{doubleClickAmount}</span>
            </div>
            <div className="text-sm text-blue-600">
              💡 Tip: Haz doble click en el input y luego escribe para
              reemplazar el valor completo
            </div>
          </CardContent>
        </Card>

        {/* Disabled State */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Deshabilitado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="disabled-input">Input Deshabilitado</Label>
              <CurrencyInput
                id="disabled-input"
                value={999}
                onChange={() => {}}
                disabled
                currency="CLP"
                locale="es-CL"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
