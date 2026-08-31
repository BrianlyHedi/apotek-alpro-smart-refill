"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, Upload, PackageSearch, Clock, RefreshCw, ShoppingBag, ArrowRight, CheckCircle2, Check } from "lucide-react";
import Link from "next/link";
import { formatRelativeDay } from "@/lib/utils/format-date";
import { QuickRefillModal } from "@/components/patient/quick-refill-modal";
import { RedeemPrescriptionModal } from "@/components/patient/redeem-prescription-modal";
import type { PrescriptionWithItems } from "@/types/prescription";
import type { PrescriptionStatus } from "@/generated/prisma";

interface RefillScheduleData {
  id: string;
  medicineId: string;
  frequencyDays: number;
  nextRefillDate: string;
  lastRefillDate: string | null;
  activeOrder?: {
    id: string;
    status: string;
    pharmacyName: string;
  } | null;
  medicine: {
    id: string;
    name: string;
    price: number;
    dosageForm: string;
  };
}

interface PrescriptionData {
  id: string;
  status: PrescriptionStatus;
  notes: string | null;
  createdAt: string;
  orders?: {
    id: string;
    status: string;
  }[];
  items: {
    id: string;
    quantity: number;
    dosageInstruction: string;
    medicine: {
      id: string;
      name: string;
      price: number;
      category: string;
    };
  }[];
}

const refillOrderStatusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Menunggu Konfirmasi", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Sedang Disiapkan", className: "bg-blue-100 text-blue-800" },
  READY: { label: "Siap Diambil", className: "bg-indigo-100 text-indigo-800" },
};

interface PatientDashboardClientProps {
  userName: string;
  userAddress: string | null;
  activePrescriptions: PrescriptionData[];
  refillSchedules: RefillScheduleData[];
}

