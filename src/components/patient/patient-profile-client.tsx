"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  KeyRound, 
  ShieldCheck, 
  Pill, 
  ShoppingCart, 
  RefreshCw, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/providers/toast-provider";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface PatientProfileClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    role: string;
    createdAt: string;
  };
  stats: {
    totalPrescriptions: number;
    totalOrders: number;
    activeRefills: number;
  };
}

export function PatientProfileClient({ user, stats }: PatientProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "SECURITY">("PROFILE");
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("error", "Nama tidak boleh kosong");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil");

      addToast("success", "Profil berhasil diperbarui!");
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("error", "Password baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast("error", "Konfirmasi password tidak cocok");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      addToast("success", "Password berhasil diubah!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <User className="h-8 w-8 text-green-600" />
          Profil & Pengaturan Akun
        </h1>
        <p className="text-zinc-500">
          Kelola informasi personal, alamat pengiriman default, dan keamanan akun Anda.
        </p>
      </div>

      {/* Stats Cards & Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-zinc-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Resep Diunggah</p>
              <p className="text-2xl font-bold text-zinc-900">{stats.totalPrescriptions}</p>
              <Link href="/patient/prescriptions" className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                Lihat Resep <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
              <Pill className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Jadwal Refill</p>
              <p className="text-2xl font-bold text-zinc-900">{stats.activeRefills}</p>
              <Link href="/patient/refills" className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                Kelola Refill <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <RefreshCw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase">Total Pesanan</p>
              <p className="text-2xl font-bold text-zinc-900">{stats.totalOrders}</p>
              <Link href="/patient/orders" className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1 font-medium">
                Lacak Pesanan <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "PROFILE"
              ? "bg-green-600 text-white shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Informasi Personal
        </button>
        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "SECURITY"
              ? "bg-green-600 text-white shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          Keamanan & Password
        </button>
      </div>

      {/* Tab: PROFILE */}
      {activeTab === "PROFILE" && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Data Diri Pasien</CardTitle>
            <CardDescription>
              Pastikan nomor telepon dan alamat pengiriman selalu akurat agar pengiriman obat lancar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    placeholder="Nama lengkap sesuai KTP"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat Email (Login)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    value={user.email}
                    disabled
                    className="pl-9 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">Email akun terhubung dengan autentikasi Supabase.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Alamat Lengkap Pengiriman Default
                </label>
                <div className="relative">
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jalan, No Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                    rows={3}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Alamat ini otomatis digunakan saat Anda memilih metode antar delivery.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {isUpdatingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: SECURITY */}
      {activeTab === "SECURITY" && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Keamanan Akun & Kata Sandi</CardTitle>
            <CardDescription>
              Ganti kata sandi akun Anda secara berkala untuk menjaga kerahasiaan data medis resep Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                    placeholder="Ulangi kata sandi baru"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {isUpdatingPassword ? "Memperbarui..." : "Ubah Kata Sandi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
