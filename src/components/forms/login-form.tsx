"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        addToast("success", "Login berhasil!");
        
        // Cek redirect param, kalau tidak ada, middleware yang akan handle routing berdasarkan role
        const redirectTo = searchParams.get("redirect") || "/";
        
        // Gunakan router.replace dan router.refresh agar state Next.js dan middleware terupdate
        router.replace(redirectTo);
        router.refresh();
      }
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Gagal login. Periksa kembali email dan password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Demo123!");
  };

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs text-green-600 hover:underline">
                Lupa password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
        
        <div className="mt-4 flex gap-2">
           <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => autofillDemo("budi.pasien@demo.com")} disabled={isLoading}>
              Isi Pasien
           </Button>
           <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => autofillDemo("siti.apoteker@demo.com")} disabled={isLoading}>
              Isi Apoteker
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
