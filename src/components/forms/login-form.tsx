"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Loader2, KeyRound, CheckCircle2, Mail, ArrowRight, UserCheck, Shield } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Modal Lupa Password
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast("error", "Harap masukkan email dan password");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data.session) {
        addToast("success", "Login berhasil! Mengalihkan ke dashboard...");
        const redirectTo = searchParams.get("redirect") || "/";
        router.replace(redirectTo);
        router.refresh();
      }
    } catch (err) {
      addToast(
        "error",
        err instanceof Error ? err.message : "Gagal login. Periksa kembali email dan password Anda."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword("Demo123!");
    addToast("info", `Akun ${roleName} (${demoEmail}) berhasil diisikan ke form.`);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      addToast("error", "Harap masukkan email Anda");
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        console.warn("[RESET_PASSWORD_WARN]", error.message);
      }

      setResetSuccess(true);
      addToast("success", `Instruksi pemulihan kata sandi telah dikirim ke ${forgotEmail}`);
    } catch (err) {
      setResetSuccess(true);
      addToast("info", `Instruksi reset password dikirim ke ${forgotEmail}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
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
                className="bg-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || "budi.pasien@demo.com");
                    setResetSuccess(false);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium"
                >
                  Lupa password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses Masuk...
                </>
              ) : (
                "Masuk ke Akun"
              )}
            </Button>
          </form>
          
          {/* Quick Autofill Buttons */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 text-center">
              Pilihan Cepat Akun Demo:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="text-xs h-8 border-green-200 text-green-800 hover:bg-green-50 font-medium" 
                onClick={() => handleAutofill("budi.pasien@demo.com", "Pasien")} 
                disabled={isLoading}
              >
                Isi Pasien
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="text-xs h-8 border-blue-200 text-blue-800 hover:bg-blue-50 font-medium" 
                onClick={() => handleAutofill("siti.apoteker@demo.com", "Apoteker")} 
                disabled={isLoading}
              >
                Isi Apoteker
              </Button>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="text-xs h-8 border-purple-200 text-purple-800 hover:bg-purple-50 font-medium" 
                onClick={() => handleAutofill("admin.greenville@demo.com", "Admin")} 
                disabled={isLoading}
              >
                Isi Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Lupa Password */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Lupa Kata Sandi?</DialogTitle>
                <DialogDescription className="text-xs">
                  Atur ulang kata sandi akun Apotek Alpro Anda.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {resetSuccess ? (
            <div className="py-4 space-y-3">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-xs text-green-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Link Reset Terkirim
                </div>
                <p>
                  Instruksi pemulihan kata sandi telah dikirimkan ke <strong>{forgotEmail}</strong>.
                </p>
                <div className="p-2.5 bg-white rounded border border-green-100 text-[11px] text-zinc-600">
                  💡 <strong>Informasi Akun Demo:</strong> Seluruh akun demo (Pasien, Apoteker, Admin) menggunakan kata sandi default: <code>Demo123!</code>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs"
                >
                  Kembali ke Halaman Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold text-zinc-700">
                  Email Akun Terdaftar
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="budi.pasien@demo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="text-xs"
                  required
                />
                <p className="text-[11px] text-zinc-500">
                  Kami akan mengirimkan tautan verifikasi untuk membuat kata sandi baru.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 border rounded-lg text-[11px] text-zinc-600 space-y-1">
                <p className="font-semibold text-zinc-800 flex items-center gap-1">
                  <Shield className="h-3 w-3 text-green-600" /> Akun Demo Bawaan:
                </p>
                <p>Password default semua akun demo adalah: <strong className="text-green-700">Demo123!</strong></p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  disabled={isResetting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResetting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs"
                >
                  {isResetting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isResetting ? "Mengirim..." : "Kirim Link Reset"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
