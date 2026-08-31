"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Pill, 
  CheckCircle2, 
  Clock, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Package, 
  ExternalLink,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "refill" | "prescription" | "order" | "inventory";
  isRead: boolean;
  link?: string;
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "refill" | "prescription" | "order" | "inventory">("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Auto poll setiap 20 detik agar responsif terhadap perubahan data realtime
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: SystemNotification["type"]) => {
    switch (type) {
      case "refill":
        return <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />;
      case "prescription":
        return <Pill className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />;
      case "order":
        return <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />;
      case "inventory":
        return <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />;
      default:
        return <Package className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />;
    }
  };

  const filteredNotifications = notifications.filter(
    (n) => filter === "ALL" || n.type === filter
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-4 w-4 text-zinc-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      } />

      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96 shadow-lg border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b p-3 bg-zinc-50/80">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900">Pusat Notifikasi</span>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 text-[11px] px-1.5 py-0 hover:bg-red-100">
                {unreadCount} Baru
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                setIsLoading(true);
                fetchNotifications().finally(() => setIsLoading(false));
              }}
              className="text-zinc-400 hover:text-zinc-700 p-1"
              title="Perbarui Data"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-green-700 hover:text-green-800 hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="h-3 w-3" /> Tandai terbaca
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                title="Hapus Semua"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-2 border-b bg-white text-[11px] font-medium overflow-x-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2 py-1 rounded transition-all shrink-0 ${
              filter === "ALL" ? "bg-zinc-900 text-white font-semibold" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("refill")}
            className={`px-2 py-1 rounded transition-all shrink-0 ${
              filter === "refill" ? "bg-amber-600 text-white font-semibold" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Refill
          </button>
          <button
            onClick={() => setFilter("prescription")}
            className={`px-2 py-1 rounded transition-all shrink-0 ${
              filter === "prescription" ? "bg-emerald-600 text-white font-semibold" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Resep
          </button>
          <button
            onClick={() => setFilter("order")}
            className={`px-2 py-1 rounded transition-all shrink-0 ${
              filter === "order" ? "bg-blue-600 text-white font-semibold" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Pesanan
          </button>
          <button
            onClick={() => setFilter("inventory")}
            className={`px-2 py-1 rounded transition-all shrink-0 ${
              filter === "inventory" ? "bg-red-600 text-white font-semibold" : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Stok
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              Tidak ada notifikasi aktif pada kategori ini.
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.link) {
                    setIsOpen(false);
                    router.push(item.link);
                  }
                }}
                className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-zinc-50 cursor-pointer ${
                  !item.isRead ? "bg-green-50/50" : ""
                }`}
              >
                {getIcon(item.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-zinc-900">{item.title}</p>
                    {item.link && <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{item.message}</p>
                  <p className="text-[10px] text-zinc-400 mt-1">{item.time}</p>
                </div>
                {!item.isRead && (
                  <span className="h-2 w-2 rounded-full bg-green-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
