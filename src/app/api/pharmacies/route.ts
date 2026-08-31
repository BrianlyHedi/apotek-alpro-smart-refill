import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createPharmacySchema = z.object({
  name: z.string().min(3, "Nama cabang minimal 3 karakter"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  city: z.string().min(2, "Kota minimal 2 karakter"),
  phone: z.string().optional(),
  latitude: z.number().optional().default(-6.2088),
  longitude: z.number().optional().default(106.8456),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const medicineId = searchParams.get("medicineId");

    const pharmacies = await prisma.pharmacy.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        ...(medicineId
          ? {
              inventory: {
                where: { medicineId },
                select: { quantity: true, minStock: true },
              },
            }
          : {}),
      },
    });

    const data = pharmacies.map((p) => {
      const stockItem = (p as { inventory?: { quantity: number; minStock: number }[] }).inventory?.[0];
      return {
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        phone: p.phone,
        stock: stockItem !== undefined ? stockItem.quantity : null,
        minStock: stockItem !== undefined ? stockItem.minStock : 10,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET_PHARMACIES]", error);
    return NextResponse.json({ error: "Gagal memuat cabang apotek" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Hanya Admin yang dapat menambah cabang" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createPharmacySchema.parse(body);

    const newPharmacy = await prisma.pharmacy.create({
      data: validated,
    });

    // Otomatis inisialisasi stok obat default untuk cabang baru jika ada obat
    const medicines = await prisma.medicine.findMany({ where: { deletedAt: null } });
    if (medicines.length > 0) {
      await prisma.inventory.createMany({
        data: medicines.map((m) => ({
          pharmacyId: newPharmacy.id,
          medicineId: m.id,
          quantity: 20, // default initial stock
          minStock: 10,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ data: newPharmacy }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PHARMACY]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Data tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal menambahkan cabang" }, { status: 500 });
  }
}
