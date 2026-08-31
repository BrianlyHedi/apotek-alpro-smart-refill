import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Upload, PackageSearch, Clock } from "lucide-react";
import Link from "next/link";
import { formatRelativeDay } from "@/lib/utils/format-date";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard Pasien - Apotek Alpro',
  description: 'Kelola resep obat kronis dan jadwal refill otomatis',
};

export default async function PatientDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
  });

  // Fetch pending prescriptions
  const activePrescriptions = await prisma.prescription.findMany({
    where: { 
      userId: user.id,
      status: { in: ["PENDING", "VERIFIED"] }
    },
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  // Fetch refill schedules
  const refillSchedules = await prisma.refillSchedule.findMany({
    where: { 
      userId: user.id,
      isActive: true 
    },
    include: { medicine: true },
    orderBy: { nextRefillDate: "asc" },
    take: 3
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Halo, {profile?.name.split(" ")[0]} 👋
          </h1>
          <p className="text-zinc-500">
            Berikut ringkasan resep dan jadwal refill obat Anda.
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button render={<Link href="/patient/prescriptions" />} nativeButton={false} className="bg-green-600 hover:bg-green-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload Resep
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="col-span-full lg:col-span-1 shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start h-12" render={<Link href="/patient/inventory" />} nativeButton={false}>
              <PackageSearch className="mr-3 h-5 w-5 text-green-600" />
              Cek Stok Obat Cabang
            </Button>
            <Button variant="outline" className="justify-start h-12" render={<Link href="/patient/prescriptions" />} nativeButton={false}>
              <Pill className="mr-3 h-5 w-5 text-green-600" />
              Resep Aktif Saya
            </Button>
            <Button variant="outline" className="justify-start h-12" render={<Link href="/patient/orders" />} nativeButton={false}>
              <Clock className="mr-3 h-5 w-5 text-green-600" />
              Lacak Pesanan
            </Button>
          </CardContent>
        </Card>

        {/* Refill Schedules */}
        <Card className="col-span-full md:col-span-1 shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Jadwal Refill Terdekat</CardTitle>
            <CardDescription>Obat kronis yang perlu diisi ulang</CardDescription>
          </CardHeader>
          <CardContent>
            {refillSchedules.length > 0 ? (
              <div className="space-y-4">
                {refillSchedules.map((schedule) => {
                  const daysStr = formatRelativeDay(schedule.nextRefillDate.toISOString());
                  const isUrgent = daysStr.includes("Hari ini") || daysStr.includes("Besok") || daysStr.includes("H-");
                  
                  return (
                    <div key={schedule.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm text-zinc-900">{schedule.medicine.name}</p>
                        <p className="text-xs text-zinc-500">Tiap {schedule.frequencyDays} hari</p>
                      </div>
                      <div className={`text-right ${isUrgent ? "text-amber-600" : "text-green-600"}`}>
                        <p className="font-semibold text-sm">{daysStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-zinc-500">
                Belum ada jadwal refill aktif.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Prescriptions */}
        <Card className="col-span-full md:col-span-1 shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Resep Diproses</CardTitle>
            <CardDescription>Status verifikasi resep terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            {activePrescriptions.length > 0 ? (
              <div className="space-y-4">
                {activePrescriptions.map((prescription) => (
                  <div key={prescription.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium bg-zinc-100 px-2 py-1 rounded text-zinc-600">
                        {new Date(prescription.createdAt).toLocaleDateString('id-ID')}
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        prescription.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{prescription.items.length} macam obat</p>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{prescription.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-zinc-500">
                Tidak ada resep yang sedang diproses.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
