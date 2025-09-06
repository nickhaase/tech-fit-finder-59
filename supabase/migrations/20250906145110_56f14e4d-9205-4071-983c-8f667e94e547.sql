-- Create a public bucket for company logos
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

-- Public can read objects from this bucket
create policy "Public can view company logos"
  on storage.objects
  for select
  using (bucket_id = 'company-logos');