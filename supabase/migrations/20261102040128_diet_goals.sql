-- DietGoal — meta da dieta (docs/dominio.md): uma linha por usuário, a meta atual.
-- Dias passados comparam com a meta de hoje (decisão de 02/11/2026, sem histórico).

create table public.diet_goals (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  daily_kcal integer not null,
  updated_at timestamptz not null default now(),

  constraint diet_goals_daily_kcal_range check (daily_kcal between 500 and 9999)
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Sem delete: a meta se ajusta, não se apaga.

alter table public.diet_goals enable row level security;

create policy diet_goals_select_own on public.diet_goals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy diet_goals_insert_own on public.diet_goals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy diet_goals_update_own on public.diet_goals
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.diet_goals from anon;
