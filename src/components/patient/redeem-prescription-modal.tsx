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
import { Textarea } from "@/components/ui/textarea";
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
import { ShoppingBag, Building2, MapPin, Truck, Store, Loader2, CheckCircle2 } from "lucide-react";
import type { PrescriptionWithItems } from "@/types/prescription";

interface PharmacyOption {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface RedeemPrescriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: PrescriptionWithItems | null;
  defaultPharmacyId?: string;
  userAddress?: string | null;
  onSuccess?: () => void;
}

export function RedeemPrescriptionModal({
  isOpen,
  onOpenChange,
  prescription,
  defaultPharmacyId,
  userAddress,
  onSuccess,
}: RedeemPrescriptionModalProps) {
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(defaultPharmacyId || "");
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState<string>(userAddress || "");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsLoadingPharmacies(true);
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
        .catch((err) => console.error("Error loading pharmacies:", err))
        .finally(() => setIsLoadingPharmacies(false));
    }
  }, [isOpen, selectedPharmacyId]);

  if (!prescription) return null;

  // Hitung total harga
  const totalAmount = prescription.items.reduce((sum, item) => {
    return sum + (Number(item.medicine.price) || 0) * item.quantity;
  }, 0);

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

    if (prescription.items.length === 0) {
      addToast("error", "Resep tidak memiliki daftar obat untuk ditebus");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pharmacyId: selectedPharmacyId,
        prescriptionId: prescription.id,
        deliveryAddress: deliveryType === "DELIVERY" ? deliveryAddress.trim() : null,
        notes: notes.trim() || undefined,
        items: prescription.items.map((item) => ({
          medicineId: item.medicine.id,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pesanan");
      }

      addToast("success", "Pesanan obat berhasil dibuat! Membuka halaman lacak pesanan...");
      onOpenChange(false);
      if (onSuccess) onSuccess();
      router.push("/patient/orders");
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menebus resep");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-white font-bold">
                Tebus Resep Dokter
              </DialogTitle>
              <DialogDescription className="text-green-100 text-xs mt-0.5">
                Konfirmasi cabang apotek dan metode pengambilan obat Anda
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Daftar Obat dalam Resep */}
          <div>
            <Label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">
              Rincian Obat Resep
            </Label>
            <div className="mt-2 divide-y divide-zinc-100 rounded-lg border bg-zinc-50/50 overflow-hidden">
              {prescription.items.map((item, idx) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {idx + 1}. {item.medicine.name}
                    </p>
                    <p className="text-xs text-zinc-500">{item.dosageInstruction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">
                      {item.quantity} x Rp {Number(item.medicine.price).toLocaleString("id-ID")}
                    </p>
                    <p className="font-semibold text-zinc-900">
                      Rp {(item.quantity * Number(item.medicine.price)).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-green-50 flex items-center justify-between font-bold text-sm">
                <span className="text-zinc-800">Total Tagihan Obat</span>
                <span className="text-green-700 text-base">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Pilih Cabang Apotek */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">
              Pilih Cabang Apotek Alpro
            </Label>
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
            {selectedPharmacy && (
              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                {selectedPharmacy.address}
              </p>
            )}
          </div>

          {/* Metode Pengambilan */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-zinc-500 tracking-wider">
              Metode Pengambilan Obat
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  deliveryType === "PICKUP"
                    ? "border-green-600 bg-green-50/60 ring-2 ring-green-600/20"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <Store className={`h-5 w-5 mt-0.5 ${deliveryType === "PICKUP" ? "text-green-600" : "text-zinc-400"}`} />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Ambil di Cabang</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Ambil langsung saat obat siap</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType("DELIVERY")}
                className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  deliveryType === "DELIVERY"
                    ? "border-green-600 bg-green-50/60 ring-2 ring-green-600/20"
                    : "border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <Truck className={`h-5 w-5 mt-0.5 ${deliveryType === "DELIVERY" ? "text-green-600" : "text-zinc-400"}`} />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Antar ke Alamat</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Kirim ke rumah/kantor</p>
                </div>
              </button>
            </div>
          </div>

          {/* Form Alamat jika opsi Delivery */}
          {deliveryType === "DELIVERY" && (
            <div className="space-y-1.5 animate-in fade-in-50">
              <Label className="text-xs font-semibold text-zinc-700">Alamat Pengiriman Lengkap</Label>
              <Input
                placeholder="Jl. Nama Jalan No. XX, Kelurahan, Kecamatan..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="text-sm bg-white"
              />
            </div>
          )}

          {/* Catatan Tambahan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700">Catatan untuk Apoteker (Opsional)</Label>
            <Input
              placeholder="Contoh: Tolong hubungi sebelum dikirim, obat dikemas terpisah"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-sm bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingPharmacies}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Pesanan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Konfirmasi & Buat Pesanan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
