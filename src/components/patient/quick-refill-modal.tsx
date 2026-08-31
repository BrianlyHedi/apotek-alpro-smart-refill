"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";
import { 
  RefreshCw, 
  MapPin, 
  Truck, 
  Store, 
  Loader2, 
  CheckCircle2, 
  Pill, 
  Package, 
  AlertTriangle, 
  XCircle,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface QuickRefillItem {
  id: string;
  medicine: {
    id: string;
    name: string;
    price: number;
    dosageForm?: string;
  };
  frequencyDays: number;
}

interface PharmacyOption {
  id: string;
  name: string;
  city: string;
  address: string;
  stock: number | null;
  minStock: number;
}

interface QuickRefillModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  refillItem: QuickRefillItem | null;
}

export function QuickRefillModal({
  isOpen,
  onOpenChange,
  refillItem,
}: QuickRefillModalProps) {
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(30);
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && refillItem) {
      setIsLoadingPharmacies(true);
      fetch(`/api/pharmacies?medicineId=${refillItem.medicine.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setPharmacies(data.data);
            if (!selectedPharmacyId && data.data.length > 0) {
              // Pilih cabang pertama yang memiliki stok mencukupi jika ada
              const inStockBranch = data.data.find((p: PharmacyOption) => (p.stock ?? 0) >= 30);
              setSelectedPharmacyId(inStockBranch ? inStockBranch.id : data.data[0].id);
            }
          }
        })
        .catch((err) => console.error("Error loading pharmacies with stock:", err))
        .finally(() => setIsLoadingPharmacies(false));
    }
  }, [isOpen, refillItem, selectedPharmacyId]);

  if (!refillItem) return null;

  const totalAmount = (refillItem.medicine.price || 0) * quantity;
  const selectedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);
  const currentStock = selectedPharmacy?.stock ?? 0;
  const isStockSufficient = selectedPharmacy?.stock !== null && currentStock >= quantity;
  const isStockEmpty = currentStock === 0;

  const handleSubmit = async () => {
    if (!selectedPharmacyId) {
      addToast("error", "Silakan pilih cabang apotek");
      return;
    }

    if (!quantity || quantity <= 0) {
      addToast("error", "Kuantitas pesanan refill minimal 1 unit");
      return;
    }

    if (!isStockSufficient) {
      addToast(
        "error",
        `Stok di cabang ${selectedPharmacy?.name} tidak mencukupi (${currentStock} unit tersedia). Silakan pilih cabang lain.`
      );
      return;
    }

    if (deliveryType === "DELIVERY" && !deliveryAddress.trim()) {
      addToast("error", "Silakan masukkan alamat pengiriman");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pharmacyId: selectedPharmacyId,
        deliveryAddress: deliveryType === "DELIVERY" ? deliveryAddress.trim() : null,
        notes: notes.trim() ? `[Jadwal Refill Rutin] ${notes.trim()}` : "[Jadwal Refill Rutin]",
        items: [
          {
            medicineId: refillItem.medicine.id,
            quantity,
          },
        ],
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pesanan refill");
      }

      addToast("success", "Pesanan refill rutin berhasil dibuat!");
      onOpenChange(false);
      router.push("/patient/orders");
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal memesan refill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-white font-bold">
                Refill Obat Rutin
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-xs mt-0.5">
                Pesan ulang obat kronis sesuai jadwal terapi Anda
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Info Obat */}
          <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-700">
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-zinc-900">{refillItem.medicine.name}</p>
                  <p className="text-xs text-zinc-500">Siklus terapi tiap {refillItem.frequencyDays} hari</p>
                </div>
              </div>
              <p className="text-xs font-bold text-emerald-800">
                Rp {refillItem.medicine.price.toLocaleString("id-ID")}/satuan
              </p>
            </div>

            <div className="pt-3 border-t border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-zinc-700">Jumlah Unit / Tablet:</Label>
                {/* Stepper + Input Manual */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-emerald-300 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, (quantity || 1) - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm disabled:opacity-40 transition-colors"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={currentStock > 0 ? currentStock : 999}
                    value={quantity || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) ? 0 : Math.max(1, val));
                    }}
                    className="w-16 h-7 text-center font-bold text-xs p-0 border-none bg-transparent focus-visible:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((quantity || 0) + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Preset Cepat */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span>Pilihan Cepat:</span>
                <div className="flex items-center gap-1.5">
                  {[10, 15, 30, 60, 90].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuantity(qty)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                        quantity === qty
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center text-xs">
              <span className="text-zinc-600 font-medium">Estimasi Biaya ({quantity} unit):</span>
              <span className="text-base font-bold text-emerald-700">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Pilih Cabang dengan Tampilan Real-time Stok */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase text-zinc-600 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                Cabang Apotek Penyiap
              </Label>
              {isLoadingPharmacies && (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Memeriksa stok...
                </span>
              )}
            </div>

            <Select value={selectedPharmacyId} onValueChange={(v) => { if (v) setSelectedPharmacyId(v); }}>
              <SelectTrigger className="w-full bg-white text-xs">
                <SelectValue placeholder="Pilih Cabang Apotek">
                  {selectedPharmacy ? (
                    <div className="flex items-center justify-between w-full pr-2">
                      <span>{selectedPharmacy.name} ({selectedPharmacy.city})</span>
                      <span className="font-bold text-emerald-700 ml-2">
                        [Stok: {selectedPharmacy.stock !== null ? `${selectedPharmacy.stock} Unit` : "Memuat..."}]
                      </span>
                    </div>
                  ) : (
                    "Pilih Cabang Apotek"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pharmacies.map((p) => {
                  const stockVal = p.stock ?? 0;
                  const isAvailable = stockVal >= quantity;
                  return (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="font-semibold">{p.name} ({p.city})</span>
                        <Badge
                          variant="outline"
                          className={
                            stockVal >= 20
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : stockVal > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {stockVal > 0 ? `${stockVal} Unit Tersedia` : "Stok Habis"}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Banner Indikator Stok Cabang Terpilih */}
            {selectedPharmacy && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  isStockEmpty
                    ? "bg-red-50 border-red-200 text-red-800"
                    : !isStockSufficient
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                {isStockEmpty ? (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                ) : !isStockSufficient ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {isStockEmpty
                        ? "Stok Obat Habis di Cabang Ini"
                        : !isStockSufficient
                        ? "Stok Cabang Tidak Mencukupi"
                        : "Stok Obat Tersedia"}
                    </span>
                    <span className="font-bold">
                      {currentStock} Unit Tersedia
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {isStockEmpty
                      ? "Cabang ini tidak memiliki stok obat saat ini. Harap pilih cabang Apotek Alpro lainnya di atas."
                      : !isStockSufficient
                      ? `Kuantitas refill (${quantity} unit) melebihi stok yang tersedia (${currentStock} unit). Kurangi jumlah unit atau pilih cabang lain.`
                      : `Cabang ${selectedPharmacy.name} siap melayani penyiapan ${quantity} unit obat ${refillItem.medicine.name}.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metode Pengambilan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-zinc-600">Metode Pengambilan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`p-3 rounded-lg border text-left flex items-center gap-2 text-xs font-medium transition-all ${
                  deliveryType === "PICKUP"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Store className="h-4 w-4 text-emerald-600" /> Ambil di Cabang
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("DELIVERY")}
                className={`p-3 rounded-lg border text-left flex items-center gap-2 text-xs font-medium transition-all ${
                  deliveryType === "DELIVERY"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Truck className="h-4 w-4 text-emerald-600" /> Antar ke Alamat
              </button>
            </div>
          </div>

          {deliveryType === "DELIVERY" && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Alamat Lengkap Pengiriman</Label>
              <Input
                placeholder="Jalan, No. Rumah, RT/RW, Kota, Kode Pos"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="text-xs bg-white"
                required
              />
            </div>
          )}

          {/* Catatan Tambahan */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-zinc-700">Catatan Khusus (Opsional)</Label>
            <Input
              placeholder="Contoh: Titip di pos security / hubungi via WhatsApp"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs bg-white"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !isStockSufficient || !selectedPharmacyId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isSubmitting ? "Memproses..." : "Konfirmasi Refill"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
