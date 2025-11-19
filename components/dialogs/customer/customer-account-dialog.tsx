"use client";

import { useState, useEffect, useMemo } from "react";
import { useCaptureDialog } from "@/components/custom/capture-dialog/use-capture-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { CustomerNameInfo } from "@/components/summarys/customer/customer-name-info";
import { CustomerInvoiceInfo } from "@/components/summarys/invoice/customer-invoice-info";
import {
  InvoiceTable,
  type InvoiceTableData,
} from "@/components/tables/invoice-table";
import { formatCurrency, formatDate } from "@/lib/format";
import { Loader2, Copy, X, Filter, Calendar } from "lucide-react";
import { useConfiguration } from "@/hooks/use-configuration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { INVOICE_STATUS_LABELS } from "@/lib/constants/invoice-status-constants";

interface Customer {
  id: string;
  rut: string;
  razonSocial: string;
  tradeName: string | null;
  balanceTotal: number;
  balanceVigente: number;
  balanceVencido: number;
}

interface CustomerAccountDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog que muestra el estado de cuenta completo del cliente:
 * - Información básica del cliente (RUT, razón social)
 * - Resumen financiero (balances)
 * - Tabla con todas las facturas
 *
 * Utiliza CaptureDialog para permitir copiar al portapapeles
 */
