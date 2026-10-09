-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates the site_config table used for categories and other global admin settings

create table if not exists site_config (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Allow anyone to read config (public storefront needs categories)
alter table site_config enable row level security;

create policy "public read site_config"
  on site_config for select
  using (true);

-- Only database-confirmed admins may change storefront configuration.
drop policy if exists "anon write site_config" on site_config;
drop policy if exists "admin manage site_config" on site_config;
create policy "admin manage site_config"
  on site_config for all
  using (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));
