"use client";

import { usePrescriptions } from "@/hooks/use-prescriptions";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { 
  Plus, 
  FileText, 
  Calendar, 
  AlertCircle, 
  Inbox, 
  Loader2, 
  ShoppingBag, 
  Clock, 
  ZoomIn, 
  RefreshCcw, 
  X, 
  Eye, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-provider";
import { RedeemPrescriptionModal } from "@/components/patient/redeem-prescription-modal";
import type { PrescriptionWithItems } from "@/types/prescription";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const { prescriptions, isLoading, error, refetch } = usePrescriptions({ userId: user?.id });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedRedeemPrescription, setSelectedRedeemPrescription] = useState<PrescriptionWithItems | null>(null);
  const [selectedDetailPrescription, setSelectedDetailPrescription] = useState<PrescriptionWithItems | null>(null);
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const router = useRouter();
  const { addToast } = useToast();

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      addToast("error", "Format file tidak didukung. Harap upload foto JPG, PNG, atau WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      addToast("error", `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      addToast("error", "Silakan pilih foto resep terlebih dahulu");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (uploadNotes.trim()) formData.append("notes", uploadNotes.trim());
      const response = await fetch("/api/prescriptions", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal mengunggah resep");
      
      setIsUploadOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadNotes("");
      addToast("success", "Resep berhasil diunggah dan menunggu verifikasi apoteker.");
      await refetch();
      router.refresh();
    } catch (uploadError) {
      addToast("error", uploadError instanceof Error ? uploadError.message : "Gagal mengunggah resep.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenReupload = (rejectedPrescription: PrescriptionWithItems) => {
    setUploadNotes(`Unggah ulang perbaikan resep sebelumnya. Catatan: ${rejectedPrescription.notes || ""}`);
    setIsUploadOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusBadge = (prescription: PrescriptionWithItems) => {
    if (prescription.orders && prescription.orders.length > 0) {
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Sudah Ditebus</Badge>;
    }
    switch (prescription.status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Menunggu Verifikasi</Badge>;
      case "VERIFIED":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Diverifikasi (Siap Ditebus)</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{prescription.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Resep Saya</h1>
          <p className="text-zinc-500">Kelola dan unggah resep dokter Anda.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open);
          if (!open) {
            setSelectedFile(null);
            setPreviewUrl(null);
          }
        }}>
          <DialogTrigger render={<Button className="bg-green-600 hover:bg-green-700" />}>
            <>
              <Plus className="mr-2 h-4 w-4" />
              Unggah Resep Baru
            </>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Unggah Resep Dokter</DialogTitle>
              <DialogDescription>
                Foto resep fisik Anda dengan pencahayaan jelas. Pastikan nama dokter, SIP, tanggal, dan nama obat terbaca.
              </DialogDescription>
            </DialogHeader>

            {previewUrl ? (
              <div className="space-y-3 mt-4">
                <div className="relative h-56 rounded-lg overflow-hidden border bg-zinc-100">
                  <Image
                    src={previewUrl}
                    alt="Preview Resep"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 text-center font-medium">
                  {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
            ) : (
              <label className="block cursor-pointer border-2 border-dashed rounded-lg p-8 text-center mt-4 hover:border-green-500 hover:bg-green-50/40 transition-colors">
                <FileText className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
                <p className="text-sm font-semibold text-zinc-900">Klik untuk memilih foto resep</p>
                <p className="text-xs text-zinc-500 mt-1">Format: JPG, PNG, WEBP (Maksimal 5MB)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
                />
              </label>
            )}

            <Textarea
              className="mt-4"
              placeholder="Catatan tambahan untuk apoteker (opsional, misal: keluhan penyakit, alergi)"
              value={uploadNotes}
              onChange={(event) => setUploadNotes(event.target.value)}
              maxLength={500}
            />

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Batal</Button>
              <Button disabled={!selectedFile || isUploading} onClick={handleUpload} className="bg-green-600 hover:bg-green-700">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploading ? "Mengunggah..." : "Simpan Resep"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-zinc-50/50">
          <Inbox className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-1">Belum ada resep</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Unggah resep dokter Anda untuk mulai berbelanja obat kronis dan mengatur jadwal refill otomatis.
          </p>
          <Button onClick={() => setIsUploadOpen(true)} className="mt-6 bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Unggah Resep
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((prescription) => {
            const hasOrder = prescription.orders && prescription.orders.length > 0;
            const isRejected = prescription.status === "REJECTED";

            return (
              <Card key={prescription.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  onClick={() => setSelectedDetailPrescription(prescription)}
                  className="h-36 bg-zinc-100 relative overflow-hidden cursor-pointer group"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                    <FileText className="h-10 w-10 opacity-20" />
                  </div>
                  {prescription.imageUrl && (
                    <Image
                      src={prescription.imageUrl}
                      alt="Resep"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    <ZoomIn className="h-4 w-4" /> Lihat Detail & Zoom
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    {getStatusBadge(prescription)}
                    <div className="flex items-center text-xs text-zinc-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(prescription.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  
                  {prescription.notes && (
                    <p className="text-sm font-medium text-zinc-900 line-clamp-2 mb-3">
                      {prescription.notes}
                    </p>
                  )}

                  <div className="space-y-2 mt-3 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase text-zinc-500">Daftar Obat</p>
                      <button
                        onClick={() => setSelectedDetailPrescription(prescription)}
                        className="text-[11px] text-green-600 hover:underline flex items-center gap-0.5"
                      >
                        <Eye className="h-3 w-3" /> Detail
                      </button>
                    </div>
                    {prescription.items.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">Menunggu review apoteker</p>
                    ) : (
                      <ul className="text-xs space-y-1">
                        {prescription.items.slice(0, 2).map((item, idx) => (
                          <li key={item.id} className="flex justify-between text-zinc-700">
                            <span className="truncate pr-2">{idx + 1}. {item.medicine.name}</span>
                            <span className="font-medium text-zinc-900">{item.quantity} unit</span>
                          </li>
                        ))}
                        {prescription.items.length > 2 && (
                          <li className="text-[11px] text-zinc-400 font-medium">
                            +{prescription.items.length - 2} obat lainnya...
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Actions */}
                  {hasOrder ? (
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        render={<Link href="/patient/orders" />}
                        nativeButton={false}
                        className="w-full bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold"
                      >
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        Lacak Pesanan Resep Ini
                      </Button>
                    </div>
                  ) : prescription.status === "VERIFIED" && prescription.items.length > 0 ? (
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        onClick={() => setSelectedRedeemPrescription(prescription)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                      >
                        <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                        Tebus Resep / Pesan Sekarang
                      </Button>
                    </div>
                  ) : isRejected ? (
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleOpenReupload(prescription)}
                        className="w-full border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold"
                      >
                        <RefreshCcw className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                        Unggah Ulang Resep
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Detail & Zoom Resep */}
      <Dialog open={!!selectedDetailPrescription} onOpenChange={(open) => {
        if (!open) {
          setSelectedDetailPrescription(null);
          setIsZoomed(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDetailPrescription && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-lg">Detail Resep Dokter</DialogTitle>
                  {getStatusBadge(selectedDetailPrescription)}
                </div>
                <DialogDescription>
                  Diupload pada {new Date(selectedDetailPrescription.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              {/* Photo Lightbox */}
              {selectedDetailPrescription.imageUrl && (
                <div className="relative rounded-lg overflow-hidden border bg-zinc-900">
                  <div 
                    onClick={() => setIsZoomed(!isZoomed)} 
                    className={`relative cursor-pointer transition-all duration-300 ${
                      isZoomed ? "h-[500px]" : "h-72"
                    }`}
                  >
                    <Image
                      src={selectedDetailPrescription.imageUrl}
                      alt="Resep Lengkap"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    {isZoomed ? "Perkecil Tampilan" : "Perbesar Foto (Zoom)"}
                  </button>
                </div>
              )}

              {/* Notes */}
              {selectedDetailPrescription.notes && (
                <div className="p-3 bg-zinc-50 border rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-zinc-700">Catatan / Alasan Verifikasi:</p>
                  <p className="text-zinc-600">{selectedDetailPrescription.notes}</p>
                </div>
              )}

              {/* Transcribed Medicines */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-zinc-500 mb-2">
                  Daftar Obat Transkripsi Apoteker ({selectedDetailPrescription.items.length})
                </h4>
                {selectedDetailPrescription.items.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic p-4 border border-dashed rounded-lg text-center">
                    Resep ini masih dalam antrean telaah dan transkripsi oleh tim Apoteker Alpro.
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y divide-zinc-200">
                    {selectedDetailPrescription.items.map((item, idx) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {idx + 1}. {item.medicine.name}
                          </p>
                          <p className="text-zinc-500">
                            Aturan Pakai: <strong>{item.dosageInstruction}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-zinc-900">{item.quantity} Unit</p>
                          <p className="text-zinc-500">
                            Rp {Number(item.medicine.price).toLocaleString("id-ID")}/satuan
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer action */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setSelectedDetailPrescription(null)}>
                  Tutup
                </Button>
                {selectedDetailPrescription.status === "VERIFIED" && selectedDetailPrescription.items.length > 0 && !selectedDetailPrescription.orders?.length && (
                  <Button
                    onClick={() => {
                      const rx = selectedDetailPrescription;
                      setSelectedDetailPrescription(null);
                      setSelectedRedeemPrescription(rx);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <ShoppingBag className="mr-1.5 h-4 w-4" /> Tebus Resep Sekarang
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Tebus Resep */}
      <RedeemPrescriptionModal
        isOpen={!!selectedRedeemPrescription}
        onOpenChange={(open) => {
          if (!open) setSelectedRedeemPrescription(null);
        }}
        prescription={selectedRedeemPrescription}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
