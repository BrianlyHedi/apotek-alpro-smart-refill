import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDay } from "@/lib/utils/format-date";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "refill" | "prescription" | "order" | "inventory";
  isRead: boolean;
  link?: string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, name: true, pharmacyId: true },
    });

    if (!profile) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications: SystemNotification[] = [];

    if (profile.role === "PATIENT") {
      // 1. Refill Schedules
      const activeRefills = await prisma.refillSchedule.findMany({
        where: { userId: profile.id, isActive: true },
        include: { medicine: { select: { name: true } } },
        orderBy: { nextRefillDate: "asc" },
      });

      const now = new Date();
      for (const refill of activeRefills) {
        const nextDate = new Date(refill.nextRefillDate);
        const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          notifications.push({
            id: `refill-${refill.id}`,
            title: "⚠️ Refill Obat Jatuh Tempo",
            message: `Jadwal refill ${refill.medicine.name} telah jatuh tempo hari ini! Segera lakukan pemesanan ulang.`,
            time: "Hari ini",
            type: "refill",
            isRead: false,
            link: "/patient/refills",
          });
        } else if (diffDays <= 7) {
          notifications.push({
            id: `refill-${refill.id}`,
            title: "Pengingat Refill Obat Rutin",
            message: `Jadwal refill ${refill.medicine.name} Anda jatuh tempo dalam ${diffDays} hari lagi.`,
            time: `${diffDays} hari lagi`,
            type: "refill",
            isRead: false,
            link: "/patient/refills",
          });
        }
      }

      // 2. Prescriptions
      const prescriptions = await prisma.prescription.findMany({
        where: { userId: profile.id },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      for (const p of prescriptions) {
        if (p.status === "VERIFIED") {
          notifications.push({
            id: `rx-${p.id}`,
            title: "Resep Berhasil Diverifikasi",
            message: `Resep #${p.id.slice(0, 8).toUpperCase()} telah disetujui apoteker dan siap untuk ditebus.`,
            time: formatRelativeDay(p.updatedAt.toISOString()),
            type: "prescription",
            isRead: false,
            link: "/patient/prescriptions",
          });
        } else if (p.status === "REJECTED") {
          notifications.push({
            id: `rx-${p.id}`,
            title: "Resep Memerlukan Perbaikan",
            message: `Resep #${p.id.slice(0, 8).toUpperCase()} ditolak: ${p.notes || "Silakan unggah ulang foto resep yang jelas"}.`,
            time: formatRelativeDay(p.updatedAt.toISOString()),
            type: "prescription",
            isRead: false,
            link: "/patient/prescriptions",
          });
        }
      }

      // 3. Orders
      const orders = await prisma.order.findMany({
        where: { userId: profile.id },
        include: { pharmacy: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      for (const o of orders) {
        if (o.status === "READY") {
          notifications.push({
            id: `order-${o.id}`,
            title: "Pesanan Siap Diambil",
            message: `Pesanan obat #${o.id.slice(0, 8).toUpperCase()} sudah siap diambil di ${o.pharmacy.name}.`,
            time: formatRelativeDay(o.updatedAt.toISOString()),
            type: "order",
            isRead: false,
            link: "/patient/orders",
          });
        } else if (o.status === "CONFIRMED") {
          notifications.push({
            id: `order-${o.id}`,
            title: "Pesanan Sedang Disiapkan",
            message: `Apoteker di ${o.pharmacy.name} sedang meracik & menyiapkan pesanan #${o.id.slice(0, 8).toUpperCase()}.`,
            time: formatRelativeDay(o.updatedAt.toISOString()),
            type: "order",
            isRead: true,
            link: "/patient/orders",
          });
        }
      }
    } else if (profile.role === "PHARMACIST") {
      // 1. Pending prescriptions in system
      const pendingRxCount = await prisma.prescription.count({
        where: { status: "PENDING" },
      });

      if (pendingRxCount > 0) {
        notifications.push({
          id: "pharma-pending-rx",
          title: "Antrean Resep Masuk",
          message: `Terdapat ${pendingRxCount} resep fisik pasien yang menunggu telaah dan verifikasi klinis Anda.`,
          time: "Baru saja",
          type: "prescription",
          isRead: false,
          link: "/pharmacist/prescriptions",
        });
      }

      // 2. Incoming Branch Orders
      const orderWhere = profile.pharmacyId
        ? { pharmacyId: profile.pharmacyId, status: "PENDING" as const }
        : { status: "PENDING" as const };

      const pendingOrders = await prisma.order.count({ where: orderWhere });

      if (pendingOrders > 0) {
        notifications.push({
          id: "pharma-pending-orders",
          title: "Pesanan Baru Masuk",
          message: `Terdapat ${pendingOrders} pesanan obat baru yang menunggu konfirmasi penyiapan di cabang Anda.`,
          time: "Baru saja",
          type: "order",
          isRead: false,
          link: "/pharmacist/orders",
        });
      }

      // 3. Low stock alert at branch
      const stockWhere = profile.pharmacyId
        ? { pharmacyId: profile.pharmacyId }
        : {};

      const lowStockItems = await prisma.inventory.findMany({
        where: stockWhere,
        include: {
          medicine: { select: { name: true } },
          pharmacy: { select: { name: true } },
        },
        orderBy: { quantity: "asc" },
        take: 3,
      });

      for (const item of lowStockItems) {
        if (item.quantity <= item.minStock) {
          notifications.push({
            id: `stock-${item.id}`,
            title: item.quantity === 0 ? "🚨 Stok Obat Habis" : "⚠️ Stok Obat Menipis",
            message: `Stok ${item.medicine.name} di ${item.pharmacy.name} tersisa ${item.quantity} unit (Batas min: ${item.minStock}).`,
            time: formatRelativeDay(item.lastUpdated.toISOString()),
            type: "inventory",
            isRead: false,
            link: "/pharmacist/inventory",
          });
        }
      }
    } else if (profile.role === "ADMIN") {
      // 1. System wide pending prescriptions
      const pendingRx = await prisma.prescription.count({ where: { status: "PENDING" } });
      if (pendingRx > 0) {
        notifications.push({
          id: "admin-pending-rx",
          title: "Antrean Resep Jaringan",
          message: `Total ${pendingRx} resep pasien menunggu verifikasi di jaringan apotek.`,
          time: "Live data",
          type: "prescription",
          isRead: false,
          link: "/pharmacist/prescriptions",
        });
      }

      // 2. Out of stock inventory alert across all branches
      const outOfStockCount = await prisma.inventory.count({
        where: { quantity: 0 },
      });

      if (outOfStockCount > 0) {
        notifications.push({
          id: "admin-out-stock",
          title: "Peringatan Stok Kritis",
          message: `Ditemukan ${outOfStockCount} item obat berstatus stok 0 (habis) di cabang apotek.`,
          time: "Live data",
          type: "inventory",
          isRead: false,
          link: "/admin/pharmacies",
        });
      }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}
