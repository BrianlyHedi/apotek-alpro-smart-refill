import { getCurrentUserProfile } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { PharmacistOrdersList } from "@/components/pharmacist/pharmacist-orders-list";
import { ShoppingCart } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pesanan Masuk - Apotek Alpro",
  description: "Kelola dan proses pesanan masuk cabang",
};

export default async function PharmacistOrdersPage() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "PHARMACIST" || !profile.pharmacyId) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { pharmacyId: profile.pharmacyId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          medicine: { select: { id: true, name: true, category: true, price: true } },
        },
      },
      pharmacy: { select: { name: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
      medicine: {
        ...item.medicine,
        price: Number(item.medicine.price),
      },
    })),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Pesanan Masuk Cabang</h1>
        <p className="text-zinc-500">
          Kelola proses penyiapan dan serah terima obat di cabang {profile.pharmacy?.name || ""}.
        </p>
      </div>

      <PharmacistOrdersList initialOrders={serializedOrders} />
    </div>
  );
}
