"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type {
  InventoryWithDetails,
  InventoryRealtimePayload,
} from "@/types/inventory";
import { getStockStatus } from "@/lib/utils/stock-status";

interface UseInventoryOptions {
  pharmacyId?: string;
  medicineId?: string;
}

interface UseInventoryReturn {
  inventory: InventoryWithDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/// Hook untuk realtime inventory subscription — "wow factor" demo.
/// Setiap perubahan stok di cabang mana pun langsung update tanpa refresh.
export function useInventory(
  options: UseInventoryOptions = {}
): UseInventoryReturn {
  const { pharmacyId, medicineId } = options;
  const [inventory, setInventory] = useState<InventoryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setError(null);
      let query = supabase
        .from("inventory")
        .select(
          `
          id, quantity, min_stock, last_updated,
          pharmacies!inner(id, name, address, city),
          medicines!inner(id, name, category, price, dosage_form)
        `
        )
        .order("last_updated", { ascending: false });

      if (pharmacyId) query = query.eq("pharmacy_id", pharmacyId);
      if (medicineId) query = query.eq("medicine_id", medicineId);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const mapped: InventoryWithDetails[] = (data ?? []).map(
        (item: Record<string, unknown>) => {
          const pharmacy = item.pharmacies as Record<string, unknown>;
          const medicine = item.medicines as Record<string, unknown>;
          const qty = item.quantity as number;
          const minStk = item.min_stock as number;

          return {
            id: item.id as string,
            quantity: qty,
            minStock: minStk,
            lastUpdated: new Date(item.last_updated as string),
            stockStatus: getStockStatus(qty, minStk),
            pharmacy: {
              id: pharmacy.id as string,
              name: pharmacy.name as string,
              address: pharmacy.address as string,
              city: pharmacy.city as string,
            },
            medicine: {
              id: medicine.id as string,
              name: medicine.name as string,
              category: medicine.category as string,
              price: medicine.price as number,
              dosageForm: medicine.dosage_form as string,
            },
          };
        }
      );

      setInventory(mapped);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data inventory"
      );
    } finally {
      setIsLoading(false);
    }
  }, [pharmacyId, medicineId]);

  useEffect(() => {
    fetchInventory();

    // Subscribe ke realtime changes pada tabel inventory
    const channel = supabase
      .channel("inventory-changes")
      .on<InventoryRealtimePayload>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
          ...(pharmacyId ? { filter: `pharmacy_id=eq.${pharmacyId}` } : {}),
        },
        () => {
          // Re-fetch semua data karena perlu JOIN dengan pharmacy dan medicine
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInventory, pharmacyId]);

  return { inventory, isLoading, error, refetch: fetchInventory };
}
