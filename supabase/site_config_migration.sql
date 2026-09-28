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

-- Allow anon writes (admin panel is password-protected at app level)
create policy "anon write site_config"
  on site_config for all
  using (true)
  with check (true);
