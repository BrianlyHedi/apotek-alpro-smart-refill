"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Edit, 
  Power, 
  BarChart3,
  Users,
  Package,
  ShoppingCart
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

export interface PharmacyItem {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  isActive: boolean;
  _count: {
    staff: number;
    inventory: number;
    orders: number;
  };
}

export function AdminPharmaciesClient({ initialPharmacies }: { initialPharmacies: PharmacyItem[] }) {
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>(initialPharmacies);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyItem | null>(null);
  const [statsPharmacy, setStatsPharmacy] = useState<PharmacyItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Add
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  // Form states for Edit
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const { addToast } = useToast();
  const router = useRouter();

  const handleOpenEdit = (pharmacy: PharmacyItem) => {
    setEditingPharmacy(pharmacy);
    setEditName(pharmacy.name);
    setEditAddress(pharmacy.address);
    setEditCity(pharmacy.city);
    setEditPhone(pharmacy.phone || "");
  };

  const handleAddPharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !city.trim()) {
      addToast("error", "Nama, alamat, dan kota wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan cabang");

      const created: PharmacyItem = {
        id: data.data.id,
        name: data.data.name,
        address: data.data.address,
        city: data.data.city,
        phone: data.data.phone,
        isActive: data.data.isActive ?? true,
        _count: { staff: 0, inventory: 28, orders: 0 },
      };

      setPharmacies([created, ...pharmacies]);
      addToast("success", `Cabang ${name} berhasil ditambahkan.`);
      setIsAddOpen(false);
      setName("");
      setAddress("");
      setCity("");
      setPhone("");
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menambahkan cabang");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPharmacy) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pharmacies/${editingPharmacy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          address: editAddress.trim(),
          city: editCity.trim(),
          phone: editPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah cabang");

      setPharmacies((prev) =>
        prev.map((p) =>
          p.id === editingPharmacy.id
            ? {
                ...p,
                name: editName.trim(),
                address: editAddress.trim(),
                city: editCity.trim(),
                phone: editPhone.trim() || null,
              }
            : p
        )
      );

      addToast("success", `Data cabang ${editName} berhasil diperbarui.`);
      setEditingPharmacy(null);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal memperbarui cabang");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (pharmacy: PharmacyItem) => {
    const nextStatus = !pharmacy.isActive;
    try {
      const res = await fetch(`/api/pharmacies/${pharmacy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status cabang");

      setPharmacies((prev) =>
        prev.map((p) => (p.id === pharmacy.id ? { ...p, isActive: nextStatus } : p))
      );
      addToast(
        "success",
        `Cabang ${pharmacy.name} berhasil ${nextStatus ? "diaktifkan" : "dinonaktifkan"}.`
      );
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal mengubah status");
    }
  };

  const filtered = pharmacies.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari nama cabang, kota, alamat..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold" />}>
            <>
              <Plus className="mr-1.5 h-4 w-4" /> Tambah Cabang Baru
            </>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Cabang Apotek Baru</DialogTitle>
              <DialogDescription>
                Cabang baru akan otomatis diinisialisasi dengan master data 28 SKU obat.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPharmacy} className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold">Nama Cabang Apotek</Label>
                <Input
                  placeholder="Contoh: Apotek Alpro Menteng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kota / Wilayah</Label>
                <Input
                  placeholder="Contoh: Jakarta Pusat"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Alamat Lengkap</Label>
                <Input
                  placeholder="Jl. Teuku Umar No. 12"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Nomor Telepon (Opsional)</Label>
                <Input
                  placeholder="021-31901234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? "Menyimpan..." : "Tambah Cabang"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid of Pharmacy Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pharmacy) => (
          <Card key={pharmacy.id} className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-600 shrink-0" />
                  <CardTitle className="text-sm font-bold text-zinc-900">{pharmacy.name}</CardTitle>
                </div>
                <Badge
                  className={
                    pharmacy.isActive
                      ? "bg-emerald-100 text-emerald-800 text-[10px]"
                      : "bg-zinc-100 text-zinc-600 text-[10px]"
                  }
                >
                  {pharmacy.isActive ? "Aktif Beroperasi" : "Nonaktif"}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStatsPharmacy(pharmacy)}
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                  title="Lihat Statistik Cabang"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(pharmacy)}
                  className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                  title="Edit Cabang"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <div className="text-xs text-zinc-500 space-y-1">
                <p className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span>{pharmacy.address}, {pharmacy.city}</span>
                </p>
                {pharmacy.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span>{pharmacy.phone}</span>
                  </p>
                )}
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
                <div className="bg-zinc-50 p-2 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.staff}</p>
                  <p className="text-[10px] text-zinc-500">Staf</p>
                </div>
                <div className="bg-zinc-50 p-2 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.inventory}</p>
                  <p className="text-[10px] text-zinc-500">SKU Obat</p>
                </div>
                <div className="bg-zinc-50 p-2 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.orders}</p>
                  <p className="text-[10px] text-zinc-500">Pesanan</p>
                </div>
              </div>

              <div className="pt-1 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(pharmacy)}
                  className={`w-full text-xs h-7 font-medium ${
                    pharmacy.isActive
                      ? "text-zinc-600 hover:text-red-700 hover:border-red-300"
                      : "text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                  }`}
                >
                  <Power className="mr-1.5 h-3 w-3" />
                  {pharmacy.isActive ? "Nonaktifkan Cabang" : "Aktifkan Cabang"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Edit Cabang */}
      <Dialog open={!!editingPharmacy} onOpenChange={(open) => !open && setEditingPharmacy(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Cabang Apotek</DialogTitle>
            <DialogDescription>
              Perbarui nama, alamat, atau nomor kontak operasional cabang.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePharmacy} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Nama Cabang</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Kota / Wilayah</Label>
              <Input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Alamat Lengkap</Label>
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Nomor Telepon</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setEditingPharmacy(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Statistik Cabang */}
      <Dialog open={!!statsPharmacy} onOpenChange={(open) => !open && setStatsPharmacy(null)}>
        <DialogContent className="sm:max-w-md">
          {statsPharmacy && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-100 text-green-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold">{statsPharmacy.name}</DialogTitle>
                    <DialogDescription>{statsPharmacy.city}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-zinc-50 border rounded-lg">
                  <Users className="h-4 w-4 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold text-zinc-900">{statsPharmacy._count.staff}</p>
                  <p className="text-[11px] text-zinc-500">Staf Apoteker</p>
                </div>
                <div className="p-3 bg-zinc-50 border rounded-lg">
                  <Package className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-bold text-zinc-900">{statsPharmacy._count.inventory}</p>
                  <p className="text-[11px] text-zinc-500">SKU Terdaftar</p>
                </div>
                <div className="p-3 bg-zinc-50 border rounded-lg">
                  <ShoppingCart className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                  <p className="text-lg font-bold text-zinc-900">{statsPharmacy._count.orders}</p>
                  <p className="text-[11px] text-zinc-500">Total Transaksi</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-zinc-700">Alamat Lengkap:</p>
                <p className="text-zinc-600">{statsPharmacy.address}</p>
                {statsPharmacy.phone && <p className="text-zinc-600">Kontak: {statsPharmacy.phone}</p>}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setStatsPharmacy(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
