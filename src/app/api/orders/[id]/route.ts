import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "READY", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = statusSchema.parse(await request.json());
    const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, pharmacyId: true } });
    if (!profile || !["PHARMACIST", "ADMIN"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({ 
      where: { id }, 
      select: { id: true, userId: true, items: true } 
    });
    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.order.update({ 
      where: { id }, 
      data: { status: body.status },
      include: { items: true }
    });

    // Jika pesanan selesai diserahkan ke pasien, update tanggal refill
    if (body.status === "DELIVERED" && order.userId) {
      for (const item of updated.items) {
        const schedule = await prisma.refillSchedule.findFirst({
          where: { userId: order.userId, medicineId: item.medicineId, isActive: true },
        });
        if (schedule) {
          const now = new Date();
          const nextDate = new Date(now.getTime() + schedule.frequencyDays * 24 * 60 * 60 * 1000);
          await prisma.refillSchedule.update({
            where: { id: schedule.id },
            data: {
              lastRefillDate: now,
              nextRefillDate: nextDate,
            },
          });
        }
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Status order tidak valid" }, { status: 400 });
    return NextResponse.json({ error: "Gagal memperbarui order" }, { status: 500 });
  }
}