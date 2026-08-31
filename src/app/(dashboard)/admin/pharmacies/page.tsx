import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, CheckCircle2 } from "lucide-react";
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
        <p className="text-zinc-500">Daftar cabang aktif dan operasional Apotek Alpro.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pharmacies.map((pharmacy) => (
          <Card key={pharmacy.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg text-green-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900">{pharmacy.name}</CardTitle>
                  <p className="text-xs text-zinc-500">{pharmacy.city}</p>
                </div>
              </div>
              <Badge className={pharmacy.isActive ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}>
                {pharmacy.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-sm">
              <div className="flex items-start gap-2 text-zinc-600">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
                <span className="text-xs">{pharmacy.address}</span>
              </div>
              {pharmacy.phone && (
                <div className="flex items-center gap-2 text-zinc-600">
                  <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="text-xs">{pharmacy.phone}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center text-xs">
                <div className="p-1.5 bg-zinc-50 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.staff}</p>
                  <p className="text-[10px] text-zinc-500">Staf</p>
                </div>
                <div className="p-1.5 bg-zinc-50 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.inventory}</p>
                  <p className="text-[10px] text-zinc-500">Stok Obat</p>
                </div>
                <div className="p-1.5 bg-zinc-50 rounded">
                  <p className="font-bold text-zinc-900">{pharmacy._count.orders}</p>
                  <p className="text-[10px] text-zinc-500">Pesanan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
