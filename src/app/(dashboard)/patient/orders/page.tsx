import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, PackageCheck } from "lucide-react";

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  READY: "Siap diambil",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  READY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function PatientOrdersPage() {
  const user = await getAuthUser();

  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      pharmacy: { select: { name: true, city: true } },
      items: { include: { medicine: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Riwayat Pesanan</h1>
        <p className="text-zinc-500">Lacak pesanan obat Anda.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-white">
          <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-lg font-medium text-zinc-900 mb-1">Belum ada pesanan</h3>
          <p className="text-zinc-500 text-sm">Pesanan obat Anda akan muncul di halaman ini.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div>
                  <CardTitle className="text-base">Pesanan #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">
                    {order.pharmacy.name} · {order.pharmacy.city} · {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <Badge className={statusStyles[order.status]}>{statusLabels[order.status]}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 border-t pt-3">
                  <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-700">
                      {order.items.map((item) => `${item.medicine.name} (${item.quantity})`).join(", ")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-green-700">
                      Total Rp {Number(order.totalAmount).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
