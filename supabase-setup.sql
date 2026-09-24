-- ═══════════════════════════════════════════════════════════════
-- StarkBuy — Supabase Database Setup
-- Run this entire script in the Supabase SQL Editor once.
-- Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. User roles ─────────────────────────────────────────────────
-- Stores which users have admin access.
-- Only service_role (Supabase SQL editor) can insert roles.
-- Users can read only their own role.

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'customer'
             CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users may read only their own role row
CREATE POLICY "users_read_own_role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts/updates only via service_role (Supabase SQL editor — never from client)


-- ── 2. Orders ─────────────────────────────────────────────────────
-- All COD orders placed on the store.
-- Anyone (including anonymous customers) can INSERT.
-- Only admin can SELECT / UPDATE / DELETE.

CREATE TABLE IF NOT EXISTS public.orders (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT NOT NULL DEFAULT '',
  address    TEXT NOT NULL,
  city       TEXT NOT NULL,
  items      JSONB NOT NULL DEFAULT '[]',
  subtotal   INTEGER NOT NULL DEFAULT 0,
  shipping   INTEGER NOT NULL DEFAULT 0,
  cod_fee    INTEGER NOT NULL DEFAULT 0,
  total      INTEGER NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'Processing'
             CHECK (status IN ('Processing', 'Dispatched', 'Delivered', 'Cancelled')),
  date       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers (even anonymous) can place orders
CREATE POLICY "anyone_insert_orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Only admin can read all orders
CREATE POLICY "admin_select_orders"
  ON public.orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Only admin can update order status
CREATE POLICY "admin_update_orders"
  ON public.orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Only admin can delete orders
CREATE POLICY "admin_delete_orders"
  ON public.orders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));


-- ── 3. Coupons ────────────────────────────────────────────────────
-- Discount codes managed by admin.
-- Checkout calls RPC functions (below) — no direct table access needed by anon users.

