import { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Login | Apotek Alpro",
  description: "Masuk ke sistem Smart Prescription & Refill",
};

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Selamat Datang
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Silakan masuk ke akun Anda untuk melanjutkan.
        </p>
      </div>

      <Suspense fallback={<div className="h-[300px] animate-pulse bg-zinc-100 rounded-xl" />}>
        <LoginForm />
      </Suspense>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-50 px-2 text-zinc-500">
              Akun Demo Tersedia
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 text-xs text-zinc-600">
          <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="font-semibold text-zinc-900 mb-1">Pasien</div>
            budi.pasien@demo.com / Demo123!
          </div>
          <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="font-semibold text-zinc-900 mb-1">Apoteker</div>
            siti.apoteker@demo.com / Demo123!
          </div>
        </div>
      </div>
    </div>
  );
}
