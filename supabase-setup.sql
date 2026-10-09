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
-- Orders are inserted only by the SECURITY DEFINER place_order RPC.
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

DROP POLICY IF EXISTS "anyone_insert_orders" ON public.orders;

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


-- ── 5. Product reviews ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  avatar       TEXT,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text  TEXT NOT NULL CHECK (char_length(review_text) BETWEEN 1 AND 2000),
  images       TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.product_reviews SET images = '{}' WHERE images IS NULL;
ALTER TABLE public.product_reviews ALTER COLUMN images SET DEFAULT '{}';
ALTER TABLE public.product_reviews ALTER COLUMN images SET NOT NULL;

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS product_reviews_one_per_user
  ON public.product_reviews (product_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_reviews_product_created
  ON public.product_reviews (product_id, created_at DESC);

-- Replace any legacy review policies so an older permissive setup cannot survive.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'product_reviews'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.product_reviews', policy_record.policyname);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "public read product reviews" ON public.product_reviews;
CREATE POLICY "public read product reviews"
  ON public.product_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authenticated create own review" ON public.product_reviews;
CREATE POLICY "authenticated create own review"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND rating BETWEEN 1 AND 5
    AND char_length(display_name) BETWEEN 1 AND 80
    AND char_length(review_text) BETWEEN 1 AND 2000
    AND COALESCE(array_length(images, 1), 0) <= 3
  );

DROP POLICY IF EXISTS "owners and admins delete reviews" ON public.product_reviews;
CREATE POLICY "owners and admins delete reviews"
  ON public.product_reviews FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- ── 6. Private order tracking ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.track_order(
  p_id TEXT,
  p_contact TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact TEXT := LOWER(BTRIM(p_contact));
  v_phone_digits TEXT := regexp_replace(p_contact, '[^0-9]', '', 'g');
  v_result JSONB;
BEGIN
  IF char_length(BTRIM(p_id)) < 6 OR char_length(v_contact) < 5 THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(o) INTO v_result
  FROM public.orders o
  WHERE UPPER(o.id) = UPPER(BTRIM(p_id))
    AND (
      (position('@' IN v_contact) > 1 AND LOWER(o.email) = v_contact)
      OR (
        char_length(v_phone_digits) >= 10
        AND regexp_replace(o.phone, '[^0-9]', '', 'g') = v_phone_digits
      )
    )
  LIMIT 1;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.track_order(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon, authenticated;


-- ── 7. place_order RPC ────────────────────────────────────────────
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
  v_ref                RECORD;
  v_product            JSONB;
  v_stock              JSONB;
  v_stock_key          TEXT;
  v_available_stock    INTEGER;
  v_any_stock          BOOLEAN;
  v_unit_price         INTEGER;
  v_discount_percent   INTEGER;
  v_subtotal           INTEGER := 0;
  v_shipping           INTEGER;
  v_shipping_config    JSONB;
  v_free_threshold     INTEGER := 5000;
  v_shipping_cost      INTEGER := 200;
  v_cod_fee            INTEGER := 0;
  v_discount           INTEGER := 0;
  v_total              INTEGER;
  v_items              JSONB := '[]'::JSONB;
  v_coupon             public.coupons%ROWTYPE;
BEGIN
  IF NULLIF(BTRIM(p_name), '') IS NULL
     OR NULLIF(BTRIM(p_phone), '') IS NULL
     OR NULLIF(BTRIM(p_address), '') IS NULL
     OR NULLIF(BTRIM(p_city), '') IS NULL THEN
    RAISE EXCEPTION 'Missing required customer details';
  END IF;

  IF jsonb_typeof(p_item_refs) <> 'array'
     OR jsonb_array_length(p_item_refs) = 0
     OR jsonb_array_length(p_item_refs) > 20 THEN
    RAISE EXCEPTION 'Order must contain between 1 and 20 line items';
  END IF;

  -- Recompute discounted prices and validate selections from trusted product data.
  FOR v_ref IN
    SELECT
      elem->>'id' AS pid,
      (elem->>'qty')::INTEGER AS qty,
      NULLIF(BTRIM(elem->>'color'), '') AS color,
      NULLIF(BTRIM(elem->>'caseSize'), '') AS case_size,
      NULLIF(BTRIM(elem->>'strap'), '') AS strap
    FROM jsonb_array_elements(p_item_refs) AS elem
  LOOP
    IF v_ref.qty < 1 OR v_ref.qty > 20 THEN
      RAISE EXCEPTION 'Quantity must be between 1 and 20';
    END IF;

    SELECT data INTO v_product
    FROM public.products
    WHERE id = v_ref.pid
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_ref.pid;
    END IF;

    IF COALESCE((v_product->>'inStock')::BOOLEAN, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Product is out of stock: %', v_ref.pid;
    END IF;

    IF v_ref.case_size IS NULL OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_product->'caseSizeOptions', '[]'::JSONB)) AS option(value)
      WHERE value = v_ref.case_size
    ) THEN
      RAISE EXCEPTION 'Invalid case size for product: %', v_ref.pid;
    END IF;

    IF v_ref.strap IS NULL OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(COALESCE(v_product->'strapOptions', '[]'::JSONB)) AS option(value)
      WHERE value = v_ref.strap
    ) THEN
      RAISE EXCEPTION 'Invalid strap for product: %', v_ref.pid;
    END IF;

    IF jsonb_array_length(COALESCE(v_product->'colorVariants', '[]'::JSONB)) > 0 THEN
      IF v_ref.color IS NULL OR NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_product->'colorVariants') AS variant
        WHERE variant->>'color' = v_ref.color
      ) THEN
        RAISE EXCEPTION 'Invalid color for product: %', v_ref.pid;
      END IF;
    ELSE
      v_ref.color := NULL;
    END IF;

    -- Optional tracked inventory. A specific variant key wins; otherwise
    -- "default" acts as shared stock for every color/case/strap combination.
    v_stock := CASE
      WHEN jsonb_typeof(v_product->'stock') = 'object' THEN v_product->'stock'
      ELSE '{}'::JSONB
    END;
    v_stock_key := NULL;

    IF v_stock ? CONCAT(COALESCE(v_ref.color, 'default'), '::', v_ref.case_size, '::', v_ref.strap) THEN
      v_stock_key := CONCAT(COALESCE(v_ref.color, 'default'), '::', v_ref.case_size, '::', v_ref.strap);
    ELSIF v_stock ? 'default' THEN
      v_stock_key := 'default';
    END IF;

    IF v_stock_key IS NOT NULL THEN
      v_available_stock := (v_stock->>v_stock_key)::INTEGER;
      IF v_available_stock < v_ref.qty THEN
        RAISE EXCEPTION 'Insufficient stock for product: %', v_ref.pid;
      END IF;

      v_stock := jsonb_set(
        v_stock,
        ARRAY[v_stock_key],
        to_jsonb(v_available_stock - v_ref.qty),
        true
      );

      SELECT COALESCE(bool_or(value::INTEGER > 0), false)
      INTO v_any_stock
      FROM jsonb_each_text(v_stock)
      WHERE value ~ '^[0-9]+$';

      v_product := jsonb_set(v_product, '{stock}', v_stock, true);
      v_product := jsonb_set(v_product, '{inStock}', to_jsonb(v_any_stock), true);
    END IF;

    v_product := jsonb_set(
      v_product,
      '{unitsSold}',
      to_jsonb(COALESCE((v_product->>'unitsSold')::INTEGER, 0) + v_ref.qty),
      true
    );
    UPDATE public.products SET data = v_product WHERE id = v_ref.pid;

    v_discount_percent := GREATEST(0, LEAST(100, COALESCE((v_product->>'discountPercent')::INTEGER, 0)));
    v_unit_price := ROUND((v_product->>'codPrice')::INTEGER * (100 - v_discount_percent) / 100.0);
    v_subtotal   := v_subtotal + v_unit_price * v_ref.qty;
    v_items      := v_items || jsonb_build_array(jsonb_build_object(
      'name',     v_product->>'name',
      'qty',      v_ref.qty,
      'price',    v_unit_price,
      'color',    v_ref.color,
      'caseSize', v_ref.case_size,
      'strap',    v_ref.strap
    ));
  END LOOP;

  SELECT value INTO v_shipping_config
  FROM public.site_config
  WHERE key = 'shipping';

  IF v_shipping_config IS NOT NULL THEN
    v_free_threshold := GREATEST(0, COALESCE((v_shipping_config->>'threshold')::INTEGER, v_free_threshold));
    v_shipping_cost := GREATEST(0, COALESCE((v_shipping_config->>'cost')::INTEGER, v_shipping_cost));
  END IF;

  v_shipping := CASE WHEN v_subtotal >= v_free_threshold THEN 0 ELSE v_shipping_cost END;

  -- Lock, validate, and consume the coupon in this transaction.
  IF p_coupon_code IS NOT NULL AND p_coupon_code <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = p_coupon_code
    FOR UPDATE;

    IF NOT FOUND
       OR NOT v_coupon.active
       OR (v_coupon.expires IS NOT NULL AND v_coupon.expires < CURRENT_DATE)
       OR (v_coupon.coupon_limit > 0 AND v_coupon.used >= v_coupon.coupon_limit) THEN
      RAISE EXCEPTION 'Coupon is invalid, expired, or fully used';
    END IF;

    IF v_coupon.type = 'Percentage' THEN
      v_discount := ROUND(v_subtotal * v_coupon.value / 100.0);
    ELSE
      v_discount := LEAST(v_coupon.value, v_subtotal);
    END IF;

    UPDATE public.coupons SET used = v_coupon.used + 1 WHERE id = v_coupon.id;
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


