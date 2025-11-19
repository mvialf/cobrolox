"use client";

import { differenceInCalendarDays, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface InvoiceDueDateCellProps {
  dueDate: string | Date;
  isPaid?: boolean;
}

export function InvoiceDueDateCell({
  dueDate,
  isPaid = false,
}: InvoiceDueDateCellProps) {
  const dateObj = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const formattedDate = formatDate(dateObj, "short");

  const today = startOfDay(new Date());
  const dueDateStart = startOfDay(dateObj);
  const diffDays = differenceInCalendarDays(dueDateStart, today);

  // No mostrar badge si está pagada o faltan más de 30 días
  const showBadge = !isPaid && diffDays <= 30;

  if (!showBadge) {
    return <span className="text-muted-foreground">{formattedDate}</span>;
  }

  // Determinar variant del badge según días restantes
  const getBadgeVariant = () => {
    if (diffDays < 0) return "destructive"; // Vencida
    if (diffDays === 0) return "destructive"; // Vence hoy
    if (diffDays <= 3) return "warning"; // Muy urgente (naranja)
    if (diffDays <= 7) return "secondary"; // Urgente
    return "outline"; // Normal
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={getBadgeVariant()}
        className={cn(
          "min-w-[2.5rem] justify-center font-mono tabular-nums",
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
      <span>{formattedDate}</span>
    </div>
  );
}
