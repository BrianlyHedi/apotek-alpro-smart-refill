import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, PackageSearch } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard Apoteker - Apotek Alpro',
  description: 'Verifikasi resep dan manajemen stok cabang',
};

export default async function PharmacistDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { pharmacy: true }
  });

  if (!profile || profile.role !== "PHARMACIST" || !profile.pharmacyId) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Akses Ditolak</h2>
        <p className="text-zinc-500">Halaman ini khusus untuk Apoteker yang ditugaskan di cabang.</p>
      </div>
    );
  }

  // Ambil metrik untuk dashboard
  const [pendingPrescriptions, todayPrescriptions, lowStockItems] = await Promise.all([
    // Resep pending (global atau per cabang, tergantung bisnis rule. Anggap global untuk diverifikasi siapa saja)
    prisma.prescription.count({
      where: { status: "PENDING" }
    }),
    // Resep diverifikasi hari ini
    prisma.prescription.count({
      where: {
        status: "VERIFIED",
        updatedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    }),
    // Stok menipis di cabang apoteker ini
    prisma.inventory.count({
      where: {
        pharmacyId: profile.pharmacyId,
        quantity: {
          lte: prisma.inventory.fields.minStock
        }
      }
    })
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Dashboard Apoteker
        </h1>
        <p className="text-zinc-500">
          Selamat bekerja, {profile.name}. Anda ditugaskan di <span className="font-semibold text-green-700">{profile.pharmacy?.name}</span>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Metric Cards */}
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Resep Menunggu Verifikasi
            </CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{pendingPrescriptions}</div>
            <p className="text-xs text-zinc-500 mt-1">Butuh tindakan segera</p>
            <Button asChild variant="link" className="px-0 mt-2 text-green-600 h-auto">
              <Link href="/pharmacist/prescriptions">Lihat antrean →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Resep Diverifikasi (Hari Ini)
            </CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{todayPrescriptions}</div>
            <p className="text-xs text-zinc-500 mt-1">Total resep selesai hari ini</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Stok Menipis (Cabang Ini)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{lowStockItems}</div>
            <p className="text-xs text-zinc-500 mt-1">SKU yang perlu direstock</p>
            <Button asChild variant="link" className="px-0 mt-2 text-green-600 h-auto">
              <Link href="/pharmacist/inventory">Manajemen Stok →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Tugas Prioritas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 p-3 rounded-md border border-amber-100">
                <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Verifikasi Resep Baru</h4>
                  <p className="text-sm text-amber-700">Ada {pendingPrescriptions} resep pasien yang baru diunggah dan menunggu pengecekan.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-red-50 p-3 rounded-md border border-red-100">
                <PackageSearch className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900">Peringatan Stok Rendah</h4>
                  <p className="text-sm text-red-700">{lowStockItems} macam obat di cabang {profile.pharmacy?.name.replace("Apotek Alpro ", "")} hampir habis. Segera lakukan penyesuaian stok.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
