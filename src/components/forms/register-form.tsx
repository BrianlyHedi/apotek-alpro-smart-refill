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
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: "PATIENT" } },
      });

      if (error) throw error;
      addToast("success", data.session ? "Akun berhasil dibuat." : "Cek email Anda untuk konfirmasi akun.");
      router.replace(data.session ? "/patient" : "/login");
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
          <div className="space-y-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} />
          </div>
          <Button type="submit" className="w-full bg-green-600 text-white hover:bg-green-700" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat akun...</> : "Daftar sebagai pasien"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Sudah punya akun? <Link href="/login" className="font-medium text-green-700 hover:underline">Masuk</Link>
        </p>
      </CardContent>
    </Card>
  );
}
