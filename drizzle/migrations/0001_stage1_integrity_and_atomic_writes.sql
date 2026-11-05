-- Etapa 1: integridade referencial e persistência atômica por usuário.
-- Esta migration é aditiva: não apaga nem recria registros existentes.

do $$
declare
  t text;
  constraint_name text;
begin
  foreach t in array array['pipelines','leads','clientes','tarefas','propostas','campanhas','configuracoes'] loop
    constraint_name := t || '_user_id_fkey';
    if not exists (
      select 1
      from pg_constraint
      where conname = constraint_name
        and conrelid = format('public.%I', t)::regclass
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (user_id) references auth.users(id) on delete cascade',
        t, constraint_name
      );
    end if;
  end loop;
end $$;

create or replace function public.persist_crm_collection(
  p_table text,
  p_upserts jsonb default '[]'::jsonb,
  p_deletes text[] default '{}'::text[]
)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  item_id text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_table not in ('pipelines','leads','clientes','tarefas','propostas','campanhas') then
    raise exception 'Invalid CRM table';
  end if;

  if p_upserts is not null and jsonb_typeof(p_upserts) <> 'array' then
    raise exception 'Upserts must be a JSON array';
  end if;

  for item in select value from jsonb_array_elements(coalesce(p_upserts, '[]'::jsonb))
  loop
    item_id := item->>'id';
    if item_id is null or length(item_id) = 0 then
      raise exception 'Every CRM record must have a non-empty id';
    end if;

    execute format(
      'insert into public.%I (id, user_id, data, updated_at)
       values ($1, auth.uid(), $2, now())
       on conflict (user_id, id)
       do update set data = excluded.data, updated_at = now()',
      p_table
    ) using item_id, item;
  end loop;

  if coalesce(array_length(p_deletes, 1), 0) > 0 then
    execute format(
      'delete from public.%I where user_id = auth.uid() and id = any($1)',
      p_table
    ) using p_deletes;
  end if;
end;
$$;

revoke all on function public.persist_crm_collection(text, jsonb, text[]) from public;
revoke all on function public.persist_crm_collection(text, jsonb, text[]) from anon;
grant execute on function public.persist_crm_collection(text, jsonb, text[]) to authenticated;
