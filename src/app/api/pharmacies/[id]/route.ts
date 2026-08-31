import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updatePharmacySchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Hanya admin yang dapat mengubah cabang" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePharmacySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Format data tidak valid" }, { status: 400 });
    }

    const updated = await prisma.pharmacy.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error("[UPDATE_PHARMACY]", error);
    return NextResponse.json({ error: "Gagal memperbarui data cabang" }, { status: 500 });
  }
}
