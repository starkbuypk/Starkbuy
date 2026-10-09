-- StarkBuy Phase 1: security and order money correctness
-- Run once in Supabase SQL Editor before deploying the updated frontend/Edge Function.

begin;

-- Storefront config remains publicly readable but only DB-confirmed admins can write.
drop policy if exists "anon write site_config" on public.site_config;
drop policy if exists "admin manage site_config" on public.site_config;
create policy "admin manage site_config"
  on public.site_config for all
  using (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

-- Anonymous clients must use place_order; direct inserts are no longer permitted.
drop policy if exists "anyone_insert_orders" on public.orders;

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

    SELECT data INTO v_product FROM public.products WHERE id = v_ref.pid;
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

-- Durable Edge Function rate limits. RLS has no client policies; only service_role can execute the RPC.
create table if not exists public.email_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.email_rate_limits enable row level security;

create or replace function public.consume_email_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_now timestamptz := now();
begin
  if nullif(btrim(p_key), '') is null
     or p_limit < 1
     or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit arguments';
  end if;

  insert into public.email_rate_limits as limits
    (key, window_started_at, request_count, updated_at)
  values
    (p_key, v_now, 1, v_now)
  on conflict (key) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    updated_at = v_now
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_email_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_email_rate_limit(text, integer, integer) to service_role;

commit;
