import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const interactions = await prisma.drugInteraction.findMany({
    include: {
      medicineA: { select: { name: true } },
      medicineB: { select: { name: true } },
    },
    orderBy: { severity: "desc" },
  });

  return NextResponse.json({
    data: interactions.map((interaction) => ({
      medicineAId: interaction.medicineAId,
      medicineAName: interaction.medicineA.name,
      medicineBId: interaction.medicineBId,
      medicineBName: interaction.medicineB.name,
      severity: interaction.severity,
      description: interaction.description,
    })),
  });
}
