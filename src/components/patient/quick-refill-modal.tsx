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
import { RefreshCw, MapPin, Truck, Store, Loader2, CheckCircle2, Pill } from "lucide-react";

interface QuickRefillItem {
  id: string;
  medicine: {
    id: string;
    name: string;
    price: number;
    dosageForm?: string;
  };
  frequencyDays: number;
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
  const [pharmacies, setPharmacies] = useState<{ id: string; name: string; city: string; address: string }[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(30);
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetch("/api/pharmacies")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setPharmacies(data.data);
            if (!selectedPharmacyId && data.data.length > 0) {
              setSelectedPharmacyId(data.data[0].id);
            }
          }
        })
        .catch((err) => console.error("Error loading pharmacies:", err));
    }
  }, [isOpen, selectedPharmacyId]);

  if (!refillItem) return null;

  const totalAmount = (refillItem.medicine.price || 0) * quantity;
  const selectedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);

  const handleSubmit = async () => {
    if (!selectedPharmacyId) {
      addToast("error", "Silakan pilih cabang apotek");
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
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

        <div className="p-6 space-y-4">
          {/* Info Obat */}
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-sm text-zinc-900">{refillItem.medicine.name}</p>
                  <p className="text-xs text-zinc-500">Siklus terapi tiap {refillItem.frequencyDays} hari</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-emerald-800">
                Rp {refillItem.medicine.price.toLocaleString("id-ID")}/satuan
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
              <Label className="text-xs font-medium text-zinc-700">Jumlah Tablet / Satuan:</Label>
              <div className="flex items-center gap-2">
                {[15, 30, 60].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      quantity === qty
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 text-right">
              <span className="text-xs text-zinc-500">Total: </span>
              <span className="text-sm font-bold text-emerald-700">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Pilih Cabang */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-zinc-500">Cabang Apotek</Label>
            <Select value={selectedPharmacyId} onValueChange={(v) => setSelectedPharmacyId(v || "")}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Pilih Cabang Apotek">
                  {selectedPharmacy ? `${selectedPharmacy.name} (${selectedPharmacy.city})` : "Pilih Cabang Apotek"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pharmacies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - {p.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Metode Pengambilan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-zinc-500">Metode Pengambilan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs font-medium ${
                  deliveryType === "PICKUP"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Store className="h-4 w-4" /> Ambil di Cabang
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("DELIVERY")}
                className={`p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs font-medium ${
                  deliveryType === "DELIVERY"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Truck className="h-4 w-4" /> Antar ke Alamat
              </button>
            </div>
          </div>

          {deliveryType === "DELIVERY" && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Alamat Pengiriman</Label>
              <Input
                placeholder="Alamat lengkap penerima..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="text-xs bg-white"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {isSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              {isSubmitting ? "Memproses..." : "Konfirmasi Refill"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
