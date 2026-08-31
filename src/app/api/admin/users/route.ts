import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["PATIENT", "PHARMACIST", "ADMIN"]),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  pharmacyId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat membuat akun baru" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Format data tidak valid" },
        { status: 400 }
      );
    }

    const { name, email, password, role, phone, address, pharmacyId } = parsed.data;

    // Cek apakah email sudah ada
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Pengguna dengan email tersebut sudah terdaftar" },
        { status: 409 }
      );
    }

    // Buat akun di Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) {
      console.error("[ADMIN_CREATE_USER_AUTH_ERROR]", authError);
      return NextResponse.json(
        { error: `Gagal membuat akun auth: ${authError.message}` },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Simpan ke Prisma User table
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        name,
        role,
        phone: phone || null,
        address: address || null,
        pharmacyId: role === "PHARMACIST" ? (pharmacyId || null) : null,
      },
      include: {
        pharmacy: { select: { name: true, city: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Pengguna berhasil dibuat",
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          address: newUser.address,
          pharmacyId: newUser.pharmacyId,
          createdAt: newUser.createdAt.toISOString(),
          pharmacy: newUser.pharmacy,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ADMIN_CREATE_USER]", error);
    return NextResponse.json(
      { error: "Gagal membuat pengguna baru" },
      { status: 500 }
    );
  }
}
