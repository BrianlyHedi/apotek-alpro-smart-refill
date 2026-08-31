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
    const order = await prisma.order.findUnique({ where: { id }, select: { pharmacyId: true } });
    if (!order || (profile.role === "PHARMACIST" && order.pharmacyId !== profile.pharmacyId)) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.order.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Status order tidak valid" }, { status: 400 });
    return NextResponse.json({ error: "Gagal memperbarui order" }, { status: 500 });
  }
}