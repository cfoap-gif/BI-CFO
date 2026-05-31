-- =============================================================================
-- 0017_bulletin_pdf_archive.sql — Arquivamento simples do PDF (M7 parcial)
-- =============================================================================
-- Cria metadados de PDF em bulletins e um bucket privado para armazenar PDFs
-- oficiais gerados a partir de bulletin_items.
-- =============================================================================

alter table public.bulletins
  add column if not exists pdf_path text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists pdf_generated_by uuid references auth.users(id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bulletins', 'bulletins', false, 10485760, array['application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bulletin_pdf_read" on storage.objects;
create policy "bulletin_pdf_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bulletins'
    and public.user_profile_name() in ('Administrador', 'Coordenação')
  );

drop policy if exists "bulletin_pdf_write" on storage.objects;
create policy "bulletin_pdf_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bulletins'
    and public.user_profile_name() in ('Administrador', 'Coordenação')
  );

drop policy if exists "bulletin_pdf_update" on storage.objects;
create policy "bulletin_pdf_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bulletins'
    and public.user_profile_name() in ('Administrador', 'Coordenação')
  )
  with check (
    bucket_id = 'bulletins'
    and public.user_profile_name() in ('Administrador', 'Coordenação')
  );

