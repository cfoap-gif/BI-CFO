-- =============================================================================
-- 0015_bulletin_items_freeze.sql — Hardening do congelamento de itens (M5)
-- =============================================================================
-- DT-006: bulletin_items sao editaveis enquanto o BI esta em rascunho, mas
-- ficam congelados quando o boletim e aprovado. A UI e as Server Actions ja
-- aplicam essa regra; esta migration leva a garantia para o banco.
-- =============================================================================

create or replace function public.tg_block_approved_bulletin_item_write()
returns trigger
language plpgsql
as $$
declare
  old_status text;
  new_status text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select status into old_status
      from public.bulletins
      where id = old.bulletin_id;

    if old_status = 'aprovado' then
      raise exception 'Nao e possivel alterar itens de um boletim aprovado.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    select status into new_status
      from public.bulletins
      where id = new.bulletin_id;

    if new_status = 'aprovado' then
      raise exception 'Nao e possivel alterar itens de um boletim aprovado.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists block_approved_bulletin_item_write
  on public.bulletin_items;
create trigger block_approved_bulletin_item_write
  before insert or update or delete on public.bulletin_items
  for each row execute function public.tg_block_approved_bulletin_item_write();

