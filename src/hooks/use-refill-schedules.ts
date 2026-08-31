"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/providers/toast-provider";

export interface RefillScheduleItem {
  id: string;
  userId: string;
  medicineId: string;
  frequencyDays: number;
  lastRefillDate: string | null;
  nextRefillDate: string;
  isActive: boolean;
  medicine: {
    id: string;
    name: string;
    category: string;
    price: number;
    dosageForm: string;
    manufacturer: string;
  };
}

export function useRefillSchedules(initialSchedules: RefillScheduleItem[]) {
  const [schedules, setSchedules] = useState<RefillScheduleItem[]>(initialSchedules);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { addToast } = useToast();

  const toggleStatus = useCallback(async (id: string, newStatus: boolean) => {
    setIsUpdating(id);
    // Optimistic update
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: newStatus } : s))
    );

    try {
      const res = await fetch(`/api/refills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status jadwal refill");
      }

      addToast(
        "success",
        newStatus
          ? "Jadwal refill berhasil diaktifkan kembali"
          : "Jadwal refill berhasil dinonaktifkan (dijeda)"
      );
    } catch (err) {
      // Rollback on error
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !newStatus } : s))
      );
      addToast("error", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsUpdating(null);
    }
  }, [addToast]);

  return {
    schedules,
    isUpdating,
    toggleStatus,
  };
}
