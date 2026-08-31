import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/lib/utils/stock-status";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StockBadgeProps {
  status: StockStatus;
  label: string;
  className?: string;
  pulse?: boolean;
}

export function StockBadge({ status, label, className, pulse = false }: StockBadgeProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  // Trigger pulse animation ketika prop pulse berubah (misal karena stok terupdate via realtime)
  useEffect(() => {
    if (pulse) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pulse]);

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
        isPulsing ? "animate-pulse shadow-md" : "",
        className
      )}
    >
      {label}
    </Badge>
  );
}
