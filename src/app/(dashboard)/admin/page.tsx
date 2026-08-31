import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ClipboardList, Pill, Users } from "lucide-react";

export default async function AdminDashboardPage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "ADMIN") redirect("/patient");

  const [users, pharmacies, medicines, orders] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.pharmacy.count({ where: { deletedAt: null } }),
    prisma.medicine.count({ where: { deletedAt: null } }),
    prisma.order.count(),
  ]);

  const metrics = [
    { label: "Pengguna aktif", value: users, icon: Users },
    { label: "Cabang aktif", value: pharmacies, icon: Building2 },
    { label: "SKU obat aktif", value: medicines, icon: Pill },
    { label: "Total pesanan", value: orders, icon: ClipboardList },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard Admin</h1>
        <p className="text-zinc-500">Ringkasan operasional jaringan Apotek Alpro.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500">{label}</CardTitle>
              <Icon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold text-zinc-900">{value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
