-- StarkBuy Phase 2: database completeness
-- Run once after phase1_security_money_migration.sql.

BEGIN;

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

-- Replace place_order with row locking and optional tracked-stock decrement.
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

-- Customers can only manage review images in reviews/{their-user-id}/.
DROP POLICY IF EXISTS "customers_upload_own_review_images" ON storage.objects;
CREATE POLICY "customers_upload_own_review_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'reviews'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "customers_delete_own_review_images" ON storage.objects;
CREATE POLICY "customers_delete_own_review_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'reviews'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

COMMIT;
