import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
      },
    });

    return NextResponse.json({ data: updated, success: true });
  } catch (error) {
    console.error("[UPDATE_PROFILE]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data profil" },
      { status: 500 }
    );
  }
}
