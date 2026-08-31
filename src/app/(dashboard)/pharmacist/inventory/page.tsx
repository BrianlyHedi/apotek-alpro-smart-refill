"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Minus, Save, X } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { getStockStatus } from "@/lib/utils/stock-status";
import { supabase } from "@/lib/supabase/client";

// Kita tidak memakai useInventory hook di sini karena hook itu me-merge stok lintas cabang (untuk view Pasien).
// Apoteker butuh view raw inventory list khusus untuk cabangnya saja.

interface InventoryItem {
  id: string;
  quantity: number;
  minStock: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State untuk melacak perubahan yang belum disave
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchInventory() {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch pharmacy ID of this user
        const { data: profile } = await supabase
          .from("users")
          .select("pharmacy_id, pharmacies(name)")
          .eq("id", user.id)
          .single();

        if (!profile?.pharmacy_id) throw new Error("Apoteker tidak terkait dengan cabang manapun");

        // Fetch inventory for this pharmacy
        const { data: invData, error } = await supabase
          .from("inventory")
          .select(`
            id, quantity, min_stock,
            medicines (name, category, price)
          `)
          .eq("pharmacy_id", profile.pharmacy_id)
          .order("medicines(name)", { ascending: true });

        if (error) throw error;

        const mapped: InventoryItem[] = (invData || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          minStock: item.min_stock,
          medicine: {
            name: item.medicines.name,
            category: item.medicines.category,
            price: item.medicines.price,
          }
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
    
    // Cari original qty
    const originalQty = inventory.find(i => i.id === id)?.quantity || 0;
    
    setEdits(prev => {
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
      // Save berurutan (untuk simplicity demo, bisa di-optimize via batch API kalau ada)
      for (const id of editIds) {
        const res = await fetch(`/api/inventory/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: edits[id] })
        });
        if (!res.ok) throw new Error(`Gagal update stok item ${id}`);
      }

      // Update local state
      setInventory(prev => prev.map(item => {
        if (edits[item.id] !== undefined) {
          return { ...item, quantity: edits[item.id] };
        }
        return item;
      }));

      setEdits({});
      addToast("success", `${editIds.length} item stok berhasil diperbarui`);
    } catch (err) {
      addToast("error", (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Manajemen Stok</h1>
          <p className="text-zinc-500">Perbarui stok fisik cabang Anda. Perubahan akan langsung terlihat oleh pasien.</p>
        </div>
        {hasEdits && (
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <span className="text-sm font-medium text-green-800">{Object.keys(edits).length} item diubah</span>
            <div className="h-4 w-px bg-green-200 mx-1"></div>
            <Button variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-zinc-700" onClick={() => setEdits({})}>
              <X className="h-4 w-4 mr-1" /> Batal
            </Button>
            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Simpan
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-zinc-50/50 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Cari obat..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Stok Fisik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-zinc-500">
                      Tidak ada obat ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map(item => {
                    const currentQty = edits[item.id] !== undefined ? edits[item.id] : item.quantity;
                    const isEdited = edits[item.id] !== undefined;
                    const stockStatus = getStockStatus(currentQty, item.minStock);
                    
                    return (
                      <TableRow key={item.id} className={isEdited ? "bg-amber-50/50" : ""}>
                        <TableCell className="font-medium">{item.medicine.name}</TableCell>
                        <TableCell>
                          <span className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                            {item.medicine.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            stockStatus.status === "IN_STOCK" ? "bg-green-100 text-green-800 border-green-200" :
                            stockStatus.status === "LOW_STOCK" ? "bg-amber-100 text-amber-800 border-amber-200" :
                            "bg-red-100 text-red-800 border-red-200"
                          }>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 rounded-full"
                              onClick={() => handleEdit(item.id, currentQty - 1)}
                              disabled={currentQty <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input 
                              type="number"
                              min="0"
                              className={`w-16 h-8 text-center text-sm ${isEdited ? "border-amber-300 bg-amber-50" : ""}`}
                              value={currentQty}
                              onChange={(e) => handleEdit(item.id, parseInt(e.target.value) || 0)}
                            />
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 rounded-full"
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
