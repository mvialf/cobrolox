"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Calendar,
  User,
  FileText,
  DollarSign,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";
import { useConfiguration } from "@/hooks/use-configuration";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants/invoice-status-constants";

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  allocatedAmount: number;
  balance: number;
  customer: {
    id: string;
    rut: string;
    razonSocial: string;
    tradeName: string | null;
    contact: string | null;
    phone: string | null;
    email: string | null;
  };
  invoiceStatus: {
    id: string;
    name: string;
    color: {
      bgClass: string;
      textClass: string;
    };
  };
  paymentInvoiceStatus: {
    id: string;
    name: string;
    color: {
      bgClass: string;
      textClass: string;
    };
  };
  allocations: Array<{
    id: string;
    allocatedAmount: number;
    payment: {
      id: string;
      amount: number;
      date: string;
      reference: string | null;
    };
  }>;
}

interface InvoiceDetailDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog modal para ver los detalles completos de una factura
 *
 * Características:
 * - Fetch automático de datos al abrir
 * - Muestra toda la información de la factura
 * - Lista de pagos aplicados
 * - Cálculo de balance pendiente
 * - Información del cliente
 */
export function InvoiceDetailDialog({
  invoiceId,
  open,
  onOpenChange,
}: InvoiceDetailDialogProps) {
  const { configuration } = useConfiguration();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invoice data cuando se abre el dialog
  useEffect(() => {
    if (!invoiceId || !open) {
      setInvoice(null);
      setError(null);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/invoices/${invoiceId}`);

        if (!response.ok) {
          throw new Error("Error al cargar factura");
        }

        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setError("No se pudo cargar la información de la factura");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Factura</DialogTitle>
          <DialogDescription>
            Información completa del registro de factura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando datos...</div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          ) : invoice ? (
            <>
              {/* Número de Factura y Montos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Factura</div>
                    <div className="text-2xl font-bold">
                      {invoice.invoiceNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </div>
                  </div>
                </div>

                {/* Balance Pendiente */}
                {invoice.balance > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Balance Pendiente:
                    </span>
                    <span className="text-lg font-bold text-amber-900 dark:text-amber-100">
                      {formatCurrency(invoice.balance, invoice.currency)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Estados */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-2">
                    Estado de Factura
                  </div>
                  <StatusBadge
                    bgClass={invoice.invoiceStatus.color.bgClass}
                    label={
                      INVOICE_STATUS_LABELS[
                        invoice.invoiceStatus
                          .name as keyof typeof INVOICE_STATUS_LABELS
                      ] || invoice.invoiceStatus.name
                    }
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-2">
                    Estado de Pago
                  </div>
                  <StatusBadge
                    bgClass={invoice.paymentInvoiceStatus.color.bgClass}
                    label={
                      PAYMENT_STATUS_LABELS[
                        invoice.paymentInvoiceStatus
                          .name as keyof typeof PAYMENT_STATUS_LABELS
                      ] || invoice.paymentInvoiceStatus.name
                    }
                  />
                </div>
              </div>

              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Fecha Emisión:</span>
                    <span className="text-sm">
                      {formatDate(
                        invoice.issueDate,
                        "full",
                        configuration.locale,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Vencimiento:</span>
                    <span className="text-sm">
                      {formatDate(
                        invoice.dueDate,
                        "full",
                        configuration.locale,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cliente:</span>
                    <span className="text-sm">
                      {invoice.customer.razonSocial}
                      {invoice.customer.tradeName &&
                        ` (${invoice.customer.tradeName})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">RUT:</span>
                    <span className="text-sm font-mono">
                      {invoice.customer.rut}
                    </span>
                  </div>

                  {invoice.notes && (
                    <div className="flex items-start gap-2 pt-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-sm font-medium">Notas:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {invoice.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Desglose de Montos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Desglose de Montos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (19%):</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.taxAmount, invoice.currency)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                  {invoice.allocatedAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Monto Pagado:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            invoice.allocatedAmount,
                            invoice.currency,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-semibold text-amber-600 dark:text-amber-400">
                        <span>Balance Pendiente:</span>
                        <span>
                          {formatCurrency(invoice.balance, invoice.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Pagos Aplicados */}
              {invoice.allocations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pagos Aplicados ({invoice.allocations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {invoice.allocations.map((alloc) => (
                        <div
                          key={alloc.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatDate(
                                alloc.payment.date,
                                "full",
                                configuration.locale,
                              )}
                            </div>
                            {alloc.payment.reference && (
                              <div className="text-xs text-muted-foreground font-mono">
                                Ref: {alloc.payment.reference}
                              </div>
                            )}
                          </div>
                          <div className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(
                              alloc.allocatedAmount,
                              invoice.currency,
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ID de la Factura (para referencia técnica) */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                ID: {invoice.id}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
