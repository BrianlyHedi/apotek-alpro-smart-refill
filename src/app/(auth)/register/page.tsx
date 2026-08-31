import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "Daftar | Apotek Alpro",
  description: "Buat akun pasien Apotek Alpro",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Buat akun</h1>
        <p className="mt-2 text-sm text-zinc-600">Daftar untuk mengelola resep dan refill obat Anda.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
