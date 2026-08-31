"use client";

import { usePrescriptions } from "@/hooks/use-prescriptions";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, FileText, Calendar, AlertCircle, Inbox } from "lucide-react";

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const { prescriptions, isLoading, error } = usePrescriptions(user?.id);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Menunggu Verifikasi</Badge>;
      case "VERIFIED":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Diverifikasi</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
      case "EXPIRED":
        return <Badge className="bg-zinc-100 text-zinc-800 hover:bg-zinc-100">Kadaluarsa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Resep Saya</h1>
          <p className="text-zinc-500">Kelola dan unggah resep dokter Anda.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Unggah Resep Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Unggah Resep Baru</DialogTitle>
              <DialogDescription>
                Foto resep fisik Anda dengan jelas. Pastikan nama dokter, tanggal, dan daftar obat terbaca.
              </DialogDescription>
            </DialogHeader>
            <div className="border-2 border-dashed rounded-lg p-12 text-center mt-4">
              <FileText className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
              <p className="text-sm font-medium text-zinc-900">Klik untuk upload foto</p>
              <p className="text-xs text-zinc-500 mt-1">atau drag & drop file ke sini (JPG/PNG)</p>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Batal</Button>
              <Button disabled className="bg-green-600">Simpan Resep</Button>
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
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-zinc-100 relative overflow-hidden">
                {/* Fallback image */}
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                  <FileText className="h-10 w-10 opacity-20" />
                </div>
                {prescription.imageUrl && (
                  <img 
                    src={prescription.imageUrl} 
                    alt="Resep" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  {getStatusBadge(prescription.status)}
                  <div className="flex items-center text-xs text-zinc-500">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(prescription.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                
                {prescription.notes && (
                  <p className="text-sm font-medium text-zinc-900 line-clamp-2 mb-4">
                    {prescription.notes}
                  </p>
                )}

                <div className="space-y-2 mt-4 pt-4 border-t border-zinc-100">
                  <p className="text-xs font-semibold uppercase text-zinc-500">Daftar Obat</p>
                  {prescription.items.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">Menunggu review apoteker</p>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {prescription.items.map((item, idx) => (
                        <li key={item.id} className="flex justify-between">
                          <span className="text-zinc-700 truncate pr-2">
                            {idx + 1}. {item.medicine.name}
                          </span>
                          <span className="font-medium text-zinc-900">{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
