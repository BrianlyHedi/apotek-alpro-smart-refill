import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateRefillSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateRefillSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format data tidak valid: isActive harus bertipe boolean" },
        { status: 400 }
      );
    }

    const existing = await prisma.refillSchedule.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Jadwal refill tidak ditemukan atau bukan milik Anda" },
        { status: 404 }
      );
    }

    const updated = await prisma.refillSchedule.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      include: { medicine: true },
    });

    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error("[UPDATE_REFILL_SCHEDULE]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui jadwal refill" },
      { status: 500 }
    );
  }
}
