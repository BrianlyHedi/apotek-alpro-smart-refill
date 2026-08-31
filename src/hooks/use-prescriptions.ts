"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { PrescriptionStatus } from "@/generated/prisma";
import type { PrescriptionWithItems } from "@/types/prescription";

interface UsePrescriptionsOptions {
  userId?: string;
  status?: PrescriptionStatus;
}

interface UsePrescriptionsReturn {
  prescriptions: PrescriptionWithItems[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/// Hook untuk fetch prescriptions dengan filter status dan userId
export function usePrescriptions(
  options: UsePrescriptionsOptions = {}
): UsePrescriptionsReturn {
  const { userId, status } = options;
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithItems[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setError(null);
      let query = supabase
        .from("prescriptions")
        .select(
          `
          id, user_id, image_url, status, notes, expires_at, created_at, updated_at,
          users!prescriptions_user_id_fkey(id, name, email),
          prescription_items(
            id, quantity, dosage_instruction,
            medicines(id, name, category, dosage_form, manufacturer, price)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (userId) query = query.eq("user_id", userId);
      if (status) query = query.eq("status", status);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const mapped: PrescriptionWithItems[] = (data ?? []).map(
        (item: Record<string, unknown>) => {
          const patient = item.users as Record<string, unknown>;
          const items = item.prescription_items as Record<string, unknown>[];

          return {
            id: item.id as string,
            userId: item.user_id as string,
            imageUrl: item.image_url as string | null,
            status: item.status as PrescriptionStatus,
            notes: item.notes as string | null,
            expiresAt: item.expires_at
              ? new Date(item.expires_at as string)
              : null,
            createdAt: new Date(item.created_at as string),
            updatedAt: new Date(item.updated_at as string),
            patient: {
              id: patient.id as string,
              name: patient.name as string,
              email: patient.email as string,
            },
            verifiedBy: null,
            items: items.map((rxItem) => {
              const medicine = rxItem.medicines as Record<string, unknown>;
              return {
                id: rxItem.id as string,
                quantity: rxItem.quantity as number,
                dosageInstruction: rxItem.dosage_instruction as string,
                medicine: {
                  id: medicine.id as string,
                  name: medicine.name as string,
                  category: medicine.category as string,
                  dosageForm: medicine.dosage_form as string,
                  manufacturer: medicine.manufacturer as string,
                  price: medicine.price as number,
                },
              };
            }),
          };
        }
      );

      setPrescriptions(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data resep");
    } finally {
      setIsLoading(false);
    }
  }, [userId, status]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  return { prescriptions, isLoading, error, refetch: fetchPrescriptions };
}
