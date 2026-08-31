import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import type { User } from "@supabase/supabase-js";
import type { User as PrismaUser, Pharmacy } from "@/generated/prisma";

export type UserProfileWithPharmacy = PrismaUser & {
  pharmacy: Pharmacy | null;
};

/**
 * Mengambil session auth user yang sedang login dengan caching per request.
 * Menghindari pemanggilan berulang ke Supabase Auth API dalam satu siklus render.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Mengambil profil lengkap user dari Prisma database dengan caching per request.
 * Dipanggil bersamaan di Layout dan Page tanpa duplikasi query database.
 */
export const getCurrentUserProfile = cache(
  async (): Promise<UserProfileWithPharmacy | null> => {
    const user = await getAuthUser();
    if (!user) return null;

    return prisma.user.findUnique({
      where: { id: user.id },
      include: { pharmacy: true },
    });
  }
);
