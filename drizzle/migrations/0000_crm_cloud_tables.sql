do $$
declare t text;
begin
  foreach t in array array['pipelines','leads','clientes','tarefas','propostas','campanhas'] loop
    execute format('create table public.%I (id text not null, user_id uuid not null default auth.uid(), data jsonb not null, updated_at timestamptz not null default now(), primary key (user_id, id))', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

create table public.configuracoes (
  user_id uuid primary key default auth.uid(),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
revoke all on public.configuracoes from anon;
grant select, insert, update, delete on public.configuracoes to authenticated;
grant all on public.configuracoes to service_role;
alter table public.configuracoes enable row level security;
create policy owner_select on public.configuracoes for select to authenticated using ((select auth.uid()) = user_id);
create policy owner_insert on public.configuracoes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy owner_update on public.configuracoes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_delete on public.configuracoes for delete to authenticated using ((select auth.uid()) = user_id);