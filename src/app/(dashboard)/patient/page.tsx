import { prisma } from "@/lib/prisma/client";
import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { PatientDashboardClient } from "@/components/patient/patient-dashboard-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Pasien - Apotek Alpro",
  description: "Kelola resep obat kronis dan jadwal refill otomatis",
};

export default async function PatientDashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) return null;

  // Fetch active prescriptions, refill schedules, dan pesanan aktif secara paralel
  const [activePrescriptions, refillSchedules, recentOrders] = await Promise.all([
    prisma.prescription.findMany({
      where: { 
        userId: profile.id,
        status: { in: ["PENDING", "VERIFIED"] }
      },
      include: {
        orders: { select: { id: true, status: true } },
        items: {
          include: {
            medicine: { select: { id: true, name: true, price: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.refillSchedule.findMany({
      where: { 
        userId: profile.id,
        isActive: true 
      },
      include: { medicine: true },
      orderBy: { nextRefillDate: "asc" },
      take: 3
    }),
    prisma.order.findMany({
      where: {
        userId: profile.id,
        status: { in: ["PENDING", "CONFIRMED", "READY"] }
      },
      include: {
        items: { select: { medicineId: true } },
        pharmacy: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const serializedPrescriptions = activePrescriptions.map((p) => ({
    id: p.id,
    status: p.status,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    orders: p.orders.map((o) => ({ id: o.id, status: o.status })),
    items: p.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      dosageInstruction: i.dosageInstruction,
      medicine: {
        id: i.medicine.id,
        name: i.medicine.name,
        price: Number(i.medicine.price),
        category: i.medicine.category,
      },
    })),
  }));

  const serializedSchedules = refillSchedules.map((s) => {
    const activeOrder = recentOrders.find((o) =>
      o.items.some((item) => item.medicineId === s.medicineId)
    );

    return {
      id: s.id,
      medicineId: s.medicineId,
      frequencyDays: s.frequencyDays,
      nextRefillDate: s.nextRefillDate.toISOString(),
      lastRefillDate: s.lastRefillDate ? s.lastRefillDate.toISOString() : null,
      activeOrder: activeOrder
        ? {
            id: activeOrder.id,
            status: activeOrder.status,
            pharmacyName: activeOrder.pharmacy.name,
          }
        : null,
      medicine: {
        id: s.medicine.id,
        name: s.medicine.name,
        price: Number(s.medicine.price),
        dosageForm: s.medicine.dosageForm,
      },
    };
  });

  return (
    <PatientDashboardClient
      userName={profile.name}
      userAddress={profile.address}
      activePrescriptions={serializedPrescriptions}
      refillSchedules={serializedSchedules}
    />
  );
}
