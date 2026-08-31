-- Fix Infinite Recursion in RLS

-- Hapus policy yang bermasalah
DROP POLICY IF EXISTS "Staff can view all users" ON users;

-- Buat fungsi security definer (berjalan dengan hak akses penuh / bypass RLS)
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Buat ulang policy dengan menggunakan fungsi tersebut
CREATE POLICY "Staff can view all users"
  ON users FOR SELECT
  USING (
    get_auth_user_role() IN ('PHARMACIST', 'ADMIN')
  );
