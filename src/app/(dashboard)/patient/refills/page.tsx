import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { PatientRefillsClient } from "@/components/patient/patient-refills-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Refill Obat - Apotek Alpro",
  description: "Kelola jadwal refill obat kronis otomatis dan jeda jadwal terapi",
};

export default async function PatientRefillsPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const [refillSchedules, medicines] = await Promise.all([
    prisma.refillSchedule.findMany({
      where: { userId: profile.id },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            dosageForm: true,
            manufacturer: true,
          },
        },
      },
      orderBy: { nextRefillDate: "asc" },
    }),
    prisma.medicine.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        dosageForm: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedSchedules = refillSchedules.map((s) => ({
    id: s.id,
    userId: s.userId,
    medicineId: s.medicineId,
    frequencyDays: s.frequencyDays,
    lastRefillDate: s.lastRefillDate ? s.lastRefillDate.toISOString() : null,
    nextRefillDate: s.nextRefillDate.toISOString(),
    isActive: s.isActive,
    medicine: {
      ...s.medicine,
      price: Number(s.medicine.price),
    },
  }));

  const serializedMedicines = medicines.map((m) => ({
    ...m,
    price: Number(m.price),
  }));

  return (
    <PatientRefillsClient
      initialSchedules={serializedSchedules}
      availableMedicines={serializedMedicines}
    />
  );
}
