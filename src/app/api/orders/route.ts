import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const orderSchema = z.object({
  pharmacyId: z.string().uuid(),
  deliveryAddress: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
  prescriptionId: z.string().uuid().optional(),
  items: z.array(z.object({
    medicineId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { pharmacy: true, items: { include: { medicine: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: orders });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = orderSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    const input = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems: { medicineId: string; quantity: number; priceAtPurchase: number }[] = [];
      const medicines = await tx.medicine.findMany({
        where: { id: { in: input.items.map((item) => item.medicineId) }, deletedAt: null },
        select: { id: true, requiresPrescription: true },
      });
      const medicineMap = new Map(medicines.map((medicine) => [medicine.id, medicine]));
      const needsPrescription = input.items.some((item) => medicineMap.get(item.medicineId)?.requiresPrescription);

      if (medicines.length !== new Set(input.items.map((item) => item.medicineId)).size) {
        throw new Error("Obat tidak ditemukan atau sudah tidak aktif");
      }

      for (const requestedItem of input.items) {
        const inventory = await tx.inventory.findUnique({
          where: { pharmacyId_medicineId: { pharmacyId: input.pharmacyId, medicineId: requestedItem.medicineId } },
          include: { medicine: true },
        });
        if (!inventory || inventory.quantity < requestedItem.quantity) {
          throw new Error(`Stok ${requestedItem.medicineId} tidak mencukupi`);
        }
        const price = Number(inventory.medicine.price);
        totalAmount += price * requestedItem.quantity;
        orderItems.push({ medicineId: requestedItem.medicineId, quantity: requestedItem.quantity, priceAtPurchase: price });
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: requestedItem.quantity } },
        });
      }

      if (needsPrescription && !input.prescriptionId) {
        throw new Error("Obat resep membutuhkan resep yang sudah diverifikasi");
      }

      if (input.prescriptionId) {
        const prescription = await tx.prescription.findFirst({ where: { id: input.prescriptionId, userId: user.id, status: "VERIFIED" } });
        if (!prescription) throw new Error("Resep tidak valid atau belum diverifikasi");
      }

      return tx.order.create({
        data: {
          userId: user.id,
          pharmacyId: input.pharmacyId,
          prescriptionId: input.prescriptionId,
          deliveryAddress: input.deliveryAddress,
          notes: input.notes,
          totalAmount,
          items: { create: orderItems },
        },
        include: { items: { include: { medicine: true } }, pharmacy: true },
      });
    });

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_ORDER]", error);
    const message = error instanceof Error ? error.message : "Gagal membuat pesanan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
