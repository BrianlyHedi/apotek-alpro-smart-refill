"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  Plus, 
  Minus, 
  Save, 
  X, 
  Clock, 
  Building2, 
  Filter, 
  PackageSearch,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { getStockStatus, getStockLabel } from "@/lib/utils/stock-status";
import { supabase } from "@/lib/supabase/client";
import { formatRelativeDay, formatDateTime } from "@/lib/utils/format-date";

interface SupabaseMedicine {
  name: string;
  category: string;
  price: number;
}

interface SupabaseInventoryItem {
  id: string;
  quantity: number;
  min_stock: number;
  last_updated?: string;
  medicines: SupabaseMedicine;
}

interface InventoryItem {
  id: string;
  quantity: number;
  minStock: number;
  lastUpdated: string;
  medicine: {
    name: string;
    category: string;
    price: number;
  };
}

export default function PharmacistInventoryPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pharmacyName, setPharmacyName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "OTC" | "PRESCRIPTION">("ALL");

  // State untuk melacak perubahan yang belum disave
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchInventory() {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("pharmacy_id, pharmacies(name)")
          .eq("id", user.id)
          .single();

        if (!profile?.pharmacy_id) throw new Error("Apoteker tidak terkait dengan cabang manapun");
        const pharmacyData = profile.pharmacies as unknown as { name: string } | null;
        setPharmacyName(pharmacyData?.name || "Cabang Apotek");

        const { data: invData, error } = await supabase
          .from("inventory")
          .select(`
            id, quantity, min_stock, last_updated,
            medicines (name, category, price)
          `)
          .eq("pharmacy_id", profile.pharmacy_id)
          .order("medicines(name)", { ascending: true }) as { data: SupabaseInventoryItem[] | null; error: unknown };

        if (error) throw error as Error;

        const mapped: InventoryItem[] = (invData || []).map((item) => ({
          id: item.id,
          quantity: item.quantity,
          minStock: item.min_stock,
          lastUpdated: item.last_updated || new Date().toISOString(),
          medicine: {
            name: item.medicines.name,
            category: item.medicines.category,
            price: item.medicines.price,
          },
        }));

        setInventory(mapped);
      } catch (err) {
        addToast("error", (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInventory();
  }, [user, addToast]);

  const handleEdit = (id: string, newQty: number) => {
    if (newQty < 0) return;
    const originalQty = inventory.find((i) => i.id === id)?.quantity || 0;

    setEdits((prev) => {
      const next = { ...prev };
      if (newQty === originalQty) {
        delete next[id];
      } else {
        next[id] = newQty;
      }
      return next;
    });
  };

  const handleSave = async () => {
    const editIds = Object.keys(edits);
    if (editIds.length === 0) return;

    setIsSaving(true);
    try {
      for (const id of editIds) {
        const res = await fetch(`/api/inventory/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: edits[id] }),
        });
        if (!res.ok) throw new Error(`Gagal update stok item ${id}`);
      }

      const nowStr = new Date().toISOString();
      setInventory((prev) =>
        prev.map((item) => {
          if (edits[item.id] !== undefined) {
            return { ...item, quantity: edits[item.id], lastUpdated: nowStr };
          }
          return item;
        })
      );

      setEdits({});
      addToast("success", `${editIds.length} item stok cabang berhasil diperbarui secara realtime`);
    } catch (err) {
      addToast("error", (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const currentQty = edits[item.id] !== undefined ? edits[item.id] : item.quantity;
    const stockStatus = getStockStatus(currentQty, item.minStock);

    const matchesSearch =
      item.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.medicine.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || statusFilter === stockStatus;

    const matchesCategory =
      categoryFilter === "ALL" || categoryFilter === item.medicine.category;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const hasEdits = Object.keys(edits).length > 0;
  const lowStockCount = inventory.filter((i) => getStockStatus(i.quantity, i.minStock) !== "IN_STOCK").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <PackageSearch className="h-8 w-8 text-green-600" />
            Manajemen Stok — {pharmacyName}
          </h1>
          <p className="text-zinc-500">
            Perbarui stok fisik cabang Anda. Perubahan akan langsung terlihat secara real-time oleh pasien.
          </p>
        </div>

        {hasEdits && (
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-300 shadow-sm animate-pulse-success">
            <span className="text-sm font-semibold text-green-800">{Object.keys(edits).length} item diubah</span>
            <div className="h-4 w-px bg-green-300 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-zinc-600 hover:text-zinc-900"
              onClick={() => setEdits({})}
            >
              <X className="h-4 w-4 mr-1" /> Batal
            </Button>
            <Button
              size="sm"
              className="h-8 bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Simpan Stok
            </Button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-zinc-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Cari nama obat..."
              className="pl-9 bg-white text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded transition-all ${
                  statusFilter === "ALL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Semua ({inventory.length})
              </button>
              <button
                onClick={() => setStatusFilter("IN_STOCK")}
                className={`px-2.5 py-1 rounded transition-all ${
                  statusFilter === "IN_STOCK" ? "bg-white text-green-700 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Aman
              </button>
              <button
                onClick={() => setStatusFilter("LOW_STOCK")}
                className={`px-2.5 py-1 rounded transition-all ${
                  statusFilter === "LOW_STOCK" ? "bg-white text-amber-700 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Menipis ({lowStockCount})
              </button>
              <button
                onClick={() => setStatusFilter("OUT_OF_STOCK")}
                className={`px-2.5 py-1 rounded transition-all ${
                  statusFilter === "OUT_OF_STOCK" ? "bg-white text-red-700 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Habis
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setCategoryFilter("ALL")}
                className={`px-2 py-1 rounded transition-all ${
                  categoryFilter === "ALL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
                }`}
              >
                Semua Kategori
              </button>
              <button
                onClick={() => setCategoryFilter("OTC")}
                className={`px-2 py-1 rounded transition-all ${
                  categoryFilter === "OTC" ? "bg-white text-emerald-700 shadow-sm" : "text-zinc-600"
                }`}
              >
                OTC
              </button>
              <button
                onClick={() => setCategoryFilter("PRESCRIPTION")}
                className={`px-2 py-1 rounded transition-all ${
                  categoryFilter === "PRESCRIPTION" ? "bg-white text-blue-700 shadow-sm" : "text-zinc-600"
                }`}
              >
                Resep
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status Ketersediaan</TableHead>
                  <TableHead>Terakhir Diupdate</TableHead>
                  <TableHead className="text-right">Penyesuaian Stok Fisik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-zinc-500">
                      Tidak ada obat yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const currentQty = edits[item.id] !== undefined ? edits[item.id] : item.quantity;
                    const isEdited = edits[item.id] !== undefined;
                    const stockStatus = getStockStatus(currentQty, item.minStock);

                    return (
                      <TableRow key={item.id} className={isEdited ? "bg-amber-50/70" : ""}>
                        <TableCell className="font-semibold text-zinc-900">
                          {item.medicine.name}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                            {item.medicine.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              stockStatus === "IN_STOCK"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : stockStatus === "LOW_STOCK"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }
                          >
                            {getStockLabel(stockStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {item.lastUpdated ? formatRelativeDay(item.lastUpdated) : "Hari ini"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-md"
                              onClick={() => handleEdit(item.id, currentQty - 1)}
                              disabled={currentQty <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              className={`w-16 h-8 text-center text-xs font-bold ${
                                isEdited ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200" : "bg-white"
                              }`}
                              value={currentQty}
                              onChange={(e) => handleEdit(item.id, parseInt(e.target.value) || 0)}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-md"
                              onClick={() => handleEdit(item.id, currentQty + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
