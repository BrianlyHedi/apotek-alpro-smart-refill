/// Status stok untuk UI badge
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

/// Inventory per cabang dengan info obat dan pharmacy
export interface InventoryWithDetails {
  id: string;
  quantity: number;
  minStock: number;
  lastUpdated: Date;
  stockStatus: StockStatus;
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  medicine: {
    id: string;
    name: string;
    category: string;
    price: number;
    dosageForm: string;
  };
}

/// Stok obat di semua cabang — untuk halaman "Cek Stok"
export interface MedicineStockAcrossBranches {
  medicineId: string;
  medicineName: string;
  branches: {
    pharmacyId: string;
    pharmacyName: string;
    city: string;
    quantity: number;
    stockStatus: StockStatus;
  }[];
}

/// Payload realtime event dari Supabase
export interface InventoryRealtimePayload {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  quantity: number;
  min_stock: number;
  last_updated: string;
}
