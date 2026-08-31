import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { AdminPharmaciesClient } from "@/components/admin/admin-pharmacies-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cabang Apotek - Admin Apotek Alpro",
  description: "Manajemen cabang dan lokasi jaringan Apotek Alpro",
};

export default async function AdminPharmaciesPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== "ADMIN") redirect("/patient");

  const pharmacies = await prisma.pharmacy.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { staff: true, inventory: true, orders: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Jaringan Cabang Apotek</h1>
        <p className="text-zinc-500">Kelola dan pantau seluruh cabang operasional Apotek Alpro.</p>
      </div>

      <AdminPharmaciesClient initialPharmacies={pharmacies} />
    </div>
  );
}
