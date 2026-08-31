"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UserPlus, CheckCircle2, Phone, MapPin } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      addToast("error", "Harap lengkapi semua field wajib");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Panggil server API register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar akun");
      }

      // 2. Auto-login ke Supabase Auth
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (loginError) {
        addToast("success", "Akun berhasil dibuat. Silakan login.");
        router.push("/login");
        return;
      }

      addToast("success", "Pendaftaran berhasil! Selamat datang di Apotek Alpro.");
      router.replace("/patient");
      router.refresh();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Gagal membuat akun.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">Nama Lengkap *</Label>
            <Input 
              id="name" 
              placeholder="Contoh: Budi Santoso"
              value={name} 
              onChange={(event) => setName(event.target.value)} 
              required 
              disabled={isLoading} 
              className="text-xs"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="nama@email.com"
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              required 
              disabled={isLoading} 
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold">Nomor WhatsApp / HP</Label>
            <Input 
              id="phone" 
              placeholder="081234567890"
              value={phone} 
              onChange={(event) => setPhone(event.target.value)} 
              disabled={isLoading} 
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold">Alamat Rumah (Opsional)</Label>
            <Input 
              id="address" 
              placeholder="Jl. Merdeka No. 10, Jakarta"
              value={address} 
              onChange={(event) => setAddress(event.target.value)} 
              disabled={isLoading} 
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">Password *</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Minimal 6 karakter"
              minLength={6} 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
              required 
              disabled={isLoading} 
              className="text-xs"
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 text-white hover:bg-green-700 font-semibold shadow-sm text-xs h-9 mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftarkan Akun...
              </>
            ) : (
              <>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Daftar Akun Pasien
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-green-700 hover:underline">
            Masuk Sekarang
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