-- ── 8. Email rate limits ──────────────────────────────────────────
-- Used only by the send-email Edge Function through service_role.

CREATE TABLE IF NOT EXISTS public.email_rate_limits (
  key               TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count     INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_email_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NULLIF(BTRIM(p_key), '') IS NULL
     OR p_limit < 1
     OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate-limit arguments';
  END IF;

  INSERT INTO public.email_rate_limits AS limits
    (key, window_started_at, request_count, updated_at)
  VALUES
    (p_key, v_now, 1, v_now)
  ON CONFLICT (key) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        THEN v_now
      ELSE limits.window_started_at
    END,
    request_count = CASE
      WHEN limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        THEN 1
      ELSE limits.request_count + 1
    END,
    updated_at = v_now
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_email_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_email_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;


-- ── 9. Newsletter subscribers ─────────────────────────────────────
-- No public table policies: subscriptions are written only by the
-- rate-limited send-email Edge Function through service_role.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  active        BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT newsletter_email_normalized CHECK (email = LOWER(BTRIM(email))),
  CONSTRAINT newsletter_email_length CHECK (char_length(email) BETWEEN 5 AND 254)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;


-- ── 10. Audit log ─────────────────────────────────────────────────
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


-- ── 11. Storage bucket for product images ────────────────────────
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

-- Signed-in customers may upload only inside their own reviews/{user-id}/ folder.
DO $$ BEGIN
  CREATE POLICY "customers_upload_own_review_images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'product-images'
      AND (storage.foldername(name))[1] = 'reviews'
      AND (storage.foldername(name))[2] = auth.uid()::TEXT
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "customers_delete_own_review_images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'product-images'
      AND (storage.foldername(name))[1] = 'reviews'
      AND (storage.foldername(name))[2] = auth.uid()::TEXT
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
