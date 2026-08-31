import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  AlertCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Disiapkan Apotek",
  READY: "Siap Diambil",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  READY: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

const orderSteps = [
  { key: "PENDING", label: "Menunggu" },
  { key: "CONFIRMED", label: "Disiapkan" },
  { key: "READY", label: "Siap Diambil" },
  { key: "DELIVERED", label: "Selesai" },
];

function getStepIndex(status: string) {
  switch (status) {
    case "PENDING":
      return 0;
    case "CONFIRMED":
      return 1;
    case "READY":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
}

export default async function PatientOrdersPage() {
  const user = await getAuthUser();

  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      pharmacy: { select: { name: true, city: true, address: true, phone: true } },
      items: { 
        include: { 
          medicine: { select: { name: true, category: true } } 
        } 
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Lacak & Riwayat Pesanan</h1>
        <p className="text-zinc-500">Pantau status penyiapan dan serah terima obat Anda secara langsung.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white p-8">
          <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">Belum Ada Pesanan Obat</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
            Pesanan Anda akan muncul di sini setelah resep diverifikasi oleh apoteker atau melalui jadwal refill otomatis.
          </p>
          <div className="flex justify-center gap-3">
            <Button render={<Link href="/patient/prescriptions" />} nativeButton={false} className="bg-green-600 hover:bg-green-700">
              Unggah Resep Dokter
            </Button>
            <Button variant="outline" render={<Link href="/patient/inventory" />} nativeButton={false}>
              Cek Stok Obat Cabang
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status === "CANCELLED";

            return (
              <Card key={order.id} className="overflow-hidden shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/70 border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold text-zinc-900">
                        Pesanan #{order.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <Badge className={statusStyles[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Waktu Pemesanan: {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-zinc-500 font-medium">Total Pembayaran</p>
                    <p className="text-lg font-bold text-green-700">
                      Rp {Number(order.totalAmount).toLocaleString("id-ID")}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Status Progress Stepper */}
                  {!isCancelled ? (
                    <div className="py-2">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                        Progress Status Pesanan:
                      </p>
                      <div className="grid grid-cols-4 relative">
                        {/* Connecting line */}
                        <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-zinc-200 -z-0" />
                        <div 
                          className="absolute top-4 left-[12.5%] h-0.5 bg-green-600 transition-all duration-500 -z-0"
                          style={{
                            width: currentStepIdx === 0 ? "0%" : `${(currentStepIdx / (orderSteps.length - 1)) * 75}%`
                          }}
                        />

                        {orderSteps.map((step, idx) => {
                          const isCompleted = idx < currentStepIdx;
                          const isCurrent = idx === currentStepIdx;

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                  isCompleted
                                    ? "bg-green-600 text-white"
                                    : isCurrent
                                    ? "bg-green-600 text-white ring-4 ring-green-100"
                                    : "bg-zinc-200 text-zinc-500"
                                }`}
                              >
                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                              </div>
                              <span
                                className={`mt-2 text-xs font-medium ${
                                  isCurrent ? "text-green-700 font-semibold" : isCompleted ? "text-zinc-900" : "text-zinc-400"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                      <XCircle className="h-4 w-4 shrink-0" />
                      Pesanan ini telah dibatalkan. Silakan hubungi CS jika butuh bantuan lebih lanjut.
                    </div>
                  )}

                  {/* Branch & Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4 bg-zinc-50/60 rounded-xl border border-zinc-100">
                    <div className="flex items-start gap-2.5">
                      <Building2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-zinc-900 text-xs uppercase tracking-wider">Cabang Apotek</p>
                        <p className="font-medium text-zinc-900 mt-0.5">{order.pharmacy.name}</p>
                        <p className="text-xs text-zinc-500">{order.pharmacy.address}, {order.pharmacy.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-zinc-900 text-xs uppercase tracking-wider">Metode Pengambilan / Alamat</p>
                        <p className="font-medium text-zinc-900 mt-0.5">
                          {order.deliveryAddress ? order.deliveryAddress : "Ambil Langsung di Cabang"}
                        </p>
                        {order.notes && <p className="text-xs text-zinc-500 mt-0.5">Catatan: {order.notes}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Item List */}
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                      Rincian Obat:
                    </h4>
                    <div className="divide-y divide-zinc-100 border rounded-lg overflow-hidden bg-white">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <PackageCheck className="h-4 w-4 text-green-600 shrink-0" />
                            <div>
                              <p className="font-medium text-zinc-900">{item.medicine.name}</p>
                              <p className="text-xs text-zinc-500">{item.medicine.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded font-medium text-zinc-700">
                              {item.quantity} Unit
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
