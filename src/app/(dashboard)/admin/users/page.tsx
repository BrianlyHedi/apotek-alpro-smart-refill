import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen User - Admin Apotek Alpro",
  description: "Daftar pengguna dan staf Apotek Alpro",
};

export default async function AdminUsersPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== "ADMIN") redirect("/patient");

  const [users, pharmacies] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { pharmacy: { select: { name: true, city: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pharmacy.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "PATIENT" | "PHARMACIST" | "ADMIN",
    phone: u.phone,
    address: u.address,
    pharmacyId: u.pharmacyId,
    createdAt: u.createdAt.toISOString(),
    pharmacy: u.pharmacy,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Manajemen Pengguna</h1>
        <p className="text-zinc-500">Kelola akun pasien, apoteker cabang, dan administrator.</p>
      </div>

      <AdminUsersClient initialUsers={serializedUsers} pharmacies={pharmacies} />
    </div>
  );
}
