-- =============================================================================
-- 0020_bulletin_pdf_read_consulta.sql — Permite perfil Consulta ler PDFs arquivados
-- =============================================================================

drop policy if exists "bulletin_pdf_read" on storage.objects;
create policy "bulletin_pdf_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bulletins'
    and public.user_profile_name() in ('Administrador', 'Coordenação', 'Consulta')
  );
