insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prescriptions',
  'prescriptions',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Admins read prescriptions files" on storage.objects;
create policy "Admins read prescriptions files"
on storage.objects for select
using (
  bucket_id = 'prescriptions'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "Admins upload prescriptions files" on storage.objects;
create policy "Admins upload prescriptions files"
on storage.objects for insert
with check (
  bucket_id = 'prescriptions'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

drop policy if exists "Admins delete prescriptions files" on storage.objects;
create policy "Admins delete prescriptions files"
on storage.objects for delete
using (
  bucket_id = 'prescriptions'
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);