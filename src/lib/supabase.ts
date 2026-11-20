import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const SUPABASE_CONFIG_KEY = 'muggy_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'local' | 'none';
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: String(parsed.url).trim(),
          anonKey: String(parsed.anonKey).trim(),
          source: 'local',
        };
      }
    }
  } catch {
    // Ignorar error de lectura
  }

  return { url: '', anonKey: '', source: 'none' };
}

let cachedClient: SupabaseClient | null = null;
let cachedKeySignature = '';

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    cachedClient = null;
    cachedKeySignature = '';
    return null;
  }

  const signature = `${cfg.url}|${cfg.anonKey}`;
  if (!cachedClient || cachedKeySignature !== signature) {
    cachedClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'muggy_supabase_auth_session',
      },
    });
    cachedKeySignature = signature;
  }

  return cachedClient;
}

export function saveLocalSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(
    SUPABASE_CONFIG_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  cachedClient = null;
  cachedKeySignature = '';
}

export function clearLocalSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  cachedClient = null;
  cachedKeySignature = '';
}

export const SUPABASE_SQL_SCHEMA = `-- MUGGY DASHBOARD — Tablas, Seguridad (RLS) y Tiempo Real
create table if not exists public.muggy_products (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  category text not null,
  unit_price numeric not null default 0,
  unit_cost numeric not null default 0,
  active boolean not null default true,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.muggy_packaging (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  unit_cost numeric not null default 0,
  active boolean not null default true,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.muggy_sales (
  user_id uuid not null default auth.uid(),
  id text not null,
  sale_date text not null,
  client_name text not null default '',
  product_name text not null,
  quantity integer not null default 1,
  total_revenue numeric not null default 0,
  net_profit numeric not null default 0,
  order_status text not null default 'En producción',
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.muggy_clients (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  phone text not null default '',
  instagram text not null default '',
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.muggy_ephemerides (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  category text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.muggy_workspace_config (
  user_id uuid primary key default auth.uid(),
  goals jsonb not null,
  settings jsonb not null,
  show_demo_data boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.muggy_products enable row level security;
alter table public.muggy_packaging enable row level security;
alter table public.muggy_sales enable row level security;
alter table public.muggy_clients enable row level security;
alter table public.muggy_ephemerides enable row level security;
alter table public.muggy_workspace_config enable row level security;

drop policy if exists "Muggy owner access products" on public.muggy_products;
create policy "Muggy owner access products" on public.muggy_products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Muggy owner access packaging" on public.muggy_packaging;
create policy "Muggy owner access packaging" on public.muggy_packaging
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Muggy owner access sales" on public.muggy_sales;
create policy "Muggy owner access sales" on public.muggy_sales
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Muggy owner access clients" on public.muggy_clients;
create policy "Muggy owner access clients" on public.muggy_clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Muggy owner access ephemerides" on public.muggy_ephemerides;
create policy "Muggy owner access ephemerides" on public.muggy_ephemerides
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Muggy owner access config" on public.muggy_workspace_config;
create policy "Muggy owner access config" on public.muggy_workspace_config
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
declare
  t text;
  tables text[] := array[
    'muggy_products',
    'muggy_packaging',
    'muggy_sales',
    'muggy_clients',
    'muggy_ephemerides',
    'muggy_workspace_config'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;`;
