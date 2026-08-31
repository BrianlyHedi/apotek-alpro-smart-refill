"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PrescriptionWithItems } from "@/types/prescription";
import { checkDrugInteractions, type DrugInteractionResult } from "@/lib/utils/drug-interaction-checker";
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ZoomIn, 
  Search, 
  Pill, 
  ShieldAlert, 
  Info,
  Loader2
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export interface SimpleMedicine {
  id: string;
  name: string;
  category: string;
  price: number;
  activeIngredients?: string;
  dosageForm?: string;
  manufacturer?: string;
}

interface VerifyModalProps {
  prescription: PrescriptionWithItems;
  allMedicines: SimpleMedicine[];
  allInteractions: DrugInteractionResult[];
  children: React.ReactElement;
}

export function VerifyPrescriptionModal({ prescription, allMedicines, allInteractions, children }: VerifyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<{ medicineId: string; quantity: number; dosageInstruction: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [selectedInteractionDetail, setSelectedInteractionDetail] = useState<DrugInteractionResult | null>(null);

  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (prescription.items && prescription.items.length > 0) {
          setItems(prescription.items.map(i => ({
            medicineId: i.medicine?.id || "",
            quantity: i.quantity,
            dosageInstruction: i.dosageInstruction || ""
          })));
        } else {
          setItems([{ medicineId: "", quantity: 1, dosageInstruction: "3x1 tablet sesudah makan" }]);
        }
        setNotes(prescription.notes || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, prescription.id, prescription.items, prescription.notes]);

  const interactions = useMemo(() => {
    const medicineIds = items.map(i => i.medicineId).filter(Boolean);
    return checkDrugInteractions(medicineIds, allInteractions).interactions;
  }, [items, allInteractions]);

  const handleAddItem = () => {
    setItems([...items, { medicineId: "", quantity: 1, dosageInstruction: "1x1 sehari sesudah makan" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (
    index: number,
    field: "medicineId" | "quantity" | "dosageInstruction",
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const submitVerification = async (status: "VERIFIED" | "REJECTED") => {
    if (status === "VERIFIED" && items.length === 0) {
      addToast("error", "Tambahkan minimal 1 obat untuk verifikasi.");
      return;
    }

    if (status === "VERIFIED" && items.some((i) => !i.medicineId)) {
      addToast("error", "Harap pilih obat untuk semua baris transkripsi.");
      return;
    }

    if (status === "REJECTED" && !notes.trim()) {
      addToast("error", "Catatan alasan penolakan wajib diisi jika resep ditolak.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/prescriptions/${prescription.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes: notes.trim(),
          items: status === "VERIFIED" ? items : []
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan verifikasi");

      addToast("success", `Resep berhasil di-${status === "VERIFIED" ? "setujui" : "tolak"}`);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menyimpan verifikasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={children} />
        <DialogContent className="sm:max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b shrink-0 bg-white">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-xl font-bold text-zinc-900">
                  Telaah & Verifikasi Klinis Resep
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600 flex-wrap">
                  <span>Pasien: <strong className="text-zinc-900">{prescription.patient?.name || "Pasien"}</strong></span>
                  <span>•</span>
                  <span>Email: <strong className="text-zinc-900">{prescription.patient?.email || "-"}</strong></span>
                  {prescription.patient?.phone && (
                    <>
                      <span>•</span>
                      <span>No. Telp: <strong className="text-zinc-900">{prescription.patient.phone}</strong></span>
                    </>
                  )}
                  <span>•</span>
                  <span>Diunggah: {new Date(prescription.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}</span>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Kiri: Foto Resep Fisik dengan Lightbox Zoom */}
            <div className="w-full md:w-1/2 p-5 bg-zinc-900 flex flex-col relative">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Foto Resep Fisik Dokter</span>
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  {isZoomed ? "Kecilkan (Fit)" : "Perbesar (Zoom)"}
                </button>
              </div>

              <div className="flex-1 relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
                {prescription.imageUrl ? (
                  <div className={`w-full h-full relative cursor-pointer ${isZoomed ? "overflow-auto p-4" : ""}`}>
                    <Image
                      src={prescription.imageUrl}
                      alt="Resep Pasien"
                      fill={!isZoomed}
                      width={isZoomed ? 1200 : undefined}
                      height={isZoomed ? 1600 : undefined}
                      unoptimized
                      className={isZoomed ? "max-w-none w-auto" : "object-contain"}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                    Tidak ada lampiran foto resep
                  </div>
                )}
              </div>

              {prescription.notes && (
                <div className="mt-3 p-3 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-zinc-300">
                  <strong className="text-zinc-100">Catatan Pasien:</strong> {prescription.notes}
                </div>
              )}
            </div>

            {/* Kanan: Form Transkripsi & Drug Interaction Checker */}
            <div className="w-full md:w-1/2 p-5 overflow-y-auto flex flex-col bg-white">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 uppercase tracking-wider">
                    Transkripsi Obat ({items.length})
                  </h3>
                  <p className="text-xs text-zinc-500">Ketik nama obat untuk mencari master data 28 SKU.</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddItem} className="text-xs h-8">
                  <Plus className="h-3.5 w-3.5 mr-1 text-green-600" /> Tambah Baris Obat
                </Button>
              </div>

              {/* Drug Interaction Warning Banner */}
              {interactions.length > 0 && (
                <div className="mb-4 p-3.5 rounded-lg border border-amber-300 bg-amber-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      Interaksi Obat Terdeteksi ({interactions.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {interactions.map((it, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-amber-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-zinc-900">
                            {it.medicineAName} ↔ {it.medicineBName}
                          </span>
                          <p className="text-[11px] text-zinc-500 line-clamp-1">{it.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedInteractionDetail(it)}
                          className="text-[11px] text-amber-700 font-semibold hover:underline shrink-0 ml-2"
                        >
                          Detail
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3 flex-1">
                {items.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 border-2 border-dashed rounded-lg text-xs">
                    Belum ada obat yang ditranskripsikan. Klik tombol "Tambah Baris Obat" di atas.
                  </div>
                ) : (
                  items.map((item, idx) => {
                    const selectedMed = allMedicines.find(m => m.id === item.medicineId);
                    const q = searchQueries[idx] ?? (selectedMed?.name || "");
                    const filtered = allMedicines.filter(m =>
                      m.name.toLowerCase().includes(q.toLowerCase()) ||
                      m.category.toLowerCase().includes(q.toLowerCase())
                    );

                    return (
                      <div key={idx} className="p-3.5 border rounded-lg bg-zinc-50/70 relative space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-700">Obat #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Autocomplete Input */}
                        <div className="relative">
                          <Label className="text-xs text-zinc-600">Pilih Obat (Autocomplete Master)</Label>
                          <div className="relative mt-1">
                            <Input
                              placeholder="Ketik nama obat (misal: Metformin, Amlodipine...)"
                              value={q}
                              onFocus={() => setActiveSearchIndex(idx)}
                              onChange={(e) => {
                                setSearchQueries({ ...searchQueries, [idx]: e.target.value });
                                setActiveSearchIndex(idx);
                              }}
                              className="bg-white text-xs pl-8"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                          </div>

                          {activeSearchIndex === idx && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-zinc-100">
                              {filtered.length === 0 ? (
                                <p className="p-3 text-xs text-zinc-400 text-center">Obat tidak ditemukan</p>
                              ) : (
                                filtered.slice(0, 8).map((med) => (
                                  <div
                                    key={med.id}
                                    onClick={() => {
                                      handleItemChange(idx, "medicineId", med.id);
                                      setSearchQueries({ ...searchQueries, [idx]: med.name });
                                      setActiveSearchIndex(null);
                                    }}
                                    className="p-2.5 text-xs hover:bg-green-50 cursor-pointer flex items-center justify-between"
                                  >
                                    <div>
                                      <p className="font-semibold text-zinc-900">{med.name}</p>
                                      <p className="text-[11px] text-zinc-500">{med.dosageForm || "Tablet"} • {med.category}</p>
                                    </div>
                                    <span className="font-bold text-zinc-700">
                                      Rp {Number(med.price).toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Kuantitas & Aturan Pakai */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="col-span-1">
                            <Label className="text-xs text-zinc-600">Jumlah Unit</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                              className="bg-white text-xs mt-1"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label className="text-xs text-zinc-600">Aturan Dosis & Pakai</Label>
                            <Input
                              placeholder="Misal: 3x1 tablet sesudah makan"
                              value={item.dosageInstruction}
                              onChange={(e) => handleItemChange(idx, "dosageInstruction", e.target.value)}
                              className="bg-white text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Catatan Apoteker */}
              <div className="mt-4 pt-3 border-t">
                <Label className="text-xs font-semibold text-zinc-700">
                  Catatan Verifikasi / Alasan Penolakan
                </Label>
                <Textarea
                  placeholder="Berikan catatan petunjuk khusus untuk pasien atau alasan penolakan jika resep tidak valid..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => submitVerification("REJECTED")}
                  className="text-red-700 border-red-200 hover:bg-red-50 text-xs font-semibold"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5 text-red-600" /> Tolak Resep
                </Button>
                <Button
                  disabled={isSubmitting || items.length === 0}
                  onClick={() => submitVerification("VERIFIED")}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Setujui & Verifikasi Resep
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Interaksi Obat */}
      <Dialog open={!!selectedInteractionDetail} onOpenChange={(open) => !open && setSelectedInteractionDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedInteractionDetail && (
            <div className="space-y-3">
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-base font-bold">Detail Interaksi Klinis</DialogTitle>
                  <Badge className="bg-amber-100 text-amber-800">
                    {selectedInteractionDetail.severity}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="p-3 bg-zinc-50 border rounded-lg text-xs space-y-2">
                <p className="font-semibold text-zinc-900">
                  {selectedInteractionDetail.medicineAName} ↔ {selectedInteractionDetail.medicineBName}
                </p>
                <p className="text-zinc-600 leading-relaxed">
                  {selectedInteractionDetail.description}
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedInteractionDetail(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
