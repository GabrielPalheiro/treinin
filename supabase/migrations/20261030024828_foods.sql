-- Food — alimento (docs/dominio.md): `Taco`, compartilhado e só leitura, ou `Custom`, do usuário.
-- Exceção à regra `user_id not null`: o alimento da TACO não tem dono (user_id nulo).
-- Sem política de delete: alimento não se apaga, os registros de refeição apontam para ele.

create type public.food_source as enum ('Taco', 'Custom');

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  source public.food_source not null default 'Custom',
  -- Número do alimento na TACO 4ª ed. (rastreabilidade); só nos da TACO.
  taco_number smallint unique,
  name text not null,
  kcal_per_100g numeric(5, 1) not null,
  created_at timestamptz not null default now(),

  constraint foods_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint foods_kcal_range check (kcal_per_100g between 0 and 900),
  -- TACO não tem dono; Custom sempre tem.
  constraint foods_source_owner check ((source = 'Taco') = (user_id is null)),
  constraint foods_taco_number check ((source = 'Taco') = (taco_number is not null))
);

-- Nome único entre os alimentos próprios do usuário, sem diferenciar maiúsculas nem espaços nas pontas.
create unique index foods_user_id_name_key
  on public.foods (user_id, lower(btrim(name)))
  where source = 'Custom';

alter table public.foods enable row level security;

create policy foods_select_taco_or_own on public.foods
  for select to authenticated
  using (source = 'Taco' or (select auth.uid()) = user_id);

create policy foods_insert_own_custom on public.foods
  for insert to authenticated
  with check (source = 'Custom' and (select auth.uid()) = user_id);

create policy foods_update_own_custom on public.foods
  for update to authenticated
  using (source = 'Custom' and (select auth.uid()) = user_id)
  with check (source = 'Custom' and (select auth.uid()) = user_id);

revoke all on public.foods from anon;
