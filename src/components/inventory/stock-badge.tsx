import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/lib/utils/stock-status";
import { cn } from "@/lib/utils";

interface StockBadgeProps {
  status: StockStatus;
  label: string;
  className?: string;
  pulse?: boolean;
}

export function StockBadge({ status, label, className, pulse = false }: StockBadgeProps) {
  const variants: Record<StockStatus, string> = {
    IN_STOCK: "bg-green-100 text-green-800 border-green-200",
    LOW_STOCK: "bg-amber-100 text-amber-800 border-amber-200",
    OUT_OF_STOCK: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        variants[status],
        pulse ? "animate-pulse shadow-md" : "",
        className
      )}
    >
      {label}
    </Badge>
  );
}
