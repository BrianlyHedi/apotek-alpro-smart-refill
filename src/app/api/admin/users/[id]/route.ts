import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateUserSchema = z.object({
  role: z.enum(["PATIENT", "PHARMACIST", "ADMIN"]).optional(),
  pharmacyId: z.string().uuid().nullable().optional(),
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
      return NextResponse.json({ error: "Forbidden - Hanya Admin" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(validated.role ? { role: validated.role } : {}),
        ...(validated.pharmacyId !== undefined ? { pharmacyId: validated.pharmacyId } : {}),
      },
      include: {
        pharmacy: { select: { name: true, city: true } },
      },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error("[ADMIN_UPDATE_USER]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui user" }, { status: 500 });
  }
}
