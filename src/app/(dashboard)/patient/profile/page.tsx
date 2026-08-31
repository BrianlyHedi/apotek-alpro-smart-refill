import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { PatientProfileClient } from "@/components/patient/patient-profile-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil & Akun Pasien - Apotek Alpro",
  description: "Kelola data diri, alamat pengiriman, dan keamanan akun pasien",
};

export default async function PatientProfilePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  const [totalPrescriptions, totalOrders, activeRefills] = await Promise.all([
    prisma.prescription.count({ where: { userId: profile.id } }),
    prisma.order.count({ where: { userId: profile.id } }),
    prisma.refillSchedule.count({ where: { userId: profile.id, isActive: true } }),
  ]);

  return (
    <PatientProfileClient
      user={{
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        role: profile.role,
        createdAt: profile.createdAt.toISOString(),
      }}
      stats={{
        totalPrescriptions,
        totalOrders,
        activeRefills,
      }}
    />
  );
}
