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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building2, UserCog, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useRouter } from "next/navigation";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "PHARMACIST" | "ADMIN";
  phone: string | null;
  pharmacyId: string | null;
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
  const [selectedRole, setSelectedRole] = useState<"PATIENT" | "PHARMACIST" | "ADMIN">("PATIENT");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("NONE");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      addToast("success", `Profil & hak akses ${editingUser.name} berhasil diperbarui.`);
      setEditingUser(null);
      router.refresh();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.pharmacy && u.pharmacy.name.toLowerCase().includes(search.toLowerCase()));

    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari nama, email, atau cabang..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "PATIENT", "PHARMACIST", "ADMIN"].map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(r)}
              className={roleFilter === r ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white"}
            >
              {r === "ALL" ? "Semua Role" : roleBadgeStyles[r]?.label || r}
            </Button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-zinc-200 rounded-xl border bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Tidak ada pengguna ditemukan.
          </div>
        ) : (
          filtered.map((u) => {
            const roleInfo = roleBadgeStyles[u.role] || { label: u.role, className: "bg-zinc-100 text-zinc-800" };
            return (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-zinc-900">{u.name}</p>
                    <p className="text-xs text-zinc-500">
                      {u.email} {u.phone ? `· ${u.phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {u.pharmacy && (
                    <span className="text-xs text-zinc-600 flex items-center gap-1 bg-zinc-100 px-2.5 py-1 rounded">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                      {u.pharmacy.name}
                    </span>
                  )}
                  <Badge className={roleInfo.className}>{roleInfo.label}</Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(u)}
                    className="h-8 text-xs text-zinc-700 hover:text-green-700"
                  >
                    <UserCog className="mr-1.5 h-3.5 w-3.5" />
                    Kelola
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          {editingUser && (
            <div>
              <DialogHeader>
                <DialogTitle>Kelola Akun Pengguna</DialogTitle>
                <DialogDescription>
                  Ubah hak akses role dan cabang penugasan untuk {editingUser.name}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="p-3 bg-zinc-50 rounded-lg border text-xs text-zinc-600 space-y-1">
                  <p><strong>Nama:</strong> {editingUser.name}</p>
                  <p><strong>Email:</strong> {editingUser.email}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Peran / Role Pengguna</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "PATIENT" | "PHARMACIST" | "ADMIN")}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Pilih Role">
                        {roleBadgeStyles[selectedRole]?.label || selectedRole}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PATIENT">Pasien (PATIENT)</SelectItem>
                      <SelectItem value="PHARMACIST">Apoteker Cabang (PHARMACIST)</SelectItem>
                      <SelectItem value="ADMIN">Administrator (ADMIN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedRole === "PHARMACIST" && (
                  <div className="space-y-1.5 animate-in fade-in-50">
                    <Label className="text-xs font-semibold">Cabang Penugasan Apoteker</Label>
                    <Select value={selectedPharmacyId} onValueChange={(v) => setSelectedPharmacyId(v || "NONE")}>
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Pilih Cabang Apotek">
                          {selectedPharmacyId === "NONE"
                            ? "Belum Ditugaskan"
                            : pharmacies.find((p) => p.id === selectedPharmacyId)?.name || "Pilih Cabang Apotek"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Belum Ditugaskan</SelectItem>
                        {pharmacies.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {p.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Batal
                </Button>
                <Button
                  onClick={handleSaveUser}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
