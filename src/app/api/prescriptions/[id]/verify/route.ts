import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const verifySchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().optional(),
  items: z.array(z.object({
    medicineId: z.string(),
    quantity: z.number().int().positive(),
    dosageInstruction: z.string().min(1)
  })).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prescriptionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pastikan user adalah apoteker/admin
    const profile = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!profile || !["PHARMACIST", "ADMIN"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = verifySchema.parse(body);

    // Transaksi Prisma: Update status resep, hapus item lama (jika ada), insert item baru
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update status
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: validatedData.status,
          notes: validatedData.notes
        }
      });

      // 2. Jika APPROVED dan ada items, simpan ke database
      if (validatedData.status === "VERIFIED" && validatedData.items && validatedData.items.length > 0) {
        // Hapus item lama (jika sebelumnya sudah pernah diverifikasi tapi diulang/diedit)
        await tx.prescriptionItem.deleteMany({
          where: { prescriptionId }
        });

        // Insert item baru
        await tx.prescriptionItem.createMany({
          data: validatedData.items.map(item => ({
            prescriptionId,
            medicineId: item.medicineId,
            quantity: item.quantity,
            dosageInstruction: item.dosageInstruction
          }))
        });
      }

      return updatedPrescription;
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[VERIFY_PRESCRIPTION]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
