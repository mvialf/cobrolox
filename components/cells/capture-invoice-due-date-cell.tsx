"use client";

import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface CaptureInvoiceDueDateCellProps {
  dueDate: string | Date;
  isPaid?: boolean;
}

/**
 * Celda de fecha de vencimiento para contexto de captura
 * Usa colores capture-* para consistencia en capturas
 */
export function CaptureInvoiceDueDateCell({
  dueDate,
  isPaid = false,
}: CaptureInvoiceDueDateCellProps) {
  const dateObj = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const formattedDate = formatDate(dateObj, "short");

  const today = startOfDay(new Date());
  const dueDateStart = startOfDay(dateObj);
  const diffDays = differenceInCalendarDays(dueDateStart, today);

  // No mostrar badge si está pagada o faltan más de 30 días
  const showBadge = !isPaid && diffDays <= 30;

  if (!showBadge) {
    return <span className="text-capture-muted">{formattedDate}</span>;
  }

  // Determinar clases según días restantes
  const getBadgeClasses = () => {
    if (diffDays < 0) {
      // Vencida
      return "bg-capture-badge-red text-capture-badge-red-foreground";
    }
    if (diffDays === 0) {
      // Vence hoy
      return "bg-capture-badge-red text-capture-badge-red-foreground";
    }
    if (diffDays <= 3) {
      // Muy urgente (naranja)
      return "bg-capture-badge-orange text-capture-badge-orange-foreground";
    }
    if (diffDays <= 7) {
      // Urgente
      return "bg-capture-badge-gray text-capture-badge-gray-foreground";
    }
    // Normal
    return "bg-capture-card text-capture-foreground border border-capture-border";
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={cn(
          getBadgeClasses(),
          "min-w-[2.5rem] justify-center font-mono tabular-nums border-0",
          // Ajustar tamaño para números grandes
          Math.abs(diffDays) >= 100 && "text-xs px-1"
        )}
        aria-label={
          diffDays < 0
            ? `Vencida hace ${Math.abs(diffDays)} días`
            : diffDays === 0
              ? "Vence hoy"
              : `Faltan ${diffDays} días`
        }
      >
        {diffDays}
      </Badge>
      <span className="text-capture-foreground">{formattedDate}</span>
    </div>
  );
}
