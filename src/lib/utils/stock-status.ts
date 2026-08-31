import type { StockStatus } from "@/types/inventory";

/// Tentukan status stok berdasarkan quantity dan minStock threshold
export function getStockStatus(quantity: number, minStock: number): StockStatus {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= minStock) return "LOW_STOCK";
  return "IN_STOCK";
}

/// Label Indonesia untuk status stok
export function getStockLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    IN_STOCK: "Tersedia",
    LOW_STOCK: "Stok Menipis",
    OUT_OF_STOCK: "Habis",
  };
  return labels[status];
}

/// Warna badge untuk status stok (Tailwind CSS classes)
export function getStockBadgeColor(status: StockStatus): string {
  const colors: Record<StockStatus, string> = {
    IN_STOCK: "bg-green-100 text-green-800",
    LOW_STOCK: "bg-yellow-100 text-yellow-800",
    OUT_OF_STOCK: "bg-red-100 text-red-800",
  };
  return colors[status];
}
