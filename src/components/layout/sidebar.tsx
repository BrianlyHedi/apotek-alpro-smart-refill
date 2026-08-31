"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Pill, 
  PackageSearch, 
  ShoppingCart,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "PATIENT" | "PHARMACIST" | "ADMIN";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  // Konfigurasi menu berdasarkan role
  const menuItems = {
    PATIENT: [
      { href: "/patient", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/patient/prescriptions", icon: Pill, label: "Resep Saya" },
      { href: "/patient/inventory", icon: PackageSearch, label: "Cek Stok Obat" },
      { href: "/patient/orders", icon: ShoppingCart, label: "Riwayat Pesanan" },
    ],
    PHARMACIST: [
      { href: "/pharmacist", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/pharmacist/prescriptions", icon: Pill, label: "Verifikasi Resep" },
      { href: "/pharmacist/inventory", icon: PackageSearch, label: "Manajemen Stok" },
      { href: "/pharmacist/orders", icon: ShoppingCart, label: "Pesanan Masuk" },
    ],
    ADMIN: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/pharmacies", icon: PackageSearch, label: "Cabang Apotek" },
      { href: "/admin/users", icon: Settings, label: "Manajemen User" },
    ],
  };

  const currentMenu = menuItems[role] || [];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
      {/* Brand */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="rounded-lg bg-green-600 p-1.5">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <span className="text-green-800">Apotek Alpro</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid gap-1 px-2">
          {currentMenu.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-green-700",
                    isActive 
                      ? "bg-green-50 text-green-700" 
                      : "text-zinc-500 hover:bg-zinc-100"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-green-600" : "text-zinc-400")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Sidebar (Optional) */}
      <div className="mt-auto border-t p-4">
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-xs text-green-800 font-medium mb-1">Butuh Bantuan?</p>
          <p className="text-xs text-green-600 mb-2">Hubungi CS kami di jam kerja.</p>
          <button className="w-full text-xs font-semibold bg-white text-green-700 border border-green-200 rounded py-1.5 hover:bg-green-100 transition-colors">
            Chat CS
          </button>
        </div>
      </div>
    </aside>
  );
}
