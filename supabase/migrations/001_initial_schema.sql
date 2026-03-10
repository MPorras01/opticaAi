-- Enable UUID generation helpers.
create extension if not exists pgcrypto;

-- profiles: extends auth.users with customer/admin profile data.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  address text,
  city text default 'Colombia',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categories: product grouping catalog for frames and sunglasses.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- products: eyewear catalog entries with stock, pricing and AR metadata.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text unique not null,
  description text,
  price numeric(12, 2) not null,
  compare_at_price numeric(12, 2),
  stock integer not null default 0,
  brand text,
  color text,
  material text check (material in ('acetato', 'metal', 'titanio', 'madera', 'plastico', 'mixto')),
  frame_shape text check (frame_shape in ('redonda', 'cuadrada', 'rectangular', 'aviador', 'cat-eye', 'hexagonal', 'ovalada')),
  gender text check (gender in ('hombre', 'mujer', 'unisex', 'niños')),
  is_active boolean not null default true,
  has_ar_overlay boolean not null default false,
  images text[] not null default '{}',
  ar_overlay_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stock >= 0),
  check (price >= 0),
  check (compare_at_price is null or compare_at_price >= 0)
);

-- orders: customer purchases and operational lifecycle tracking.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled')),
  subtotal numeric(12, 2) not null,
  total numeric(12, 2) not null,
  notes text,
  prescription_url text,
  wompi_tx_id text unique,
  wompi_status text,
  payment_method text,
  delivery_type text not null default 'pickup' check (delivery_type in ('pickup', 'delivery')),
  delivery_address text,
  channel text not null default 'web' check (channel in ('web', 'whatsapp', 'presencial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (subtotal >= 0),
  check (total >= 0)
);

-- order_items: immutable line items for each order with lens details.
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_image text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) generated always as ((quantity::numeric * unit_price)) stored,
  lens_type text check (lens_type in ('sin-lente', 'monofocal', 'bifocal', 'progresivo', 'solar')),
  lens_notes text,
  check (unit_price >= 0)
);

-- prescriptions: stored medical formulas linked to customers and orders.
create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  image_url text not null,
  issued_date date,
  doctor_name text,
  od_sphere numeric(5, 2),
  od_cylinder numeric(5, 2),
  od_axis integer check (od_axis between 0 and 180),
  os_sphere numeric(5, 2),
  os_cylinder numeric(5, 2),
  os_axis integer check (os_axis between 0 and 180),
  pd numeric(5, 2),
  add_power numeric(5, 2),
  notes text,
  created_at timestamptz not null default now()
);

-- Shared trigger function to maintain updated_at columns.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep updated_at in sync for profile updates.
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at();

-- Keep updated_at in sync for product updates.
drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.update_updated_at();

-- Keep updated_at in sync for order updates.
drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.update_updated_at();

-- Generate sequential order numbers as OPT-YYYY-XXXX.
create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
declare
  current_year text := to_char(now(), 'YYYY');
  next_sequence integer;
begin
  if new.order_number is not null and new.order_number <> '' then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('public.orders.order_number.' || current_year));

  select coalesce(
    max((regexp_match(order_number, '^OPT-' || current_year || '-(\d{4})$'))[1]::integer),
    0
  ) + 1
  into next_sequence
  from public.orders;

  new.order_number := format('OPT-%s-%s', current_year, lpad(next_sequence::text, 4, '0'));
  return new;
end;
$$;

-- Assign order_number before inserting an order.
drop trigger if exists trg_orders_generate_order_number on public.orders;
create trigger trg_orders_generate_order_number
before insert on public.orders
for each row
execute function public.generate_order_number();

-- Enable row level security in all domain tables.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.prescriptions enable row level security;
