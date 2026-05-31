-- =============================================================================
-- 0016_assemble_bulletin_items_rpc.sql — Montagem atomica dos itens do BI (M5)
-- =============================================================================
-- DT-003/DT-006: a montagem copia somente records.publication_text para
-- bulletin_items. Fazer delete+insert dentro de uma funcao SQL evita deixar o
-- BI parcialmente remontado se a operacao falhar no meio.
-- =============================================================================

create or replace function public.assemble_bulletin_items(p_bulletin_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_bulletin public.bulletins%rowtype;
  v_inserted integer := 0;
begin
  if coalesce(public.user_profile_name(), '') not in ('Administrador', 'Coordenação') then
    raise exception 'Apenas a Coordenação pode montar itens do boletim.'
      using errcode = 'insufficient_privilege';
  end if;

  select *
    into v_bulletin
    from public.bulletins
    where id = p_bulletin_id
    for update;

  if not found then
    raise exception 'Boletim não encontrado.'
      using errcode = 'no_data_found';
  end if;

  if v_bulletin.status <> 'rascunho' then
    raise exception 'Só é possível montar itens de um boletim em rascunho.'
      using errcode = 'check_violation';
  end if;

  delete from public.bulletin_items
    where bulletin_id = p_bulletin_id;

  insert into public.bulletin_items (
    bulletin_id,
    record_id,
    part_number,
    reference_date,
    title,
    content,
    source_type,
    display_order,
    visible
  )
  select
    p_bulletin_id,
    ranked.id,
    ranked.part_number,
    ranked.reference_date,
    coalesce(ranked.title, ''),
    ranked.publication_text,
    ranked.source_type,
    ranked.display_order,
    true
  from (
    select
      r.id,
      coalesce(r.bulletin_part, 3) as part_number,
      r.reference_date,
      r.title,
      r.publication_text,
      r.source_type,
      (row_number() over (
        partition by coalesce(r.bulletin_part, 3)
        order by r.reference_date asc, r.created_at asc, r.id asc
      ) - 1)::integer as display_order
    from public.records r
    where r.status = 'validado'
      and r.classification = 'publicável'
      and r.include_in_bulletin = true
      and r.reference_date >= v_bulletin.start_date
      and r.reference_date <= v_bulletin.end_date
  ) ranked
  order by ranked.part_number asc, ranked.display_order asc;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

grant execute on function public.assemble_bulletin_items(uuid) to authenticated;
