create extension if not exists pgcrypto;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  domain text unique not null,
  name text,
  platform text not null default 'shopify',
  homepage_url text,
  logo_url text,
  description text,
  country text,
  source text not null default 'crawler',
  source_first_detected_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  estimated_launch_at timestamptz,
  discovery_score integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','inactive')),
  claimed boolean not null default false,
  shopify_verified boolean not null default false,
  raw_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_status_idx on public.stores(status);
create index if not exists stores_first_seen_idx on public.stores(first_seen_at desc);
create index if not exists stores_score_idx on public.stores(discovery_score desc);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  external_id text,
  handle text,
  title text not null,
  price numeric(12,2),
  currency text,
  image_url text,
  product_url text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  unique(store_id, product_url)
);

create index if not exists products_store_idx on public.products(store_id);
create index if not exists products_first_seen_idx on public.products(first_seen_at desc);

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  candidates_found integer not null default 0,
  stores_verified integer not null default 0,
  products_found integer not null default 0,
  errors jsonb not null default '[]'::jsonb
);

create table if not exists public.outbound_clicks (
  id bigint generated always as identity primary key,
  store_id uuid references public.stores(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.outbound_clicks enable row level security;

create policy if not exists "public approved stores" on public.stores
for select using (status = 'approved');

create policy if not exists "public approved products" on public.products
for select using (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id and s.status = 'approved'
  )
);
