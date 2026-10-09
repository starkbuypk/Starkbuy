begin;

select plan(12);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.products'::regclass),
  'products has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.orders'::regclass),
  'orders has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.coupons'::regclass),
  'coupons has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.site_config'::regclass),
  'site_config has RLS enabled'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'public_select_products' and cmd = 'SELECT'),
  'anonymous catalog reads have an explicit policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'admin_manage_products'),
  'product mutations require the admin policy'
);
select ok(
  not exists(
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and cmd = 'SELECT'
      and coalesce(qual, '') in ('true', '(true)')
  ),
  'orders have no unconditional read policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'admin_select_orders' and cmd = 'SELECT'),
  'order reads require the admin policy'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'coupons' and policyname = 'admin_manage_coupons'),
  'coupon table access requires the admin policy'
);

select ok(
  (select prosecdef from pg_proc where oid = 'public.validate_coupon(text)'::regprocedure),
  'coupon validation is security definer'
);
select ok(
  has_function_privilege('anon', 'public.validate_coupon(text)', 'EXECUTE'),
  'anonymous checkout may execute coupon validation'
);
select ok(
  not exists(
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'coupons'
      and cmd = 'SELECT'
      and coalesce(qual, '') in ('true', '(true)')
  ),
  'coupon table has no unconditional read policy'
);

select * from finish();
rollback;
