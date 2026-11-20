-- ============================================================
-- MUGGY DASHBOARD — Esquema de Base de Datos en Supabase
-- Pegar y ejecutar en el SQL Editor de tu proyecto en Supabase
-- ============================================================

-- 1. Productos y su historial de precios/costos
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

-- 2. Componentes de Packaging (Caja estuche, sticker, tarjeta, etc.)
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

-- 3. Ventas con Snapshot Histórico de Costos y Packaging
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

-- 4. Agenda de Clientes
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

-- 5. Efemérides y Oportunidades Comerciales
create table if not exists public.muggy_ephemerides (
  user_id uuid not null default auth.uid(),
  id text not null,
  name text not null,
  category text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- 6. Configuración General y Objetivos de Muggy
create table if not exists public.muggy_workspace_config (
  user_id uuid primary key default auth.uid(),
  goals jsonb not null,
  settings jsonb not null,
  show_demo_data boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Habilitar Seguridad por Fila (RLS): Solo el dueño autenticado accede a sus datos
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

-- Habilitar Sincronización en Tiempo Real (Realtime) entre PC y Celular
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
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