CREATE TABLE IF NOT EXISTS public.coupons (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL CHECK (type IN ('Percentage', 'Fixed')),
  value        INTEGER NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0,
  coupon_limit INTEGER NOT NULL DEFAULT 0,   -- 0 = unlimited
  active       BOOLEAN NOT NULL DEFAULT true,
  expires      DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Only admin can read coupons table directly
CREATE POLICY "admin_manage_coupons"
  ON public.coupons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Checkout uses these two secure RPCs instead of direct table access:

-- validate_coupon: anyone can call; returns coupon details if valid
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT)
RETURNS TABLE(
  code         TEXT,
  type         TEXT,
  value        INTEGER,
  used         INTEGER,
  coupon_limit INTEGER,
  active       BOOLEAN,
  expires      DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT c.code, c.type, c.value, c.used, c.coupon_limit, c.active, c.expires
  FROM public.coupons c
  WHERE c.code = p_code
    AND c.active = true
    AND (c.expires IS NULL OR c.expires >= CURRENT_DATE)
    AND (c.coupon_limit = 0 OR c.used < c.coupon_limit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon TO anon, authenticated;

-- use_coupon: atomically validates + increments usage counter
CREATE OR REPLACE FUNCTION public.use_coupon(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.coupons WHERE code = p_code FOR UPDATE;

  IF NOT FOUND OR NOT rec.active THEN
    RAISE EXCEPTION 'Coupon not found or inactive';
  END IF;

  IF rec.expires IS NOT NULL AND rec.expires < CURRENT_DATE THEN
    RAISE EXCEPTION 'Coupon has expired';
  END IF;

  IF rec.coupon_limit > 0 AND rec.used >= rec.coupon_limit THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;

  UPDATE public.coupons SET used = rec.used + 1 WHERE code = p_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_coupon TO anon, authenticated;


-- ── 4. Products ───────────────────────────────────────────────────
-- Catalog managed by admin; readable by everyone (storefront).

CREATE TABLE IF NOT EXISTS public.products (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous shoppers) can read products
CREATE POLICY "public_select_products"
  ON public.products FOR SELECT
  USING (true);

-- Only admin can insert, update, or delete products
CREATE POLICY "admin_manage_products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));


-- ── 5. place_order RPC ────────────────────────────────────────────
-- Server-side order placement: recomputes subtotal from the products
-- table so the client cannot inflate or deflate prices.
-- Also atomically applies the coupon (H1 + M2 fix).

CREATE OR REPLACE FUNCTION public.place_order(
  p_id          TEXT,
  p_name        TEXT,
  p_phone       TEXT,
  p_email       TEXT,
  p_address     TEXT,
  p_city        TEXT,
  p_date        TEXT,
  p_item_refs   JSONB,         -- [{"id": "...", "qty": N}]
  p_coupon_code TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref        RECORD;
  v_product    JSONB;
  v_unit_price INTEGER;
  v_subtotal   INTEGER := 0;
  v_shipping   INTEGER;
  v_cod_fee    INTEGER := 200;  -- default; migrate to DB config in H3
  v_discount   INTEGER := 0;
  v_total      INTEGER;
  v_items      JSONB := '[]'::JSONB;
  v_coupon     RECORD;
BEGIN
  -- Recompute subtotal from the products table (prevents price manipulation)
  FOR v_ref IN
    SELECT (elem->>'id') AS pid, (elem->>'qty')::INTEGER AS qty
    FROM jsonb_array_elements(p_item_refs) AS elem
  LOOP
    SELECT data INTO v_product FROM public.products WHERE id = v_ref.pid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_ref.pid;
    END IF;
    v_unit_price := (v_product->>'codPrice')::INTEGER;
    v_subtotal   := v_subtotal + v_unit_price * v_ref.qty;
    v_items      := v_items || jsonb_build_array(jsonb_build_object(
      'name',  v_product->>'name',
      'qty',   v_ref.qty,
      'price', v_unit_price * v_ref.qty
    ));
  END LOOP;

  v_shipping := CASE WHEN v_subtotal >= 2000 THEN 0 ELSE 200 END;

  -- Validate and atomically consume coupon (M2: happens inside same txn)
  IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
    SELECT * INTO v_coupon
    FROM public.validate_coupon(p_coupon_code)
    LIMIT 1;
    IF FOUND THEN
      IF v_coupon.type = 'Percentage' THEN
        v_discount := ROUND(v_subtotal * v_coupon.value / 100.0);
      ELSE
        v_discount := LEAST(v_coupon.value, v_subtotal);
      END IF;
      UPDATE public.coupons SET used = used + 1 WHERE code = p_coupon_code;
    END IF;
  END IF;

  v_total := v_subtotal - v_discount + v_shipping + v_cod_fee;

  INSERT INTO public.orders
    (id, name, phone, email, address, city, items,
     subtotal, shipping, cod_fee, total, status, date)
  VALUES
    (p_id, p_name, p_phone, p_email, p_address, p_city, v_items,
     v_subtotal, v_shipping, v_cod_fee, v_total, 'Processing', p_date);

  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'shipping', v_shipping,
    'cod_fee',  v_cod_fee,
    'discount', v_discount,
    'total',    v_total,
    'items',    v_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order TO anon, authenticated;


-- ── 6. Audit log ──────────────────────────────────────────────────
-- Admin action log. Only admin can read/write.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action     TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  entity     TEXT NOT NULL,
  detail     TEXT NOT NULL,
  actor      TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_audit_log"
  ON public.audit_log FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));


-- ── 7. Storage bucket for product images ─────────────────────────
-- Public bucket: anyone can view images, only admin can upload/delete.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read (view product images on storefront)
DO $$ BEGIN
  CREATE POLICY "public_read_product_images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admin can upload
DO $$ BEGIN
  CREATE POLICY "admin_upload_product_images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'product-images'
      AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admin can delete
DO $$ BEGIN
  CREATE POLICY "admin_delete_product_images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'product-images'
      AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════════════
-- FINAL STEP: Grant admin role to your account
-- ---------------------------------------------------------------
-- 1. Log in to your store with starkbuypk@gmail.com (Google OAuth)
-- 2. Come back here and run:
--
--    SELECT id, email FROM auth.users WHERE email = 'starkbuypk@gmail.com';
--
-- 3. Copy the UUID from the result, then run:
--
--    INSERT INTO public.user_roles (user_id, role)
--    VALUES ('<paste-uuid-here>', 'admin')
--    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
--
-- ═══════════════════════════════════════════════════════════════
