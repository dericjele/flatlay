-- FlatLay validation gate schema
-- Run in Supabase dashboard: SQL Editor → New query

-- ─── flatlay_leads ────────────────────────────────────────────────────────────
create table flatlay_leads (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid references auth.users(id) on delete set null,
  full_name        text not null,
  email            text not null unique,
  email_normalized text not null unique,
  email_verified   boolean not null default false,
  use_case         text not null
    check (use_case in ('goodie-bags','gift-boxes','subscription-box','general-ecom','other')),
  use_case_other   text,
  platform         text not null
    check (platform in ('shopify','etsy','instagram','tiktok','none','other')),
  platform_other   text,
  monthly_photos   text not null
    check (monthly_photos in ('<10','10-50','50-200','200+')),
  consent          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── flatlay_usage ────────────────────────────────────────────────────────────
create table flatlay_usage (
  id          uuid primary key default gen_random_uuid(),
  email       text,
  client_id   text not null,
  ip_hash     text not null,
  action      text not null default 'remove-bg',
  shadow_mode text,
  success     boolean not null,
  created_at  timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index flatlay_usage_ip_day
  on flatlay_usage (ip_hash, created_at desc)
  where email is null;

create index flatlay_usage_client_day
  on flatlay_usage (client_id, created_at desc)
  where email is null;

create index flatlay_usage_email_day
  on flatlay_usage (email, created_at desc)
  where email is not null;

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table flatlay_leads enable row level security;
alter table flatlay_usage  enable row level security;

-- Service role key bypasses RLS — no client can read/write directly