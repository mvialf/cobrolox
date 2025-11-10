import { formatCurrency } from "@/lib/format";

interface CustomerInvoiceInfoProps {
  balanceTotal: number;
  balanceVigente: number;
  balanceVencido: number;
}

/**
 * Componente que muestra un resumen financiero del cliente
 * con balance total, vigente y vencido.
 *
 * Utiliza estilos de "capture" para integracion con capture-dialog.
 */
export function CustomerInvoiceInfo({
  balanceTotal,
  balanceVigente,
  balanceVencido,
}: CustomerInvoiceInfoProps) {
  return (
    <div className="flex flex-row justify-around items-center gap-4">
      <div className="flex flex-col bg-capture-card shadow-capture-md p-4 rounded-xl items-center gap-3">
        <p className="text-lg text-capture-foreground">Credito:</p>
        <p className="text-xl font-semibold">{formatCurrency(balanceTotal)}</p>
      </div>
      <div className="flex flex-col bg-capture-card shadow-capture-md p-4 rounded-xl items-center gap-3">
        <p className="text-lg text-capture-foreground">Vigente:</p>
        <p className="text-xl font-medium ">{formatCurrency(balanceVigente)}</p>
      </div>
      <div className="flex flex-col bg-capture-card shadow-capture-md p-4 rounded-xl items-center gap-3">
        <p className="text-lg text-capture-foreground">Vencido:</p>
        <p
          className={`text-xl font-semibold ${
            balanceVencido > 0 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {formatCurrency(balanceVencido)}
        </p>
      </div>
    </div>
  );
}
