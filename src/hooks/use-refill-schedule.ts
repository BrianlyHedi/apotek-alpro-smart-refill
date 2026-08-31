"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatRelativeDay } from "@/lib/utils/format-date";

export interface RefillScheduleItem {
  id: string;
  userId: string;
  frequencyDays: number;
  nextRefillDate: Date;
  lastRefillDate: Date | null;
  isActive: boolean;
  daysUntilRefill: string;
  medicine: {
    id: string;
    name: string;
    dosageForm: string;
    price: number;
  };
}

interface UseRefillScheduleReturn {
  schedules: RefillScheduleItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/// Hook untuk fetch dan manage refill schedules pasien
export function useRefillSchedule(userId?: string): UseRefillScheduleReturn {
  const [schedules, setSchedules] = useState<RefillScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("refill_schedules")
        .select(
          `
          id, user_id, frequency_days, next_refill_date, last_refill_date, is_active,
          medicines(id, name, dosage_form, price)
        `
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("next_refill_date", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: RefillScheduleItem[] = (data ?? []).map(
        (item: Record<string, unknown>) => {
          const medicine = item.medicines as Record<string, unknown>;

          return {
            id: item.id as string,
            userId: item.user_id as string,
            frequencyDays: item.frequency_days as number,
            nextRefillDate: new Date(item.next_refill_date as string),
            lastRefillDate: item.last_refill_date
              ? new Date(item.last_refill_date as string)
              : null,
            isActive: item.is_active as boolean,
            daysUntilRefill: formatRelativeDay(
              item.next_refill_date as string
            ),
            medicine: {
              id: medicine.id as string,
              name: medicine.name as string,
              dosageForm: medicine.dosage_form as string,
              price: medicine.price as number,
            },
          };
        }
      );

      setSchedules(mapped);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat jadwal refill"
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => void fetchSchedules());
  }, [fetchSchedules]);

  return { schedules, isLoading, error, refetch: fetchSchedules };
}
