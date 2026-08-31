import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma/client";
import { PatientOrdersClient } from "@/components/patient/patient-orders-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riwayat & Lacak Pesanan - Apotek Alpro",
  description: "Pantau timeline status penyiapan dan serah terima obat Anda secara real-time",
};

export default async function PatientOrdersPage() {
  const user = await getAuthUser();

  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      pharmacy: { select: { id: true, name: true, city: true, address: true, phone: true } },
      items: { 
        include: { 
          medicine: { select: { name: true, category: true, dosageForm: true, price: true } } 
        } 
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    status: order.status as "PENDING" | "CONFIRMED" | "READY" | "DELIVERED" | "CANCELLED",
    totalAmount: Number(order.totalAmount),
    deliveryAddress: order.deliveryAddress,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    pharmacy: order.pharmacy,
    items: order.items.map((item) => ({
      id: item.id,
      medicineId: item.medicineId,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
      medicine: {
        name: item.medicine.name,
        category: item.medicine.category,
        dosageForm: item.medicine.dosageForm,
        price: Number(item.medicine.price),
      },
    })),
  }));

  return <PatientOrdersClient orders={serializedOrders} />;
}
