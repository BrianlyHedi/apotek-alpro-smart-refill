"use client";

import { useState, useMemo } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { PharmacyStockCard } from "@/components/inventory/pharmacy-stock-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, SignalHigh } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface MedicineGroup {
  medicine: {
    id: string;
    name: string;
    category: string;
    price: number;
    dosageForm: string;
  };
  stockAcrossBranches: {
    pharmacyId: string;
    pharmacyName: string;
    pharmacyAddress: string;
    quantity: number;
    minStock: number;
  }[];
}

export default function RealtimeInventoryPage() {
  const { inventory, isLoading, error, lastUpdatedMedicineId } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");

  // Grouping inventory berdasarkan obat
  const groupedInventory = useMemo(() => {
    const map = new Map<string, MedicineGroup>();
    for (const item of inventory) {
      let group = map.get(item.medicine.id);
      if (!group) {
        group = {
          medicine: item.medicine,
          stockAcrossBranches: [],
        };
        map.set(item.medicine.id, group);
      }
      group.stockAcrossBranches.push({
        pharmacyId: item.pharmacy.id,
        pharmacyName: item.pharmacy.name,
        pharmacyAddress: item.pharmacy.address,
        quantity: item.quantity,
        minStock: item.minStock,
      });
    }
    return Array.from(map.values());
  }, [inventory]);

  // Ekstrak daftar cabang unik untuk dropdown filter
  const branches = useMemo(() => {
    const uniqueBranches = new Set<string>();
    groupedInventory.forEach(item => {
      item.stockAcrossBranches.forEach(branch => {
        uniqueBranches.add(branch.pharmacyName);
      });
    });
    return Array.from(uniqueBranches).sort();
  }, [groupedInventory]);

  // Label mapping untuk dropdown filter
  const categoryLabels: Record<string, string> = {
    ALL: "Semua Kategori",
    OTC: "Obat Bebas (OTC)",
    PRESCRIPTION: "Obat Resep",
  };

  // Filter data berdasarkan input user
  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return groupedInventory.filter((item) => {
      const matchSearch =
        !q ||
        item.medicine.name.toLowerCase().includes(q) ||
        item.medicine.category.toLowerCase().includes(q) ||
        (item.medicine.dosageForm && item.medicine.dosageForm.toLowerCase().includes(q)) ||
        item.stockAcrossBranches.some(
          (b) =>
            b.pharmacyName.toLowerCase().includes(q) ||
            b.pharmacyAddress.toLowerCase().includes(q)
        );

      const matchCategory =
        categoryFilter === "ALL" || item.medicine.category === categoryFilter;

      // Jika branch spesifik dipilih, pastikan obat ini ada di branch tersebut
      const matchBranch =
        branchFilter === "ALL" ||
        item.stockAcrossBranches.some((b) => b.pharmacyName === branchFilter);

      return matchSearch && matchCategory && matchBranch;
    });
  }, [groupedInventory, searchQuery, categoryFilter, branchFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertTitle>Gagal memuat data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Cek Stok Obat</h1>
          <SignalHigh className="h-5 w-5 text-green-600 animate-pulse" />
        </div>
        <p className="text-zinc-500">
          Cari ketersediaan obat di seluruh cabang Apotek Alpro secara realtime.
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg border shadow-sm grid gap-4 md:grid-cols-12">
        <div className="space-y-2 md:col-span-6">
          <Label htmlFor="search">Cari Obat</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              id="search"
              placeholder="Cari nama obat, kategori, bentuk sediaan, atau cabang..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label>Kategori</Label>
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "ALL")}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Semua Kategori">
                {categoryLabels[categoryFilter] || categoryFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              <SelectItem value="OTC">Obat Bebas (OTC)</SelectItem>
              <SelectItem value="PRESCRIPTION">Obat Resep</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label>Cabang Apotek</Label>
          <Select value={branchFilter} onValueChange={(val) => setBranchFilter(val || "ALL")}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Semua Cabang">
                {branchFilter === "ALL" ? "Semua Cabang" : branchFilter.replace("Apotek Alpro ", "")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Cabang</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch.replace("Apotek Alpro ", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-8">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-zinc-500">Tidak ada obat yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          filteredInventory.map((item) => (
            <div key={item.medicine.id} className="space-y-3">
              <h2 className="text-xl font-semibold text-zinc-900 px-1 border-b pb-2">
                {item.medicine.name}
              </h2>
              
              <div className="grid gap-4">
                {item.stockAcrossBranches
                  .filter(branch => branchFilter === "ALL" || branch.pharmacyName === branchFilter)
                  .map((branch) => (
                    <PharmacyStockCard
                      key={branch.pharmacyId}
                      pharmacyName={branch.pharmacyName}
                      pharmacyAddress={branch.pharmacyAddress}
                      medicineName={item.medicine.name}
                      medicineCategory={item.medicine.category}
                      price={item.medicine.price}
                      quantity={branch.quantity}
                      minStock={branch.minStock}
                      // Trigger pulse animation jika obat ini baru saja diupdate via realtime
                      isUpdated={lastUpdatedMedicineId === item.medicine.id}
                    />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