export function CustomerAccountDialog({
  customer,
  open,
  onOpenChange,
}: CustomerAccountDialogProps) {
  const { configuration } = useConfiguration();
  const [invoices, setInvoices] = useState<InvoiceTableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDate, setGeneratedDate] = useState(new Date());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  );
  const [calculatedBalances, setCalculatedBalances] = useState({
    balanceTotal: customer?.balanceTotal ?? 0,
    balanceVigente: customer?.balanceVigente ?? 0,
    balanceVencido: customer?.balanceVencido ?? 0,
  });

  // Opciones de filtro disponibles
  const filterOptions = [
    { value: "current", label: INVOICE_STATUS_LABELS.current },
    { value: "overdue", label: INVOICE_STATUS_LABELS.overdue },
    { value: "completed", label: INVOICE_STATUS_LABELS.completed },
  ];

  // Toggle de un filtro específico
  const toggleStatus = (status: string) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatuses(newSet);
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSelectedStatuses(new Set());
  };

  // Filtrar facturas según estados seleccionados
  const filteredInvoices = useMemo(() => {
    if (selectedStatuses.size === 0) {
      return invoices; // Sin filtros = mostrar todas
    }
    return invoices.filter((inv) =>
      selectedStatuses.has(inv.invoiceStatus.name)
    );
  }, [invoices, selectedStatuses]);

  // Función para generar texto de fallback (usa facturas filtradas)
  const getFallbackText = () => {
    if (!customer) return "";

    const lines = [
      "ESTADO DE CUENTA",
      "",
      `RUT: ${customer.rut}`,
      `Razón Social: ${customer.razonSocial}`,
      customer.tradeName ? `Nombre Comercial: ${customer.tradeName}` : "",
      "",
      "RESUMEN FINANCIERO",
      `Crédito Total: ${formatCurrency(calculatedBalances.balanceTotal)}`,
      `Balance Vigente: ${formatCurrency(calculatedBalances.balanceVigente)}`,
      `Balance Vencido: ${formatCurrency(calculatedBalances.balanceVencido)}`,
      "",
      `FACTURAS (${filteredInvoices.length} de ${invoices.length})`,
      ...filteredInvoices.map(
        (inv) =>
          `${inv.invoiceNumber}: ${formatCurrency(inv.total)} | Saldo: ${formatCurrency(inv.balance)} | Estado: ${inv.invoiceStatus.name}`
      ),
    ];

    return lines.filter(Boolean).join("\n");
  };

  // Hook para captura de contenido
  const { contentRef, handleCopy, isCopying } = useCaptureDialog({
    getFallbackText,
  });

  // Fetch invoices cuando se abre el dialog
  useEffect(() => {
    if (!customer || !open) {
      return;
    }

    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/invoices?customerId=${customer.id}&withBalance=true`
        );

        if (!response.ok) {
          throw new Error("Error al cargar facturas");
        }

        const data = await response.json();
        setInvoices(data.invoices || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [customer, open]);

  // Actualizar fecha de generación cuando se abre el dialog
  useEffect(() => {
    if (open && customer) {
      setGeneratedDate(new Date());
    }
  }, [open, customer]);

  // Calcular balances dinámicamente desde las facturas cargadas
  // Esto garantiza que los balances siempre reflejen el estado actual
  // (vigente vs vencido) incluso si las columnas de Customer están desactualizadas
  useEffect(() => {
    if (!invoices || invoices.length === 0) {
      // Si no hay facturas, resetear a los valores del customer prop
      setCalculatedBalances({
        balanceTotal: customer?.balanceTotal ?? 0,
        balanceVigente: customer?.balanceVigente ?? 0,
        balanceVencido: customer?.balanceVencido ?? 0,
      });
      return;
    }

    // Calcular balances desde las facturas (que tienen estados dinámicos correctos)
    const balanceTotal = invoices.reduce((sum, inv) => sum + inv.balance, 0);
    const balanceVencido = invoices
      .filter((inv) => inv.invoiceStatus.name === "overdue")
      .reduce((sum, inv) => sum + inv.balance, 0);
    const balanceVigente = invoices
      .filter((inv) => inv.invoiceStatus.name === "current")
      .reduce((sum, inv) => sum + inv.balance, 0);

    setCalculatedBalances({
      balanceTotal,
      balanceVigente,
      balanceVencido,
    });
  }, [invoices, customer]);

  if (!customer) return null;

  const isCopyDisabled = isLoading || isCopying;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl p-0 max-h-[90vh] overflow-y-auto gap-0"
        showCloseButton={false}
      >
        {/* Título accesible */}
        <DialogTitle className="sr-only">
          Estado de Cuenta - {customer.razonSocial}
        </DialogTitle>

        {/* Barra superior - NO SE CAPTURA */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-capture-border bg-capture-bg">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtro multiselect */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="capture"
                  size="sm"
                  className="border border-capture-border"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Estado
                  {selectedStatuses.size > 0 && (
                    <>
                      <Separator orientation="vertical" className="mx-2 h-4" />
                      <Badge
                        variant="secondary"
                        className="border border-capture-foreground "
                      >
                        {selectedStatuses.size}
                      </Badge>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2">
                  {filterOptions.map((option) => {
                    const isSelected = selectedStatuses.has(option.value);
                    return (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                        onClick={() => toggleStatus(option.value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStatus(option.value)}
                        />
                        <label className="flex-1 text-sm font-normal cursor-pointer">
                          {option.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {selectedStatuses.size > 0 && (
                  <>
                    <Separator />
                    <div className="p-2">
                      <Button
                        variant="capture"
                        size="sm"
                        className="w-full justify-center text-xs"
                        onClick={clearFilters}
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                  </>
                )}
              </PopoverContent>
            </Popover>

            {/* Badges de filtros seleccionados */}
            {selectedStatuses.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {Array.from(selectedStatuses).map((status) => {
                  const option = filterOptions.find(
                    (opt) => opt.value === status
                  );
                  return (
                    <Badge
                      key={status}
                      variant="secondary"
                      className="font-normal"
                    >
                      {option?.label}
                    </Badge>
                  );
                })}
                <span className="text-sm text-muted-foreground">
                  ({filteredInvoices.length} de {invoices.length})
                </span>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <Button
              variant="capture"
              size="icon"
              onClick={handleCopy}
              disabled={isCopyDisabled}
              title="Copiar al portapapeles"
            >
              {isCopying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>

            <DialogClose asChild>
              <Button variant="capture" size="icon" title="Cerrar">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Área de captura - SE CONVIERTE EN IMAGEN */}
        <div
          ref={contentRef}
          className="bg-capture-bg text-capture-foreground p-6 space-y-6"
        >
          {/* Header: Información del Cliente */}
          <div className="border-b border-capture-border pb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">ESTADO DE CUENTA</h2>
              <div className="flex items-center gap-1.5 text-sm text-capture-foreground/70">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(generatedDate, "short", configuration.locale)}
                </span>
              </div>
            </div>
            <CustomerNameInfo
              rut={customer.rut}
              razonSocial={customer.razonSocial}
              tradeName={customer.tradeName ?? undefined}
              className="text-lg text-capture-foreground"
              rutClassName="text-lg text-capture-foreground"
              razonSocialClassName="text-lg text-capture-foreground"
            />
          </div>

          {/* Resumen Financiero */}
          <CustomerInvoiceInfo
            balanceTotal={calculatedBalances.balanceTotal}
            balanceVigente={calculatedBalances.balanceVigente}
            balanceVencido={calculatedBalances.balanceVencido}
          />

          {/* Tabla de Facturas */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Facturas del Cliente
              {!isLoading && !error && selectedStatuses.size > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredInvoices.length} de {invoices.length})
                </span>
              )}
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                Error al cargar facturas: {error}
              </div>
            ) : (
              <InvoiceTable invoices={filteredInvoices} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
