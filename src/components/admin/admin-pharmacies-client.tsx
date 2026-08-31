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
import { Building2, MapPin, Phone, Plus, Search, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

interface PharmacyItem {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const { addToast } = useToast();
  const router = useRouter();

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

  const filtered = pharmacies.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari cabang apotek atau kota..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700 text-white shrink-0" />}>
            <>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Cabang Baru
            </>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddPharmacy}>
              <DialogHeader>
                <DialogTitle>Tambah Cabang Apotek Baru</DialogTitle>
                <DialogDescription>
                  Masukkan rincian cabang Apotek Alpro yang baru dibuka.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div className="space-y-1">
                  <Label htmlFor="branch-name" className="text-xs font-semibold">Nama Cabang</Label>
                  <Input
                    id="branch-name"
                    placeholder="Contoh: Apotek Alpro Menteng"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branch-city" className="text-xs font-semibold">Kota / Wilayah</Label>
                  <Input
                    id="branch-city"
                    placeholder="Contoh: Jakarta Pusat"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branch-address" className="text-xs font-semibold">Alamat Lengkap</Label>
                  <Input
                    id="branch-address"
                    placeholder="Jl. Menteng Raya No. 10..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branch-phone" className="text-xs font-semibold">Nomor Telepon (Opsional)</Label>
                  <Input
                    id="branch-phone"
                    placeholder="021-3912345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Menyimpan..." : "Simpan Cabang"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pharmacy) => (
          <Card key={pharmacy.id} className="shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900">{pharmacy.name}</CardTitle>
                  <p className="text-xs text-zinc-500">{pharmacy.city}</p>
                </div>
              </div>
              <Badge className={pharmacy.isActive ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}>
                {pharmacy.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-sm">
              <div className="flex items-start gap-2 text-zinc-600">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
                <span className="text-xs">{pharmacy.address}</span>
              </div>
              {pharmacy.phone && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="text-xs">{pharmacy.phone}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center text-xs">
                <div className="p-1.5 bg-zinc-50 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.staff}</p>
                  <p className="text-[10px] text-zinc-500">Staf</p>
                </div>
                <div className="p-1.5 bg-zinc-50 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.inventory}</p>
                  <p className="text-[10px] text-zinc-500">Stok SKU</p>
                </div>
                <div className="p-1.5 bg-zinc-50 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.orders}</p>
                  <p className="text-[10px] text-zinc-500">Pesanan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
