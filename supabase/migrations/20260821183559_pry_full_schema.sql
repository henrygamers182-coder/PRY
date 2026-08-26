/*
# PRY Platform - Clean Rebuild

Drops the old incompatible tables (packages, orders, codes) from the previous
partial attempt and creates the complete proper schema.
*/

-- Drop old tables (they have no real data yet - 0 rows in orders/codes)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS codes CASCADE;
DROP TABLE IF EXISTS packages CASCADE;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration_hours integer NOT NULL DEFAULT 24,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_select" ON plans;
CREATE POLICY "plans_select" ON plans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "plans_insert" ON plans;
CREATE POLICY "plans_insert" ON plans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "plans_update" ON plans;
CREATE POLICY "plans_update" ON plans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plans_delete" ON plans;
CREATE POLICY "plans_delete" ON plans FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment','proof_sent','under_review','approved','rejected','code_delivered','expired','cancelled')),
  payment_proof_url text,
  access_code_id uuid,
  activated_at timestamptz,
  expires_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_delete" ON orders;
CREATE POLICY "orders_delete" ON orders FOR DELETE
  TO authenticated USING (false);

-- Order number sequence
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  next_val bigint;
  date_part text;
  order_num text;
BEGIN
  next_val := nextval('order_number_seq');
  date_part := to_char(now(), 'YYYYMMDD');
  order_num := 'PRY-' || date_part || '-' || lpad(next_val::text, 5, '0');
  RETURN order_num;
END;
$$;

-- ============================================================
-- ACCESS CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','reserved','delivered','used','expired','blocked')),
  order_id uuid,
  user_id uuid,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "codes_select" ON access_codes;
CREATE POLICY "codes_select" ON access_codes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "codes_insert" ON access_codes;
CREATE POLICY "codes_insert" ON access_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "codes_update" ON access_codes;
CREATE POLICY "codes_update" ON access_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "codes_delete" ON access_codes;
CREATE POLICY "codes_delete" ON access_codes FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL DEFAULT 'system',
  actor_id uuid,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  TO authenticated USING (false);

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert" ON settings;
CREATE POLICY "settings_insert" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "settings_delete" ON settings;
CREATE POLICY "settings_delete" ON settings FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- APPROVE ORDER FUNCTION (SECURITY DEFINER - atomic code assignment)
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_order(
  p_order_id uuid,
  p_admin_id text DEFAULT 'admin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_code RECORD;
  v_plan_duration integer;
  v_expires_at timestamptz;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF v_order.status NOT IN ('proof_sent', 'under_review', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não pode ser aprovado no status atual');
  END IF;

  IF v_order.access_code_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este pedido já possui um código associado');
  END IF;

  -- Lock an available code atomically
  SELECT * INTO v_code FROM access_codes
    WHERE status = 'available'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum código disponível no estoque');
  END IF;

  SELECT duration_hours INTO v_plan_duration FROM plans WHERE id = v_order.plan_id;
  v_expires_at := now() + COALESCE(v_plan_duration, 24) * interval '1 hour';

  UPDATE access_codes SET
    status = 'delivered',
    order_id = p_order_id,
    user_id = v_order.user_id,
    activated_at = now(),
    expires_at = v_expires_at
  WHERE id = v_code.id;

  UPDATE orders SET
    status = 'code_delivered',
    access_code_id = v_code.id,
    activated_at = now(),
    expires_at = v_expires_at,
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO audit_logs (actor_type, actor_id, action, metadata)
  VALUES ('admin', NULL, 'order_approved', jsonb_build_object(
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'code_id', v_code.id,
    'admin', p_admin_id,
    'expires_at', v_expires_at
  ));

  RETURN jsonb_build_object(
    'success', true,
    'code', v_code.code,
    'expires_at', v_expires_at,
    'order_number', v_order.order_number
  );
END;
$$;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO plans (name, description, price, duration_hours, is_active, is_featured, sort_order)
SELECT * FROM (VALUES
  ('1 Dia',  'Acesso completo por 24 horas',  19.99::numeric, 24,  true, true,  1),
  ('3 Dias', 'Acesso completo por 3 dias',    49.99::numeric, 72,  true, false, 2),
  ('7 Dias', 'Acesso completo por 7 dias',    89.99::numeric, 168, true, false, 3)
) AS v(name, description, price, duration_hours, is_active, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM plans LIMIT 1);

INSERT INTO settings (key, value)
SELECT 'pix_key', '11273590961'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'pix_key');

INSERT INTO settings (key, value)
SELECT 'discord_url', 'https://discord.gg/e2pArCHT4P'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'discord_url');

INSERT INTO settings (key, value)
SELECT 'platform_name', 'PRY'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'platform_name');

INSERT INTO settings (key, value)
SELECT 'support_email', 'suporte@pry.com'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'support_email');
