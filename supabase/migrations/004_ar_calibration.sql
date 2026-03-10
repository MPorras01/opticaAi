alter table public.products
  add column if not exists ar_fit_profile text
    default 'FULL_FRAME'
    check (ar_fit_profile in ('FULL_FRAME','SEMI_RIMLESS','RIMLESS','OVERSIZED','SPORTS'));

alter table public.products
  add column if not exists ar_width_adjustment numeric(4,2)
    default 1.0
    check (ar_width_adjustment between 0.5 and 1.5);

alter table public.products
  add column if not exists ar_vertical_adjustment numeric(4,2)
    default 0.0
    check (ar_vertical_adjustment between -0.1 and 0.1);
