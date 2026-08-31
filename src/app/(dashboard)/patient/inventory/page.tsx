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
import { Search, Loader2, SignalHigh } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function RealtimeInventoryPage() {
  const { inventory, isLoading, error, lastUpdatedMedicineId } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");

  // Ekstrak daftar cabang unik untuk dropdown filter
  const branches = useMemo(() => {
    const uniqueBranches = new Set<string>();
    inventory.forEach(item => {
      item.stockAcrossBranches.forEach(branch => {
        uniqueBranches.add(branch.pharmacyName);
      });
    });
    return Array.from(uniqueBranches).sort();
  }, [inventory]);

  // Filter data berdasarkan input user
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch = item.medicine.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || item.medicine.category === categoryFilter;
      
      // Jika branch spesifik dipilih, pastikan obat ini ada di branch tersebut
      const matchBranch = branchFilter === "ALL" || 
        item.stockAcrossBranches.some(b => b.pharmacyName === branchFilter);

      return matchSearch && matchCategory && matchBranch;
    });
  }, [inventory, searchQuery, categoryFilter, branchFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-lg" />
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map(i => (
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
              placeholder="Contoh: Paracetamol, Metformin..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2 md:col-span-3">
          <Label>Kategori</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kategori" />
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
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Cabang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Cabang</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch}>{branch.replace('Apotek Alpro ', '')}</SelectItem>
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
