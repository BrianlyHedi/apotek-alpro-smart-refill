"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { ShoppingCart, CheckCircle2, Clock, PackageCheck, AlertCircle, RefreshCw, User, Phone, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export interface PharmacistOrder {
  id: string;
  status: "PENDING" | "CONFIRMED" | "READY" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  items: {
    id: string;
    quantity: number;
    priceAtPurchase: number;
    medicine: {
      id: string;
      name: string;
      category: string;
      price: number;
    };
  }[];
  pharmacy: {
    name: string;
    city: string;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Dikonfirmasi / Disiapkan",
  READY: "Siap Diambil",
  DELIVERED: "Selesai (Diambil)",
  CANCELLED: "Dibatalkan",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  READY: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export function PharmacistOrdersList({ initialOrders }: { initialOrders: PharmacistOrder[] }) {
  const [orders, setOrders] = useState<PharmacistOrder[]>(initialOrders);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const handleUpdateStatus = async (orderId: string, newStatus: PharmacistOrder["status"]) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal memperbarui status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      addToast("success", `Status pesanan berhasil diubah menjadi "${statusLabels[newStatus]}".`);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal memperbarui pesanan");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "ALL") return true;
    return o.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          { key: "ALL", label: `Semua (${orders.length})` },
          { key: "PENDING", label: `Menunggu (${orders.filter((o) => o.status === "PENDING").length})` },
          { key: "CONFIRMED", label: `Disiapkan (${orders.filter((o) => o.status === "CONFIRMED").length})` },
          { key: "READY", label: `Siap (${orders.filter((o) => o.status === "READY").length})` },
          { key: "DELIVERED", label: `Selesai (${orders.filter((o) => o.status === "DELIVERED").length})` },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
            className={activeFilter === tab.key ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-zinc-50/50">
          <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 mb-1">Tidak Ada Pesanan</h3>
          <p className="text-sm text-zinc-500">Tidak ada pesanan dengan filter status ini saat ini.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 bg-zinc-50/60 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold text-zinc-900">
                      Pesanan #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <Badge className={statusStyles[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Dibuat: {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-zinc-500 font-medium">Total Tagihan</p>
                  <p className="text-base font-bold text-green-700">
                    Rp {order.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Patient Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-zinc-900">{order.user.name}</span>
                    <span className="text-xs text-zinc-500">({order.user.email})</span>
                  </div>
                  {order.user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-700">{order.user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Daftar Obat Pesanan:
                  </h4>
                  <div className="divide-y divide-zinc-100 border rounded-lg bg-white overflow-hidden">
                    {order.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-zinc-900">{item.medicine.name}</p>
                          <p className="text-xs text-zinc-500">{item.medicine.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-600">{item.quantity} x Rp {item.priceAtPurchase.toLocaleString("id-ID")}</p>
                          <p className="font-semibold text-zinc-900">
                            Rp {(item.quantity * item.priceAtPurchase).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes if any */}
                {order.notes && (
                  <div className="text-xs text-zinc-600 p-2.5 bg-amber-50 rounded border border-amber-200">
                    <strong>Catatan:</strong> {order.notes}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
                  {order.status === "PENDING" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                    >
                      <Clock className="mr-1.5 h-4 w-4" /> Konfirmasi & Siapkan Obat
                    </Button>
                  )}

                  {order.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, "READY")}
                    >
                      <PackageCheck className="mr-1.5 h-4 w-4" /> Tandai Siap Diambil
                    </Button>
                  )}

                  {order.status === "READY" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Serahkan ke Pasien (Selesai)
                    </Button>
                  )}

                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 border-red-200"
                      disabled={updatingId === order.id}
                      onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                    >
                      Batalkan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
