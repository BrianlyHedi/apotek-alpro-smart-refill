"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  RotateCcw, 
  Receipt, 
  Phone,
  ArrowRight,
  XCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatDateFull } from "@/lib/utils/format-date";
import { QuickRefillModal } from "@/components/patient/quick-refill-modal";

export interface OrderItemData {
  id: string;
  medicineId: string;
  quantity: number;
  priceAtPurchase: number;
  medicine: {
    name: string;
    category: string;
    dosageForm: string;
    price: number;
  };
}

export interface OrderData {
  id: string;
  status: "PENDING" | "CONFIRMED" | "READY" | "DELIVERED" | "CANCELLED";
  totalAmount: number;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  pharmacy: {
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string | null;
  };
  items: OrderItemData[];
}

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Sedang Disiapkan",
  READY: "Siap Diambil",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  READY: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
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

interface PatientOrdersClientProps {
  orders: OrderData[];
}

export function PatientOrdersClient({ orders }: PatientOrdersClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [reorderItem, setReorderItem] = useState<{
    id: string;
    medicine: {
      id: string;
      name: string;
      price: number;
      dosageForm?: string;
    };
    frequencyDays: number;
  } | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            Lacak & Riwayat Pesanan
          </h1>
          <p className="text-zinc-500">
            Pantau status penyiapan obat secara langsung atau lakukan pemesanan ulang.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white p-8">
          <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300 mb-3" />
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">Belum Ada Pesanan Obat</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
            Pesanan Anda akan muncul di sini setelah resep diverifikasi oleh apoteker atau melalui jadwal refill otomatis.
          </p>
          <div className="flex justify-center gap-3">
            <Button render={<Link href="/patient/prescriptions" />} nativeButton={false} className="bg-green-600 hover:bg-green-700 text-white">
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
            const isDelivered = order.status === "DELIVERED";

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
                      Waktu Pemesanan: {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-zinc-500 uppercase font-medium">Total Pembayaran</p>
                      <p className="text-lg font-bold text-green-700">
                        Rp {Number(order.totalAmount).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="text-xs h-8"
                    >
                      <Receipt className="mr-1.5 h-3.5 w-3.5 text-zinc-500" /> Detail
                    </Button>
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

                  {/* Item List & Action Buttons */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        Rincian Obat ({order.items.length}):
                      </h4>
                      {isDelivered && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (order.items[0]) {
                              setReorderItem({
                                id: order.items[0].id,
                                frequencyDays: 30,
                                medicine: {
                                  id: order.items[0].medicineId,
                                  name: order.items[0].medicine.name,
                                  price: Number(order.items[0].priceAtPurchase),
                                  dosageForm: order.items[0].medicine.dosageForm || "Tablet",
                                },
                              });
                            }
                          }}
                          className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50"
                        >
                          <RotateCcw className="mr-1.5 h-3 w-3 text-green-600" /> Pesan Ulang (Reorder)
                        </Button>
                      )}
                    </div>

                    <div className="divide-y divide-zinc-100 border rounded-lg overflow-hidden bg-white">
                      {order.items.map((item) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <PackageCheck className="h-4 w-4 text-green-600 shrink-0" />
                            <div>
                              <p className="font-medium text-zinc-900">{item.medicine.name}</p>
                              <p className="text-xs text-zinc-500">
                                Rp {Number(item.priceAtPurchase).toLocaleString("id-ID")} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-zinc-900">
                              Rp {(Number(item.priceAtPurchase) * item.quantity).toLocaleString("id-ID")}
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

      {/* Modal Detail Pesanan */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-lg font-bold">
                    Detail Pesanan #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </DialogTitle>
                  <Badge className={statusStyles[selectedOrder.status]}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </div>
                <DialogDescription>
                  Waktu pemesanan: {formatDateTime(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              {/* Pharmacy & Delivery details */}
              <div className="rounded-lg border bg-zinc-50/70 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cabang Penyiap:</span>
                  <span className="font-semibold text-zinc-900">{selectedOrder.pharmacy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Alamat Cabang:</span>
                  <span className="text-zinc-900 text-right">{selectedOrder.pharmacy.address}</span>
                </div>
                {selectedOrder.pharmacy.phone && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Telepon Apotek:</span>
                    <span className="text-zinc-900">{selectedOrder.pharmacy.phone}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-zinc-500">Metode Penyerahan:</span>
                  <span className="font-semibold text-zinc-900">
                    {selectedOrder.deliveryAddress ? `Antar Delivery: ${selectedOrder.deliveryAddress}` : "Ambil Langsung di Cabang"}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Catatan Khusus:</span>
                    <span className="text-zinc-900 font-medium">{selectedOrder.notes}</span>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="p-3 border rounded-lg bg-white space-y-2">
                <p className="text-xs font-semibold uppercase text-zinc-500">Riwayat Status Timeline</p>
                <div className="space-y-1.5 text-xs text-zinc-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    <span>Dibuat: <strong>{formatDateTime(selectedOrder.createdAt)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Terakhir Diperbarui: <strong>{formatDateTime(selectedOrder.updatedAt)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-500 mb-2">Rincian Obat</p>
                <div className="border rounded-lg divide-y divide-zinc-100">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.medicine.name}</p>
                        <p className="text-zinc-500">{item.medicine.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-zinc-900">
                          Rp {(Number(item.priceAtPurchase) * item.quantity).toLocaleString("id-ID")}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {item.quantity} Unit @ Rp {Number(item.priceAtPurchase).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-zinc-50 border-t flex items-center justify-between font-bold text-sm text-zinc-900 mt-2 rounded-lg">
                  <span>Total Pembayaran</span>
                  <span className="text-green-700">Rp {Number(selectedOrder.totalAmount).toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Reorder Modal */}
      <QuickRefillModal
        isOpen={Boolean(reorderItem)}
        onOpenChange={(open) => !open && setReorderItem(null)}
        refillItem={reorderItem}
      />
    </div>
  );
}
