"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Building2, 
  UserCog, 
  Loader2, 
  CheckCircle2, 
  Info, 
  Mail, 
  Phone, 
  User, 
  ShieldCheck, 
  MapPin,
  Calendar,
  UserPlus
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "PHARMACIST" | "ADMIN";
  phone: string | null;
  address?: string | null;
  pharmacyId: string | null;
  createdAt?: string;
  pharmacy: {
    name: string;
    city: string;
  } | null;
}

interface PharmacyOption {
  id: string;
  name: string;
  city: string;
}

const roleBadgeStyles: Record<string, { label: string; className: string }> = {
  PATIENT: { label: "Pasien", className: "bg-emerald-100 text-emerald-800" },
  PHARMACIST: { label: "Apoteker", className: "bg-blue-100 text-blue-800" },
  ADMIN: { label: "Admin", className: "bg-purple-100 text-purple-800" },
};

export function AdminUsersClient({
  initialUsers,
  pharmacies,
}: {
  initialUsers: AdminUserItem[];
  pharmacies: PharmacyOption[];
}) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "PHARMACIST" | "ADMIN">("PATIENT");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("NONE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Tambah Pengguna Baru
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("Demo123!");
  const [addRole, setAddRole] = useState<"PATIENT" | "PHARMACIST" | "ADMIN">("PATIENT");
  const [addPharmacyId, setAddPharmacyId] = useState<string>("NONE");
  const [addPhone, setAddPhone] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { addToast } = useToast();
  const router = useRouter();

  const handleOpenEdit = (user: AdminUserItem) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedPharmacyId(user.pharmacyId || "NONE");
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const payload = {
        role: selectedRole,
        pharmacyId: selectedPharmacyId === "NONE" ? null : selectedPharmacyId,
      };

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui user");

      const assignedPharmacy = pharmacies.find((p) => p.id === selectedPharmacyId);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                role: selectedRole,
                pharmacyId: selectedPharmacyId === "NONE" ? null : selectedPharmacyId,
                pharmacy: assignedPharmacy ? { name: assignedPharmacy.name, city: assignedPharmacy.city } : null,
              }
            : u
        )
      );

      addToast("success", `Peran dan penugasan ${editingUser.name} berhasil diperbarui.`);
      setEditingUser(null);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      addToast("error", "Harap isi nama, email, dan password");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim(),
        role: addRole,
        phone: addPhone.trim() || null,
        address: addAddress.trim() || null,
        pharmacyId: addRole === "PHARMACIST" && addPharmacyId !== "NONE" ? addPharmacyId : null,
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal membuat pengguna baru");

      setUsers([result.data, ...users]);
      addToast("success", `Pengguna baru ${addName} (${addRole}) berhasil dibuat.`);
      setIsAddUserOpen(false);

      // Reset form
      setAddName("");
      setAddEmail("");
      setAddPassword("Demo123!");
      setAddRole("PATIENT");
      setAddPharmacyId("NONE");
      setAddPhone("");
      setAddAddress("");
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal membuat pengguna baru");
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari nama, email, no. telepon..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
            {[
              { key: "ALL", label: `Semua (${users.length})` },
              { key: "PATIENT", label: "Pasien" },
              { key: "PHARMACIST", label: "Apoteker" },
              { key: "ADMIN", label: "Admin" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  roleFilter === tab.key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setIsAddUserOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-9 shadow-sm"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Tambah Pengguna Baru
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="divide-y divide-zinc-200">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">
              Tidak ada pengguna yang cocok dengan pencarian.
            </div>
          ) : (
            filtered.map((user) => {
              const roleInfo = roleBadgeStyles[user.role] || { label: user.role, className: "bg-zinc-100" };

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-full bg-zinc-100 text-zinc-600 shrink-0 mt-0.5">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-zinc-900">{user.name}</h3>
                        <Badge className={`${roleInfo.className} text-[11px]`}>
                          {roleInfo.label}
                        </Badge>
                        {user.pharmacy && (
                          <Badge variant="outline" className="text-[11px] text-blue-700 bg-blue-50/60 border-blue-200 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.pharmacy.name} ({user.pharmacy.city})
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-zinc-400" /> {user.email}
                        </span>
                        {user.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-zinc-400" /> {user.phone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailUser(user)}
                      className="text-xs h-8 text-zinc-500 hover:text-zinc-900"
                    >
                      <Info className="h-3.5 w-3.5 mr-1" /> Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(user)}
                      className="text-xs h-8 text-green-700 border-green-200 hover:bg-green-50"
                    >
                      <UserCog className="h-3.5 w-3.5 mr-1 text-green-600" /> Kelola User
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Tambah Pengguna Baru */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Tambah Pengguna Baru</DialogTitle>
                <DialogDescription className="text-xs">
                  Buat akun Pasien, Apoteker Cabang, atau Administrator sistem baru.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Nama Lengkap *</Label>
              <Input
                placeholder="Contoh: Dr. Rahmat Hidayat"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Alamat Email *</Label>
              <Input
                type="email"
                placeholder="rahmat@apotekalpro.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                className="mt-1 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Kata Sandi Default *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="mt-1 text-xs"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Peran Akun (Role) *</Label>
              <Select
                value={addRole}
                onValueChange={(val) => setAddRole(val as "PATIENT" | "PHARMACIST" | "ADMIN")}
              >
                <SelectTrigger className="mt-1 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">Pasien (PATIENT)</SelectItem>
                  <SelectItem value="PHARMACIST">Apoteker Cabang (PHARMACIST)</SelectItem>
                  <SelectItem value="ADMIN">Administrator Sistem (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {addRole === "PHARMACIST" && (
              <div>
                <Label className="text-xs font-semibold">Cabang Apotek Penugasan</Label>
                <Select
                  value={addPharmacyId}
                  onValueChange={(val) => {
                    if (val) setAddPharmacyId(val);
                  }}
                >
                  <SelectTrigger className="mt-1 w-full text-xs">
                    <SelectValue placeholder="Pilih cabang apotek" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- Belum Ditugaskan --</SelectItem>
                    {pharmacies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">No. Telepon / WhatsApp</Label>
                <Input
                  placeholder="08123456789"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Alamat (Opsional)</Label>
                <Input
                  placeholder="Jakarta"
                  value={addAddress}
                  onChange={(e) => setAddAddress(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isCreating}>
                Batal
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs">
                {isCreating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                {isCreating ? "Menyimpan..." : "Buat Pengguna"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Edit Role & Assignment */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kelola Hak Akses & Penugasan Staf</DialogTitle>
            <DialogDescription>
              Ubah peran sistem untuk <strong>{editingUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Peran Akun (Role)</Label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setSelectedRole(val as "PATIENT" | "PHARMACIST" | "ADMIN")}
              >
                <SelectTrigger className="mt-1 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PATIENT">Pasien (PATIENT)</SelectItem>
                  <SelectItem value="PHARMACIST">Apoteker Cabang (PHARMACIST)</SelectItem>
                  <SelectItem value="ADMIN">Administrator Sistem (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "PHARMACIST" && (
              <div>
                <Label className="text-xs font-semibold">Cabang Apotek Penugasan</Label>
                <Select
                  value={selectedPharmacyId}
                  onValueChange={(val) => {
                    if (val) setSelectedPharmacyId(val);
                  }}
                >
                  <SelectTrigger className="mt-1 w-full text-xs">
                    <SelectValue placeholder="Pilih cabang apotek penugasan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- Tidak Ditugaskan di Cabang Tertentu --</SelectItem>
                    {pharmacies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Apoteker hanya akan mengelola stok dan pesanan cabang yang ditugaskan.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSaveUser} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detail User */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="sm:max-w-md">
          {detailUser && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-zinc-100 text-zinc-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold">{detailUser.name}</DialogTitle>
                    <DialogDescription>{detailUser.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-3 bg-zinc-50 border rounded-lg space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Peran Akun:</span>
                  <Badge className={roleBadgeStyles[detailUser.role]?.className || ""}>
                    {roleBadgeStyles[detailUser.role]?.label || detailUser.role}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Nomor Telepon:</span>
                  <span className="font-semibold text-zinc-900">{detailUser.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cabang Penugasan:</span>
                  <span className="font-semibold text-zinc-900">
                    {detailUser.pharmacy ? `${detailUser.pharmacy.name} (${detailUser.pharmacy.city})` : "Semua Cabang / Tidak Terkait"}
                  </span>
                </div>
                {detailUser.address && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Alamat:</span>
                    <span className="text-zinc-900 text-right">{detailUser.address}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setDetailUser(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
