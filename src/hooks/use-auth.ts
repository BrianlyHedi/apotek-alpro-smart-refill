"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/generated/prisma";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  pharmacyId: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

/// Hook wrapper untuk Supabase Auth session + user profile dari tabel users
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("id, email, name, role, phone, pharmacy_id")
        .eq("id", authUser.id)
        .single();

      if (fetchError) throw fetchError;

      setUser({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        phone: data.phone,
        pharmacyId: data.pharmacy_id,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat profil user"
      );
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      setSupabaseUser(authUser);
      if (authUser) {
        fetchUserProfile(authUser).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;
      setSupabaseUser(authUser);

      if (authUser) {
        fetchUserProfile(authUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  }, []);

  return { user, supabaseUser, isLoading, error, signOut };
}
