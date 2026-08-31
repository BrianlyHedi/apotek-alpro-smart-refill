-- =============================================================================
-- Apotek Alpro — Row Level Security (RLS) Policies
-- Jalankan setelah Prisma migration: psql $DATABASE_URL -f prisma/rls-policies.sql
-- Atau paste di Supabase Dashboard → SQL Editor
-- =============================================================================

-- ============================================================
-- ENABLE RLS di semua tabel
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refill_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS — user bisa lihat data sendiri, admin/pharmacist bisa lihat semua
-- ============================================================

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('PHARMACIST', 'ADMIN')
    )
  );

-- ============================================================
-- PHARMACIES — semua authenticated user bisa lihat (public data)
-- ============================================================

CREATE POLICY "Anyone can view pharmacies"
  ON pharmacies FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage pharmacies"
  ON pharmacies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================================
-- MEDICINES — semua authenticated user bisa lihat (public catalog)
-- ============================================================

CREATE POLICY "Anyone can view medicines"
  ON medicines FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage medicines"
  ON medicines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================================
-- INVENTORY — semua bisa lihat (realtime stock check), staff bisa update
-- ============================================================

CREATE POLICY "Anyone can view inventory"
  ON inventory FOR SELECT
  USING (true);

CREATE POLICY "Staff can update inventory"
  ON inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('PHARMACIST', 'ADMIN')
    )
  );

CREATE POLICY "Admin can manage inventory"
  ON inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );

-- ============================================================
-- PRESCRIPTIONS — patient lihat milik sendiri, pharmacist lihat semua
-- ============================================================

CREATE POLICY "Patients can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can create prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pharmacists can view all prescriptions"
  ON prescriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('PHARMACIST', 'ADMIN')
    )
  );

CREATE POLICY "Pharmacists can update prescriptions"
  ON prescriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'PHARMACIST'
    )
  );

-- ============================================================
-- PRESCRIPTION_ITEMS — ikut policy parent (prescriptions)
-- ============================================================

CREATE POLICY "Users can view own prescription items"
  ON prescription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('PHARMACIST', 'ADMIN')
      ))
    )
  );

CREATE POLICY "Patients can insert prescription items"
  ON prescription_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prescriptions p
      WHERE p.id = prescription_id
      AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- ORDERS — patient lihat milik sendiri, staff lihat order cabangnya
-- ============================================================

CREATE POLICY "Patients can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can create orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view branch orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('PHARMACIST', 'ADMIN')
      AND u.pharmacy_id = pharmacy_id
    )
  );

CREATE POLICY "Staff can update branch orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('PHARMACIST', 'ADMIN')
      AND u.pharmacy_id = pharmacy_id
    )
  );

-- ============================================================
-- ORDER_ITEMS — ikut policy parent (orders)
-- ============================================================

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
      AND (o.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('PHARMACIST', 'ADMIN')
      ))
    )
  );

-- ============================================================
-- REFILL_SCHEDULES — patient lihat milik sendiri
-- ============================================================

CREATE POLICY "Patients can view own refill schedules"
  ON refill_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can manage own refill schedules"
  ON refill_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all refill schedules"
  ON refill_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('PHARMACIST', 'ADMIN')
    )
  );

-- ============================================================
-- DRUG_INTERACTIONS — semua bisa lihat (reference data)
-- ============================================================

CREATE POLICY "Anyone can view drug interactions"
  ON drug_interactions FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage drug interactions"
  ON drug_interactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ADMIN'
    )
  );
