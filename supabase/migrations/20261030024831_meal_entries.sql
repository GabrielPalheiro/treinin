-- MealEntry — registro de refeição (docs/dominio.md): um alimento comido numa data e refeição.
-- `kcal` é snapshot, gravado no registro: corrigir o alimento depois não muda o histórico.

create type public.meal as enum ('Breakfast', 'Lunch', 'Snack', 'Dinner', 'Supper');

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  meal public.meal not null,
  -- FK simples: o alimento da TACO não tem user_id. A política de escrita exige um alimento visível.
  food_id uuid not null references public.foods (id),
  grams numeric(6, 1) not null,
  kcal integer not null,
  created_at timestamptz not null default now(),

  constraint meal_entries_grams_range check (grams > 0 and grams <= 10000),
  constraint meal_entries_kcal_range check (kcal between 0 and 90000)
);

create index meal_entries_user_date_idx on public.meal_entries (user_id, date, meal, created_at);
-- "Mais usados primeiro" conta registros por alimento.
create index meal_entries_user_food_idx on public.meal_entries (user_id, food_id);

alter table public.meal_entries enable row level security;

create policy meal_entries_select_own on public.meal_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- A subconsulta em foods passa pelo RLS de foods: só a TACO e os próprios Custom.
create policy meal_entries_insert_own on public.meal_entries
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.foods f where f.id = food_id)
  );

create policy meal_entries_update_own on public.meal_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.foods f where f.id = food_id)
  );

create policy meal_entries_delete_own on public.meal_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.meal_entries from anon;
