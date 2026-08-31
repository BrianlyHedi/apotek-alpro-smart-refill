import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Shield, Building2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen User - Admin Apotek Alpro",
  description: "Daftar pengguna dan staf Apotek Alpro",
};

const roleBadgeStyles: Record<string, { label: string; className: string }> = {
  PATIENT: { label: "Pasien", className: "bg-emerald-100 text-emerald-800" },
  PHARMACIST: { label: "Apoteker", className: "bg-blue-100 text-blue-800" },
  ADMIN: { label: "Admin", className: "bg-purple-100 text-purple-800" },
};

export default async function AdminUsersPage() {
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== "ADMIN") redirect("/patient");

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { pharmacy: { select: { name: true, city: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Manajemen Pengguna</h1>
        <p className="text-zinc-500">Daftar akun pasien, apoteker cabang, dan administrator.</p>
      </div>

      <div className="divide-y divide-zinc-200 rounded-xl border bg-white shadow-sm overflow-hidden">
        {users.map((u) => {
          const roleInfo = roleBadgeStyles[u.role] || { label: u.role, className: "bg-zinc-100 text-zinc-800" };
          return (
            <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                  {u.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-zinc-900">{u.name}</p>
                  <p className="text-xs text-zinc-500">{u.email} {u.phone ? `· ${u.phone}` : ""}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {u.pharmacy && (
                  <span className="text-xs text-zinc-600 flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded">
                    <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                    {u.pharmacy.name}
                  </span>
                )}
                <Badge className={roleInfo.className}>{roleInfo.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
