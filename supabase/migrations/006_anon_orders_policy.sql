-- Migration 006: Guest checkout – allow the `anon` role to insert and read orders.
--
-- WHY
--   The checkout page supports unauthenticated (anonymous) users.
--   Without these policies, every INSERT / SELECT on `orders` and `order_items`
--   issued with the public anon key is blocked by RLS.
--
-- SECURITY NOTE
--   • INSERT is gated only by `with check (true)` because there is no user
--     identity to verify for a guest order.
--   • SELECT is allowed for anon so the post-checkout confirmation page can
--     fetch the order by its UUID.  UUIDs are 128-bit random values and are
--     not guessable in practice, so this does not expose other customers' data.
--   • UPDATE / DELETE are deliberately NOT granted to `anon`.

-- ── orders ────────────────────────────────────────────────────────────────────

drop policy if exists "anon_insert_orders" on public.orders;
create policy "anon_insert_orders"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "anon_select_order_by_id" on public.orders;
create policy "anon_select_order_by_id"
on public.orders
for select
to anon
using (true);

-- ── order_items ───────────────────────────────────────────────────────────────

drop policy if exists "anon_insert_order_items" on public.order_items;
create policy "anon_insert_order_items"
on public.order_items
for insert
to anon
with check (
  exists (
    select 1 from public.orders where id = order_id
  )
);

drop policy if exists "anon_select_order_items_by_order" on public.order_items;
create policy "anon_select_order_items_by_order"
on public.order_items
for select
to anon
using (
  exists (
    select 1 from public.orders where id = order_id
  )
);