export function PatientDashboardClient({
  userName,
  userAddress,
  activePrescriptions,
  refillSchedules,
}: PatientDashboardClientProps) {
  const [selectedRefill, setSelectedRefill] = useState<RefillScheduleData | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithItems | null>(null);

  const handleOpenRedeem = (prescription: PrescriptionData) => {
    const mapped: PrescriptionWithItems = {
      id: prescription.id,
      userId: "",
      imageUrl: null,
      status: prescription.status,
      notes: prescription.notes,
      expiresAt: null,
      createdAt: new Date(prescription.createdAt),
      updatedAt: new Date(prescription.createdAt),
      patient: { id: "", name: userName, email: "" },
      verifiedBy: null,
      orders: prescription.orders,
      items: prescription.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        dosageInstruction: i.dosageInstruction,
        medicine: {
          id: i.medicine.id,
          name: i.medicine.name,
          category: i.medicine.category,
          dosageForm: "",
          manufacturer: "",
          price: i.medicine.price,
        },
      })),
    };
    setSelectedPrescription(mapped);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Halo, {userName.split(" ")[0]} 👋
          </h1>
          <p className="text-zinc-500">
            Berikut ringkasan resep obat kronis dan jadwal refill Anda.
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button render={<Link href="/patient/prescriptions" />} nativeButton={false} className="bg-green-600 hover:bg-green-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload Resep Dokter
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="col-span-full lg:col-span-1 shadow-sm border-zinc-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2.5">
            <Button variant="outline" className="justify-start h-11" render={<Link href="/patient/inventory" />} nativeButton={false}>
              <PackageSearch className="mr-3 h-4 w-4 text-green-600" />
              Cek Stok Obat Cabang
            </Button>
            <Button variant="outline" className="justify-start h-11" render={<Link href="/patient/prescriptions" />} nativeButton={false}>
              <Pill className="mr-3 h-4 w-4 text-green-600" />
              Resep Aktif Saya
            </Button>
            <Button variant="outline" className="justify-start h-11" render={<Link href="/patient/orders" />} nativeButton={false}>
              <Clock className="mr-3 h-4 w-4 text-green-600" />
              Lacak Pesanan
            </Button>
          </CardContent>
        </Card>

        {/* Refill Schedules */}
        <Card className="col-span-full md:col-span-1 shadow-sm border-zinc-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Jadwal Refill Terdekat</CardTitle>
              <CardDescription className="text-xs">Obat rutin yang perlu diisi ulang</CardDescription>
            </div>
            <RefreshCw className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {refillSchedules.length > 0 ? (
              <div className="space-y-3.5">
                {refillSchedules.map((schedule) => {
                  const daysStr = formatRelativeDay(schedule.nextRefillDate);
                  const nextRefillTime = new Date(schedule.nextRefillDate).getTime();
                  const nowTime = Date.now();
                  const diffDays = Math.ceil((nextRefillTime - nowTime) / (1000 * 60 * 60 * 24));
                  const activeOrder = schedule.activeOrder;
                  const orderStatusInfo = activeOrder ? refillOrderStatusMap[activeOrder.status] : null;
                  const isStockSafe = !activeOrder && diffDays > 7;

                  return (
                    <div key={schedule.id} className="p-3 rounded-lg border bg-zinc-50/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-zinc-900">{schedule.medicine.name}</p>
                          <p className="text-xs text-zinc-500">Tiap {schedule.frequencyDays} hari</p>
                        </div>
                        {orderStatusInfo ? (
                          <Badge className={`${orderStatusInfo.className} text-[11px] font-semibold`}>
                            {orderStatusInfo.label}
                          </Badge>
                        ) : isStockSafe ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-700" />
                            Stok Aman ({diffDays} hari lagi)
                          </Badge>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                            {diffDays <= 0 ? "Hari ini (Waktunya Refill)" : `H-${diffDays} (Waktunya Refill)`}
                          </span>
                        )}
                      </div>

                      {activeOrder ? (
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                          <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                            {activeOrder.pharmacyName}
                          </span>
                          <Button
                            size="sm"
                            render={<Link href="/patient/orders" />}
                            nativeButton={false}
                            className="h-7 text-xs bg-zinc-800 hover:bg-zinc-900 text-white px-2.5"
                          >
                            <Clock className="mr-1 h-3 w-3" /> Lacak Pesanan Refill
                          </Button>
                        </div>
                      ) : isStockSafe ? (
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                          <span className="text-[11px] text-zinc-500">
                            {schedule.lastRefillDate
                              ? `Refill: ${new Date(schedule.lastRefillDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                              : `Rp ${Number(schedule.medicine.price).toLocaleString("id-ID")}/satuan`}
                          </span>
                          <Button
                            disabled
                            className="h-7 text-xs bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed px-2.5"
                          >
                            <Check className="mr-1 h-3 w-3 text-emerald-600" /> Stok Masih Cukup
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60">
                          <span className="text-xs text-zinc-500">
                            Rp {Number(schedule.medicine.price).toLocaleString("id-ID")}/satuan
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setSelectedRefill(schedule)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                          >
                            <RefreshCw className="mr-1 h-3 w-3" /> Refill Sekarang
                          </Button>
                        </div>
                      )}
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
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Resep Diproses</CardTitle>
              <CardDescription className="text-xs">Status verifikasi resep terbaru</CardDescription>
            </div>
            <Pill className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {activePrescriptions.length > 0 ? (
              <div className="space-y-3">
                {activePrescriptions.map((prescription) => {
                  const isVerified = prescription.status === "VERIFIED";
                  const hasOrder = prescription.orders && prescription.orders.length > 0;

                  return (
                    <div key={prescription.id} className="rounded-lg border p-3 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                          {new Date(prescription.createdAt).toLocaleDateString("id-ID")}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          hasOrder
                            ? "bg-purple-100 text-purple-800"
                            : prescription.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {hasOrder ? "SUDAH DITEBUS" : prescription.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-900">
                        {prescription.items.length} macam obat
                      </p>
                      {prescription.notes && (
                        <p className="text-xs text-zinc-500 line-clamp-1">{prescription.notes}</p>
                      )}

                      {hasOrder ? (
                        <Button
                          size="sm"
                          render={<Link href="/patient/orders" />}
                          nativeButton={false}
                          className="w-full h-7 text-xs bg-zinc-800 hover:bg-zinc-900 text-white mt-1"
                        >
                          <Clock className="mr-1 h-3 w-3" /> Lacak Pesanan Obat
                        </Button>
                      ) : isVerified && prescription.items.length > 0 ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenRedeem(prescription)}
                          className="w-full h-7 text-xs bg-green-600 hover:bg-green-700 text-white mt-1"
                        >
                          <ShoppingBag className="mr-1 h-3 w-3" /> Tebus Resep Ini
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-zinc-500">
                Tidak ada resep yang sedang diproses.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <QuickRefillModal
        isOpen={!!selectedRefill}
        onOpenChange={(open) => {
          if (!open) setSelectedRefill(null);
        }}
        refillItem={selectedRefill}
      />

      <RedeemPrescriptionModal
        isOpen={!!selectedPrescription}
        onOpenChange={(open) => {
          if (!open) setSelectedPrescription(null);
        }}
        prescription={selectedPrescription}
        userAddress={userAddress}
      />
    </div>
  );
}
