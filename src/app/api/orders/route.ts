import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const orderSchema = z.object({
  pharmacyId: z.string().uuid(),
  deliveryAddress: z.string().max(500).nullish(),
  notes: z.string().max(500).nullish(),
  prescriptionId: z.string().uuid().nullish(),
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

    const rawBody = await request.json();
    const parsed = orderSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.error("[ORDER_VALIDATION_ERROR]", parsed.error.issues);
      return NextResponse.json({ 
        error: "Data pesanan tidak valid: " + parsed.error.issues.map(i => i.message).join(", "),
        details: parsed.error.issues 
      }, { status: 400 });
    }
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
          throw new Error(`Stok ${inventory?.medicine?.name || requestedItem.medicineId} tidak mencukupi di cabang ini`);
        }
        const price = Number(inventory.medicine.price);
        totalAmount += price * requestedItem.quantity;
        orderItems.push({ medicineId: requestedItem.medicineId, quantity: requestedItem.quantity, priceAtPurchase: price });
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: requestedItem.quantity } },
        });
      }

      // Validasi izin obat resep: lewat prescriptionId ATAU jadwal refill aktif
      if (needsPrescription && !input.prescriptionId) {
        const activeRefills = await tx.refillSchedule.findMany({
          where: {
            userId: user.id,
            medicineId: { in: input.items.map((i) => i.medicineId) },
            isActive: true,
          },
        });

        const activeRefillMedIds = new Set(activeRefills.map((r) => r.medicineId));
        const unauthorizedRxItems = input.items.filter((item) => {
          const med = medicineMap.get(item.medicineId);
          return med?.requiresPrescription && !activeRefillMedIds.has(item.medicineId);
        });

        if (unauthorizedRxItems.length > 0) {
          throw new Error("Obat resep membutuhkan resep dokter yang sudah diverifikasi atau jadwal refill aktif");
        }

        // Perbarui tanggal nextRefillDate pada jadwal refill
        for (const refill of activeRefills) {
          const now = new Date();
          const nextDate = new Date(now.getTime() + refill.frequencyDays * 24 * 60 * 60 * 1000);
          await tx.refillSchedule.update({
            where: { id: refill.id },
            data: {
              lastRefillDate: now,
              nextRefillDate: nextDate,
            },
          });
        }
      }

      if (input.prescriptionId) {
        const prescription = await tx.prescription.findFirst({
          where: { id: input.prescriptionId, userId: user.id, status: "VERIFIED" },
        });
        if (!prescription) throw new Error("Resep tidak valid atau belum diverifikasi");

        // Pastikan jadwal refill dibuat untuk obat-obat dalam resep
        const now = new Date();
        const nextDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        for (const item of input.items) {
          await tx.refillSchedule.upsert({
            where: {
              userId_medicineId: {
                userId: user.id,
                medicineId: item.medicineId,
              },
            },
            create: {
              userId: user.id,
              medicineId: item.medicineId,
              frequencyDays: 30,
              nextRefillDate: nextDate,
              lastRefillDate: now,
              isActive: true,
            },
            update: {
              isActive: true,
              lastRefillDate: now,
              nextRefillDate: nextDate,
            },
          });
        }
      }

      return tx.order.create({
        data: {
          userId: user.id,
          pharmacyId: input.pharmacyId,
          prescriptionId: input.prescriptionId || null,
          deliveryAddress: input.deliveryAddress || null,
          notes: input.notes || null,
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
