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
import { 
  ShoppingBag, 
  Building2, 
  MapPin, 
  Truck, 
  Store, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Info
} from "lucide-react";
import type { PrescriptionWithItems } from "@/types/prescription";
import { Badge } from "@/components/ui/badge";

interface PharmacyOption {
  id: string;
  name: string;
  address: string;
  city: string;
  stock?: number | null;
  minStock?: number;
}

interface InteractionData {
  medicineAId: string;
  medicineAName: string;
  medicineBId: string;
  medicineBName: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  description: string;
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
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [interactions, setInteractions] = useState<InteractionData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && prescription) {
      setIsLoadingData(true);
      setIsAcknowledged(false);

      const firstMedId = prescription.items[0]?.medicine.id;
      const pharmacyUrl = firstMedId ? `/api/pharmacies?medicineId=${firstMedId}` : "/api/pharmacies";

      Promise.all([
        fetch(pharmacyUrl).then((res) => res.json()),
        fetch("/api/drug-interactions").then((res) => res.json()),
      ])
        .then(([pharmaciesRes, interactionsRes]) => {
          if (pharmaciesRes.data) {
            setPharmacies(pharmaciesRes.data);
            if (!selectedPharmacyId && pharmaciesRes.data.length > 0) {
              setSelectedPharmacyId(pharmaciesRes.data[0].id);
            }
          }

          if (interactionsRes.data && prescription.items.length > 1) {
            const rxMedIds = new Set(prescription.items.map((i) => i.medicine.id));
            const detected = (interactionsRes.data as InteractionData[]).filter(
              (it) => rxMedIds.has(it.medicineAId) && rxMedIds.has(it.medicineBId)
            );
            setInteractions(detected);
          } else {
            setInteractions([]);
          }
        })
        .catch((err) => console.error("Error loading checkout prerequisites:", err))
        .finally(() => setIsLoadingData(false));
    }
  }, [isOpen, prescription, selectedPharmacyId]);

  if (!prescription) return null;

  // Hitung total harga
  const totalAmount = prescription.items.reduce((sum, item) => {
    return sum + (Number(item.medicine.price) || 0) * item.quantity;
  }, 0);

  const selectedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);
  const hasInteractions = interactions.length > 0;
  const isSubmitDisabled = isSubmitting || !selectedPharmacyId || (hasInteractions && !isAcknowledged);

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

    if (hasInteractions && !isAcknowledged) {
      addToast("error", "Harap centang persetujuan informasi interaksi obat terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        pharmacyId: selectedPharmacyId,
        prescriptionId: prescription.id,
        deliveryAddress: deliveryType === "DELIVERY" ? deliveryAddress.trim() : null,
        notes: deliveryNotes.trim()
          ? `[Tebus Resep ${prescription.id.slice(0, 8)}] ${deliveryNotes.trim()}`
          : `[Tebus Resep ${prescription.id.slice(0, 8)}]`,
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
        throw new Error(data.error || "Gagal membuat pesanan tebus resep");
      }

      addToast("success", "Pesanan tebus resep berhasil dibuat!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
      router.push("/patient/orders");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 text-green-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Tebus Resep Dokter</DialogTitle>
              <DialogDescription>
                Pilih cabang Apotek Alpro terdekat dan metode penyerahan obat Anda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ringkasan Obat Resep */}
          <div className="rounded-lg border bg-zinc-50/70 p-3.5 space-y-2">
            <p className="text-xs font-semibold uppercase text-zinc-500">Rincian Obat Resep</p>
            <div className="space-y-1.5 divide-y divide-zinc-200/60">
              {prescription.items.map((item) => (
                <div key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-900">{item.medicine.name}</span>
                    <p className="text-[11px] text-zinc-500">{item.dosageInstruction}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-zinc-900">{item.quantity} Unit</span>
                    <p className="text-[11px] text-zinc-500">
                      Rp {(Number(item.medicine.price) * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-sm font-bold text-zinc-900">
              <span>Total Estimasi Biaya</span>
              <span className="text-green-700">Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Drug Interaction Alert Warning */}
          {hasInteractions && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Peringatan Interaksi Obat Terdeteksi ({interactions.length})</span>
              </div>
              <div className="space-y-2">
                {interactions.map((it, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-white border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">
                        {it.medicineAName} ↔ {it.medicineBName}
                      </span>
                      <Badge
                        className={
                          it.severity === "SEVERE"
                            ? "bg-red-100 text-red-800"
                            : it.severity === "MODERATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {it.severity}
                      </Badge>
                    </div>
                    <p className="text-zinc-600 text-[11px]">{it.description}</p>
                  </div>
                ))}
              </div>

              {/* Checkbox Acknowledgment */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-xs text-amber-900 font-medium leading-relaxed">
                  Saya telah membaca dan memahami informasi interaksi obat di atas serta akan mengikuti petunjuk minum dari apoteker.
                </span>
              </label>
            </div>
          )}

          {/* Pemilihan Cabang */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-green-600" />
              Pilih Cabang Apotek Penyiap
            </Label>
            {isLoadingData ? (
              <div className="flex items-center justify-center p-3 text-xs text-zinc-400">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Memuat daftar cabang & stok...
              </div>
            ) : (
              <Select value={selectedPharmacyId} onValueChange={(val) => { if (val) setSelectedPharmacyId(val); }}>
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Pilih cabang Apotek Alpro" />
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.map((pharmacy) => (
                    <SelectItem key={pharmacy.id} value={pharmacy.id}>
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="font-semibold">{pharmacy.name} ({pharmacy.city})</span>
                        {pharmacy.stock !== undefined && pharmacy.stock !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            pharmacy.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {pharmacy.stock > 0 ? `${pharmacy.stock} Unit` : "Stok Habis"}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedPharmacy && (
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-zinc-400" />
                  {selectedPharmacy.address}, {selectedPharmacy.city}
                </span>
                {selectedPharmacy.stock !== undefined && selectedPharmacy.stock !== null && (
                  <span className="font-semibold text-emerald-700">
                    Stok Tersedia: {selectedPharmacy.stock} Unit
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Metode Pengambilan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700">Metode Pengambilan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  deliveryType === "PICKUP"
                    ? "border-green-600 bg-green-50/50 text-green-950 ring-1 ring-green-600"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <Store className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Ambil di Cabang</p>
                  <p className="text-[11px] text-zinc-500">Gratis biaya antar</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType("DELIVERY")}
                className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                  deliveryType === "DELIVERY"
                    ? "border-green-600 bg-green-50/50 text-green-950 ring-1 ring-green-600"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <Truck className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Antar ke Alamat</p>
                  <p className="text-[11px] text-zinc-500">Kurir instan apotek</p>
                </div>
              </button>
            </div>
          </div>

          {/* Alamat Pengiriman */}
          {deliveryType === "DELIVERY" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Alamat Lengkap Pengiriman</Label>
              <Textarea
                placeholder="Jalan, Nomor Rumah, RT/RW, Kecamatan, Kota, Kode Pos"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          )}

          {/* Catatan Tambahan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700">Catatan Pengiriman (Opsional)</Label>
            <Input
              placeholder="Contoh: Antar sebelum jam 5 sore / titip di security"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="text-xs"
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Memproses..." : "Konfirmasi & Buat Pesanan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
