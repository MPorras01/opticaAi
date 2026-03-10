-- Ensure RLS is enabled before creating policies.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.prescriptions enable row level security;

-- -------------------------
-- profiles policies
-- -------------------------
drop policy if exists "customers_select_own_profile" on public.profiles;
create policy "customers_select_own_profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "customers_update_own_profile" on public.profiles;
create policy "customers_update_own_profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "admins_full_access_profiles" on public.profiles;
create policy "admins_full_access_profiles"
on public.profiles
for all
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- -------------------------
-- categories policies
-- -------------------------
drop policy if exists "public_select_active_categories" on public.categories;
create policy "public_select_active_categories"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "admins_insert_categories" on public.categories;
create policy "admins_insert_categories"
on public.categories
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_update_categories" on public.categories;
create policy "admins_update_categories"
on public.categories
for update
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_delete_categories" on public.categories;
create policy "admins_delete_categories"
on public.categories
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- -------------------------
-- products policies
-- -------------------------
drop policy if exists "public_select_active_products" on public.products;
create policy "public_select_active_products"
on public.products
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "admins_insert_products" on public.products;
create policy "admins_insert_products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_update_products" on public.products;
create policy "admins_update_products"
on public.products
for update
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_delete_products" on public.products;
create policy "admins_delete_products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- -------------------------
-- orders policies
-- -------------------------
drop policy if exists "customers_select_own_orders" on public.orders;
create policy "customers_select_own_orders"
on public.orders
for select
to authenticated
using (auth.uid() = customer_id);

drop policy if exists "authenticated_insert_orders" on public.orders;
create policy "authenticated_insert_orders"
on public.orders
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "admins_select_all_orders" on public.orders;
create policy "admins_select_all_orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_update_orders" on public.orders;
create policy "admins_update_orders"
on public.orders
for update
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- -------------------------
-- order_items policies
-- -------------------------
drop policy if exists "customers_select_own_order_items" on public.order_items;
create policy "customers_select_own_order_items"
on public.order_items
for select
to authenticated
using (
  order_id in (
    select id from public.orders where customer_id = auth.uid()
  )
);

drop policy if exists "authenticated_insert_order_items" on public.order_items;
create policy "authenticated_insert_order_items"
on public.order_items
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "admins_select_all_order_items" on public.order_items;
create policy "admins_select_all_order_items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_update_order_items" on public.order_items;
create policy "admins_update_order_items"
on public.order_items
for update
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_delete_order_items" on public.order_items;
create policy "admins_delete_order_items"
on public.order_items
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

-- -------------------------
-- prescriptions policies
-- -------------------------
drop policy if exists "customers_select_own_prescriptions" on public.prescriptions;
create policy "customers_select_own_prescriptions"
on public.prescriptions
for select
to authenticated
using (auth.uid() = customer_id);

drop policy if exists "authenticated_insert_prescriptions" on public.prescriptions;
create policy "authenticated_insert_prescriptions"
on public.prescriptions
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "admins_select_all_prescriptions" on public.prescriptions;
create policy "admins_select_all_prescriptions"
on public.prescriptions
for select
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_update_prescriptions" on public.prescriptions;
create policy "admins_update_prescriptions"
on public.prescriptions
for update
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "admins_delete_prescriptions" on public.prescriptions;
create policy "admins_delete_prescriptions"
on public.prescriptions
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  )
);
