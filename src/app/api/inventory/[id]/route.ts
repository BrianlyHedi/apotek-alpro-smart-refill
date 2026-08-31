import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateStockSchema = z.object({
  quantity: z.number().int().min(0)
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inventoryId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!profile || !["PHARMACIST", "ADMIN"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateStockSchema.parse(body);

    // Pastikan inventory ini milik cabang apoteker yang bersangkutan (jika role PHARMACIST)
    if (profile.role === "PHARMACIST") {
      const inventory = await prisma.inventory.findUnique({
        where: { id: inventoryId }
      });
      
      if (inventory?.pharmacyId !== profile.pharmacyId) {
        return NextResponse.json({ error: "Forbidden: Not your branch" }, { status: 403 });
      }
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: { quantity: validatedData.quantity }
    });

    return NextResponse.json({ data: updatedInventory });
  } catch (error) {
    console.error("[UPDATE_INVENTORY]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
