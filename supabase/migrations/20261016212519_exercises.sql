-- Exercise — catálogo de exercícios do usuário (docs/dominio.md).
-- Sem política de delete: exercício não se apaga, o histórico da Fatia 2 vai apontar para ele.

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),

  constraint exercises_name_length check (char_length(btrim(name)) between 1 and 80),
  -- Alvo das chaves estrangeiras compostas (id, user_id): impede ligar a dado de outro usuário.
  constraint exercises_id_user_id_key unique (id, user_id)
);

-- Nome único por usuário, sem diferenciar maiúsculas nem espaços nas pontas.
create unique index exercises_user_id_name_key
  on public.exercises (user_id, lower(btrim(name)));

alter table public.exercises enable row level security;

create policy exercises_select_own on public.exercises
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy exercises_insert_own on public.exercises
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy exercises_update_own on public.exercises
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.exercises from anon;
