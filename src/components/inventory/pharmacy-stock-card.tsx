import { Card, CardContent } from "@/components/ui/card";
import { StockBadge } from "./stock-badge";
import { getStockStatus, getStockLabel } from "@/lib/utils/stock-status";
import { formatCurrency } from "@/lib/utils/format-currency";
import { MapPin } from "lucide-react";

interface PharmacyStockCardProps {
  pharmacyName: string;
  pharmacyAddress: string;
  medicineName: string;
  medicineCategory: string;
  price: number;
  quantity: number;
  minStock: number;
  isUpdated?: boolean; // Trigger untuk animasi pulse
}

export function PharmacyStockCard({
  pharmacyName,
  pharmacyAddress,
  medicineName,
  medicineCategory,
  price,
  quantity,
  minStock,
  isUpdated = false
}: PharmacyStockCardProps) {
  const stockStatus = getStockStatus(quantity, minStock);

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
          
          {/* Info Apotek */}
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900">{pharmacyName}</h3>
            <div className="flex items-start text-zinc-500 mt-1">
              <MapPin className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
              <p className="text-sm leading-snug line-clamp-2">{pharmacyAddress}</p>
            </div>
          </div>

          {/* Info Obat & Harga */}
          <div className="flex-1 sm:text-center sm:px-4 sm:border-l sm:border-r border-zinc-100">
             <div className="flex items-center gap-2 sm:justify-center mb-1">
                <p className="font-medium text-zinc-900">{medicineName}</p>
                <span className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                  {medicineCategory}
                </span>
             </div>
             <p className="text-sm font-semibold text-green-700">{formatCurrency(price)}</p>
          </div>

          {/* Stok & Status */}
          <div className="flex-1 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
            <div className="text-center sm:text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Stok Tersedia</p>
              <p className={`text-2xl font-bold ${quantity === 0 ? "text-red-600" : "text-zinc-900"}`}>
                {quantity}
              </p>
            </div>
            <StockBadge 
              status={stockStatus} 
              label={getStockLabel(stockStatus)} 
              pulse={isUpdated} 
            />
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
