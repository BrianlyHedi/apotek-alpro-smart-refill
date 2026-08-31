"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, Mail, Shield, Phone, MapPin, Building2, Check } from "lucide-react";
import type { User as PrismaUser } from "@/generated/prisma";
import type { UserProfileWithPharmacy } from "@/lib/auth/get-user";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: PrismaUser | UserProfileWithPharmacy;
}

const roleBadgeStyles: Record<string, { label: string; className: string }> = {
  PATIENT: { label: "Pasien", className: "bg-emerald-100 text-emerald-800" },
  PHARMACIST: { label: "Apoteker Cabang", className: "bg-blue-100 text-blue-800" },
  ADMIN: { label: "Administrator", className: "bg-purple-100 text-purple-800" },
};

export function ProfileDialog({ isOpen, onOpenChange, user }: ProfileDialogProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const roleInfo = roleBadgeStyles[user.role] || {
    label: user.role,
    className: "bg-zinc-100 text-zinc-800",
  };

  const pharmacy = (user as UserProfileWithPharmacy).pharmacy;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white text-center relative">
          <Avatar className="h-20 w-20 mx-auto border-4 border-white/20 shadow-lg">
            <AvatarFallback className="bg-white text-green-700 font-bold text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold mt-3">{user.name}</h2>
          <p className="text-sm text-green-100">{user.email}</p>
          <div className="mt-2">
            <Badge className={`${roleInfo.className} font-medium`}>
              {roleInfo.label}
            </Badge>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
              <User className="h-4 w-4 text-zinc-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 font-medium">Nama Lengkap</p>
                <p className="font-medium text-zinc-900 truncate">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
              <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 font-medium">Email Terdaftar</p>
                <p className="font-medium text-zinc-900 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
              <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500 font-medium">Nomor Telepon</p>
                <p className="font-medium text-zinc-900">
                  {user.phone || "Belum diatur"}
                </p>
              </div>
            </div>

            {pharmacy && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500 font-medium">Cabang Penugasan</p>
                  <p className="font-medium text-zinc-900">{pharmacy.name} ({pharmacy.city})</p>
                  <p className="text-xs text-zinc-500">{pharmacy.address}</p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500 font-medium">Alamat</p>
                  <p className="font-medium text-zinc-900">{user.address}</p>
                </div>
              </div>
            )}

            {user.role === "PATIENT" && (
              <div className="pt-2">
                <Button
                  render={<Link href="/patient/profile" />}
                  nativeButton={false}
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                >
                  Buka Profil & Pengaturan Akun
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
