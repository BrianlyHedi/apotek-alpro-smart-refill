import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Format data tidak valid" },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address } = parsed.data;

    // Cek apakah email sudah terdaftar di database Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau login." },
        { status: 409 }
      );
    }

    // Buat akun di Supabase Auth via Admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name, role: "PATIENT" },
    });

    if (authError) {
      console.error("[REGISTER_AUTH_ERROR]", authError);
      return NextResponse.json(
        { error: `Gagal membuat akun: ${authError.message}` },
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
        role: "PATIENT",
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json(
      {
        message: "Akun berhasil dibuat",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat mendaftar akun" },
      { status: 500 }
    );
  }
}
