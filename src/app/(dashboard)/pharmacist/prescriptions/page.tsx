import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifyPrescriptionModal } from "@/components/pharmacist/verify-prescription-modal";
import { formatRelativeDay } from "@/lib/utils/format-date";
import { FileText, Clock, FileCheck } from "lucide-react";
import { PrescriptionWithItems } from "@/types/prescription";
import Image from "next/image";

export default async function PharmacistPrescriptionsPage() {
  const user = await getAuthUser();

  if (!user) return null;

  // Data yang dibutuhkan untuk modal verifikasi
  const [prescriptions, allMedicines, allInteractions] = await Promise.all([
    // Ambil resep pending
    prisma.prescription.findMany({
      where: { status: "PENDING" },
      include: {
        items: {
          include: { medicine: true }
        },
        patient: { select: { id: true, name: true, email: true, phone: true, address: true } }
      },
      orderBy: { createdAt: "asc" }
    }).then((list) =>
      list.map((prescription) => ({
        ...prescription,
        items: prescription.items.map((item) => ({
          ...item,
          medicine: {
            ...item.medicine,
            price: Number(item.medicine.price)
          }
        }))
      }))
    ) as unknown as Promise<PrescriptionWithItems[]>,
    
    // Ambil semua obat untuk dropdown (pilih field yang dibutuhkan saja)
    prisma.medicine.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
      },
      orderBy: { name: "asc" }
    }).then((list) =>
      list.map((m) => ({
        ...m,
        price: Number(m.price)
      }))
    ),

    // Ambil semua interaksi untuk dicek
    prisma.drugInteraction.findMany({
      select: {
        medicineAId: true,
        medicineBId: true,
        severity: true,
        description: true,
        medicineA: { select: { name: true } },
        medicineB: { select: { name: true } },
      }
    }).then((list) =>
      list.map((item) => ({
        medicineAId: item.medicineAId,
        medicineAName: item.medicineA.name,
        medicineBId: item.medicineBId,
        medicineBName: item.medicineB.name,
        severity: item.severity,
        description: item.description,
      }))
    )
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Verifikasi Resep</h1>
        <p className="text-zinc-500">Daftar resep pasien yang menunggu pengecekan Apoteker.</p>
      </div>

      <div className="grid gap-4">
        {prescriptions.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg bg-zinc-50/50">
            <FileCheck className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 mb-1">Semua Selesai!</h3>
            <p className="text-zinc-500 text-sm">Tidak ada resep yang menunggu verifikasi saat ini.</p>
          </div>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-0 flex flex-col sm:flex-row">
                <div className="sm:w-48 h-32 sm:h-auto bg-zinc-100 shrink-0 relative overflow-hidden border-r">
                  {prescription.imageUrl ? (
                    <Image
                      src={prescription.imageUrl}
                      alt="Resep"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400">
                      <FileText className="h-8 w-8 opacity-20" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-zinc-900">{prescription.patient?.name}</h3>
                        <p className="text-sm text-zinc-500">{prescription.patient?.email}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                        PENDING
                      </Badge>
                    </div>
                    {prescription.notes && (
                      <p className="text-sm text-zinc-600 line-clamp-2 mt-2">
                        &ldquo;{prescription.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center text-sm text-zinc-500">
                      <Clock className="mr-1 h-4 w-4" />
                      {formatRelativeDay(prescription.createdAt.toISOString())}
                    </div>
                    <VerifyPrescriptionModal
                      prescription={prescription}
                      allMedicines={allMedicines}
                      allInteractions={allInteractions}
                    >
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Proses Verifikasi
                      </Button>
                    </VerifyPrescriptionModal>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
