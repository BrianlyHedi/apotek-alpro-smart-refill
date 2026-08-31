"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/providers/toast-provider";
import { 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  PackageCheck, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Phone, 
  MapPin, 
  Printer, 
  Search, 
  FileText, 
  Building2,
  Check,
  Send,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateTime, formatDateFull } from "@/lib/utils/format-date";

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
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PICKUP" | "DELIVERY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<PharmacistOrder | null>(null);

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
      addToast("success", `Status pesanan #${orderId.slice(0, 8).toUpperCase()} berhasil diubah menjadi "${statusLabels[newStatus]}".`);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal memperbarui pesanan");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeFilter === "ALL" || o.status === activeFilter;
    const isDelivery = Boolean(o.deliveryAddress);
    const matchesType =
      typeFilter === "ALL" ||
      (typeFilter === "DELIVERY" && isDelivery) ||
      (typeFilter === "PICKUP" && !isDelivery);

    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-lg border">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari ID pesanan, nama pasien..."
            className="pl-9 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
            {[
              { key: "ALL", label: `Semua (${orders.length})` },
              { key: "PENDING", label: `Menunggu (${orders.filter((o) => o.status === "PENDING").length})` },
              { key: "CONFIRMED", label: "Disiapkan" },
              { key: "READY", label: "Siap Diambil" },
              { key: "DELIVERED", label: "Selesai" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-2.5 py-1 rounded transition-all ${
                  activeFilter === f.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === "ALL" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
              }`}
            >
              Semua Tipe
            </button>
            <button
              onClick={() => setTypeFilter("PICKUP")}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === "PICKUP" ? "bg-white text-emerald-700 shadow-sm" : "text-zinc-600"
              }`}
            >
              Ambil Cabang
            </button>
            <button
              onClick={() => setTypeFilter("DELIVERY")}
              className={`px-2.5 py-1 rounded transition-all ${
                typeFilter === "DELIVERY" ? "bg-white text-blue-700 shadow-sm" : "text-zinc-600"
              }`}
            >
              Delivery
            </button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <ShoppingCart className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-zinc-900">Tidak ada pesanan</h3>
            <p className="text-sm text-zinc-500 mt-1">
              Tidak ada pesanan yang sesuai dengan filter yang dipilih saat ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const isDelivery = Boolean(order.deliveryAddress);
            const isUpdating = updatingId === order.id;

            return (
              <Card key={order.id} className="overflow-hidden border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="bg-zinc-50/70 border-b pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-bold text-zinc-900">
                      Pesanan #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <Badge className={statusStyles[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {isDelivery ? "🚚 Antar Delivery" : "🏪 Ambil di Cabang"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {formatDateTime(order.createdAt)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="h-7 text-xs"
                    >
                      <Printer className="mr-1 h-3 w-3 text-zinc-600" /> Cetak Struk
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  {/* Customer and Delivery Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-zinc-50/60 p-3.5 rounded-lg border border-zinc-100">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-green-600" /> Informasi Pasien
                      </p>
                      <p className="font-bold text-zinc-900 text-sm">{order.user.name}</p>
                      <p className="text-zinc-600">{order.user.email}</p>
                      {order.user.phone && (
                        <p className="text-zinc-600 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-zinc-400" /> {order.user.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-green-600" /> Alamat / Catatan Penyerahan
                      </p>
                      <p className="font-medium text-zinc-900">
                        {order.deliveryAddress ? order.deliveryAddress : `Ambil di ${order.pharmacy.name}`}
                      </p>
                      {order.notes && (
                        <p className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1 font-medium">
                          Catatan: {order.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-zinc-500">Rincian Obat ({order.items.length})</p>
                    <div className="border rounded-lg divide-y divide-zinc-100 bg-white">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <PackageCheck className="h-4 w-4 text-green-600 shrink-0" />
                            <div>
                              <p className="font-semibold text-zinc-900">{item.medicine.name}</p>
                              <p className="text-[11px] text-zinc-500">{item.medicine.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-zinc-900">{item.quantity} Unit</span>
                            <p className="text-[11px] text-zinc-500">
                              Rp {(Number(item.priceAtPurchase) * item.quantity).toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-zinc-500 font-medium">Total Tagihan:</span>
                      <span className="text-base font-bold text-green-700">
                        Rp {Number(order.totalAmount).toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                        >
                          {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="mr-1.5 h-3.5 w-3.5" />}
                          Konfirmasi & Siapkan Obat
                        </Button>
                      )}

                      {order.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.id, "READY")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
                        >
                          {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Clock className="mr-1.5 h-3.5 w-3.5" />}
                          Tandai Siap Diambil / Diantar
                        </Button>
                      )}

                      {order.status === "READY" && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm"
                        >
                          {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                          Serahkan ke Pasien (Selesai)
                        </Button>
                      )}

                      {order.status === "DELIVERED" && (
                        <span className="text-xs text-green-700 font-semibold flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded border border-green-200">
                          <Check className="h-3.5 w-3.5" /> Pesanan Selesai Diserahkan
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Cetak Struk / Invoice Preview */}
      <Dialog open={!!selectedInvoiceOrder} onOpenChange={(open) => !open && setSelectedInvoiceOrder(null)}>
        <DialogContent className="sm:max-w-md print:p-0 print:border-none print:shadow-none">
          {selectedInvoiceOrder && (
            <div id="receipt-print-area" className="space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-dashed border-zinc-300">
                <h3 className="font-bold text-sm text-zinc-900 uppercase">APOTEK ALPRO</h3>
                <p className="text-zinc-500">{selectedInvoiceOrder.pharmacy.name} — {selectedInvoiceOrder.pharmacy.city}</p>
                <p className="text-[11px] text-zinc-400 mt-1">Struk Bukti Penyerahan Obat</p>
              </div>

              <div className="space-y-1 text-zinc-600">
                <div className="flex justify-between">
                  <span>No. Order:</span>
                  <span className="font-bold text-zinc-900">#{selectedInvoiceOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatDateTime(selectedInvoiceOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pasien:</span>
                  <span className="font-semibold text-zinc-900">{selectedInvoiceOrder.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span>{selectedInvoiceOrder.deliveryAddress ? "Delivery" : "Ambil di Cabang"}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-zinc-300 space-y-1.5">
                <p className="font-bold text-zinc-700 uppercase">Rincian Obat:</p>
                {selectedInvoiceOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-zinc-800">
                    <div>
                      <p className="font-medium">{item.medicine.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {item.quantity} × Rp {Number(item.priceAtPurchase).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <span className="font-bold">
                      Rp {(Number(item.priceAtPurchase) * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-zinc-300 flex justify-between font-bold text-sm text-zinc-900">
                <span>TOTAL:</span>
                <span className="text-green-700">Rp {Number(selectedInvoiceOrder.totalAmount).toLocaleString("id-ID")}</span>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-zinc-300 text-zinc-500 text-[10px]">
                <p>Terima kasih atas kepercayaan Anda.</p>
                <p>Simpan struk ini sebagai bukti serah terima obat yang sah.</p>
              </div>

              {/* Action Buttons: hidden during print */}
              <div className="flex justify-end gap-2 pt-2 border-t font-sans no-print print:hidden">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedInvoiceOrder(null)}>
                  Tutup
                </Button>
                <Button type="button" size="sm" onClick={() => window.print()} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Cetak Struk
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
