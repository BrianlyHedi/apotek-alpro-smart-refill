"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrescriptionWithItems } from "@/types/prescription";
import { checkDrugInteractions, type DrugInteractionResult } from "@/lib/utils/drug-interaction-checker";
import { AlertTriangle, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

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
  const [interactions, setInteractions] = useState<DrugInteractionResult[]>([]);
  const { addToast } = useToast();
  const router = useRouter();

  // Load existing items if any
  useEffect(() => {
    if (isOpen) {
      if (prescription.items && prescription.items.length > 0) {
        setItems(prescription.items.map(i => ({
          medicineId: i.medicine?.id || (i as any).medicineId || "",
          quantity: i.quantity,
          dosageInstruction: i.dosageInstruction || ""
        })));
      } else {
        setItems([]);
      }
      setNotes(prescription.notes || "");
    }
  }, [isOpen, prescription]);

  // Check interactions whenever items change
  useEffect(() => {
    const medicineIds = items.map(i => i.medicineId).filter(Boolean);
    const foundInteractions = checkDrugInteractions(medicineIds, allInteractions);
    setInteractions(foundInteractions.interactions);
  }, [items, allInteractions]);

  const handleAddItem = () => {
    setItems([...items, { medicineId: "", quantity: 1, dosageInstruction: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const submitVerification = async (status: "VERIFIED" | "REJECTED") => {
    // Validasi dasar
    if (status === "VERIFIED" && items.length === 0) {
      addToast("error", "Tambahkan minimal 1 obat untuk verifikasi.");
      return;
    }

    if (status === "REJECTED" && !notes) {
      addToast("error", "Catatan wajib diisi jika resep ditolak.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/prescriptions/${prescription.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          items: status === "VERIFIED" ? items : []
        })
      });

      if (!res.ok) throw new Error("Gagal menyimpan verifikasi");

      addToast("success", `Resep berhasil di-${status.toLowerCase()}`);
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      addToast("error", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={children} />
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>Verifikasi Resep</DialogTitle>
          <DialogDescription>
            Periksa foto resep pasien dan transkripsi ke dalam daftar obat sistem.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Kiri: Foto Resep */}
          <div className="w-full md:w-1/2 p-6 bg-zinc-100 flex flex-col">
            <h3 className="font-semibold text-sm text-zinc-500 mb-2 uppercase tracking-wider">Lampiran Resep</h3>
            <div className="flex-1 relative rounded-lg overflow-hidden border border-zinc-200 bg-white">
              {prescription.imageUrl ? (
                <img 
                  src={prescription.imageUrl} 
                  alt="Resep Pasien" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  Tidak ada foto terlampir
                </div>
              )}
            </div>
            {prescription.notes && (
              <div className="mt-4 p-3 bg-white rounded-md border text-sm text-zinc-600">
                <strong>Catatan Pasien:</strong> {prescription.notes}
              </div>
            )}
          </div>

          {/* Kanan: Form Transkripsi */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col border-l">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider">Daftar Obat (Transkripsi)</h3>
              <Button size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Tambah Obat
              </Button>
            </div>

            <div className="space-y-4 flex-1">
              {items.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 border-2 border-dashed rounded-lg">
                  Belum ada obat yang ditambahkan.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-lg bg-zinc-50 relative group">
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-red-600 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Pilih Obat</Label>
                        <Select 
                          value={item.medicineId} 
                          onValueChange={(val) => handleItemChange(idx, "medicineId", val)}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih obat dari database" />
                          </SelectTrigger>
                          <SelectContent>
                            {allMedicines.map(med => (
                              <SelectItem key={med.id} value={med.id}>
                                {med.name} ({med.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="w-1/3 grid gap-2">
                          <Label>Kuantitas</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            className="bg-white"
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="w-2/3 grid gap-2">
                          <Label>Instruksi / Dosis</Label>
                          <Input 
                            placeholder="Contoh: 3x1 Sesudah makan" 
                            className="bg-white"
                            value={item.dosageInstruction} 
                            onChange={(e) => handleItemChange(idx, "dosageInstruction", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Peringatan Interaksi Obat */}
              {interactions.length > 0 && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    Peringatan Interaksi Obat ({interactions.length})
                  </div>
                  <ul className="space-y-3 text-sm text-red-700">
                    {interactions.map((interaction, i) => (
                      <li key={i} className="flex flex-col gap-1">
                        <div className="font-medium">
                          {interaction.medicineAName} & {interaction.medicineBName} 
                          <span className="ml-2 text-xs bg-red-200 px-1.5 py-0.5 rounded font-bold">{interaction.severity}</span>
                        </div>
                        <div>{interaction.description}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-6 space-y-2">
                <Label>Catatan Apoteker (opsional/wajib jika tolak)</Label>
                <Textarea 
                  placeholder="Beri catatan untuk pasien..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 shrink-0 border-t bg-zinc-50 flex justify-end gap-3">
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={isSubmitting}
            onClick={() => submitVerification("REJECTED")}
          >
            <XCircle className="h-4 w-4 mr-2" /> Tolak Resep
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            disabled={isSubmitting || (items.length > 0 && items.some(i => !i.medicineId || !i.dosageInstruction))}
            onClick={() => submitVerification("VERIFIED")}
          >
            <CheckCircle className="h-4 w-4 mr-2" /> 
            {interactions.length > 0 ? "Approve (Abaikan Warning)" : "Verifikasi Resep"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
