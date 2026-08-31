import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createRefillSchema = z.object({
  medicineId: z.string().uuid("ID obat tidak valid"),
  frequencyDays: z.number().int().min(7).max(180).default(30),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const schedules = await prisma.refillSchedule.findMany({
      where: { userId: user.id },
      include: {
        medicine: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            dosageForm: true,
          },
        },
      },
      orderBy: { nextRefillDate: "asc" },
    });

    return NextResponse.json({ data: schedules });
  } catch (error) {
    console.error("[GET_REFILLS]", error);
    return NextResponse.json({ error: "Gagal memuat jadwal refill" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = createRefillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Format data tidak valid" },
        { status: 400 }
      );
    }

    const { medicineId, frequencyDays } = parsed.data;

    // Cek apakah jadwal untuk obat ini sudah ada
    const existing = await prisma.refillSchedule.findUnique({
      where: {
        userId_medicineId: {
          userId: user.id,
          medicineId,
        },
      },
    });

    const now = new Date();
    const nextDate = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

    if (existing) {
      const updated = await prisma.refillSchedule.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          frequencyDays,
          nextRefillDate: nextDate,
        },
        include: { medicine: true },
      });
      return NextResponse.json({ data: updated, message: "Jadwal refill diperbarui" });
    }

    const created = await prisma.refillSchedule.create({
      data: {
        userId: user.id,
        medicineId,
        frequencyDays,
        nextRefillDate: nextDate,
        lastRefillDate: null,
        isActive: true,
      },
      include: { medicine: true },
    });

    return NextResponse.json(
      { data: created, message: "Jadwal refill berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE_REFILL]", error);
    return NextResponse.json({ error: "Gagal membuat jadwal refill" }, { status: 500 });
  }
}
