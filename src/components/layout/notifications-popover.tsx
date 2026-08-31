"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, Pill, CheckCircle2, Clock, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "refill" | "prescription" | "order";
  isRead: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Pengingat Refill Obat",
    message: "Jadwal refill Metformin 500mg Anda jatuh tempo dalam 2 hari.",
    time: "10 menit yang lalu",
    type: "refill",
    isRead: false,
  },
  {
    id: "2",
    title: "Resep Berhasil Diverifikasi",
    message: "Apoteker Siti telah menyetujui resep kontrol rutin Anda.",
    time: "1 jam yang lalu",
    type: "prescription",
    isRead: false,
  },
  {
    id: "3",
    title: "Pesanan Siap Diambil",
    message: "Pesanan obat #ORD-8821 sudah siap diambil di Cabang Dago.",
    time: "3 jam yang lalu",
    type: "order",
    isRead: true,
  },
];

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "refill":
        return <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />;
      case "prescription":
        return <Pill className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />;
      case "order":
        return <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-4 w-4 text-zinc-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      } />

      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b p-3 bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-zinc-900">Notifikasi</span>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 text-xs px-1.5 py-0 hover:bg-red-100">
                {unreadCount} Baru
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-green-700 hover:text-green-800 hover:underline flex items-center gap-1 font-medium"
            >
              <Check className="h-3 w-3" /> Tandai terbaca
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Tidak ada notifikasi saat ini.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 flex items-start gap-3 transition-colors hover:bg-zinc-50 ${
                  !item.isRead ? "bg-green-50/40" : ""
                }`}
              >
                {getIcon(item.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-900">{item.title}</p>
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
