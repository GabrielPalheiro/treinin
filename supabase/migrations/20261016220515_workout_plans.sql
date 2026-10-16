-- Ficha: WorkoutPlan → WorkoutTemplate → PlannedExercise (docs/dominio.md).
-- Toda FK para dado do usuário é composta (id, user_id): a checagem de FK ignora o RLS, então
-- sem isso daria para pendurar um treino na ficha de outro usuário.

-- ── WorkoutPlan — Ficha ────────────────────────────────────────────────────

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),

  constraint workout_plans_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint workout_plans_archived_not_active check (not (active and archived_at is not null)),
  constraint workout_plans_id_user_id_key unique (id, user_id)
);

-- No máximo uma ficha ativa por usuário.
create unique index workout_plans_one_active_per_user
  on public.workout_plans (user_id) where active;

-- ── WorkoutTemplate — Treino ───────────────────────────────────────────────

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_plan_id uuid not null,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),

  constraint workout_templates_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint workout_templates_position_positive check (position >= 1),
  constraint workout_templates_plan_fkey foreign key (workout_plan_id, user_id)
    references public.workout_plans (id, user_id) on delete cascade,
  -- Adiável: a reordenação troca posições dentro de um único update.
  constraint workout_templates_plan_position_key unique (workout_plan_id, position)
    deferrable initially deferred,
  constraint workout_templates_id_user_id_key unique (id, user_id)
);

create unique index workout_templates_plan_name_key
  on public.workout_templates (workout_plan_id, lower(btrim(name)));

-- ── PlannedExercise — Exercício prescrito ──────────────────────────────────

create table public.planned_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_template_id uuid not null,
  exercise_id uuid not null,
  position integer not null,
  target_sets smallint not null,
  rep_min smallint not null,
  rep_max smallint not null,
  technique text,
  created_at timestamptz not null default now(),

  constraint planned_exercises_position_positive check (position >= 1),
  constraint planned_exercises_target_sets_range check (target_sets between 1 and 10),
  constraint planned_exercises_rep_min_range check (rep_min between 1 and 100),
  constraint planned_exercises_rep_max_range check (rep_max between 1 and 100),
  constraint planned_exercises_rep_range check (rep_min <= rep_max),
  constraint planned_exercises_technique_length check (char_length(technique) <= 500),
  constraint planned_exercises_template_fkey foreign key (workout_template_id, user_id)
    references public.workout_templates (id, user_id) on delete cascade,
  constraint planned_exercises_exercise_fkey foreign key (exercise_id, user_id)
    references public.exercises (id, user_id) on delete restrict,
  constraint planned_exercises_template_position_key unique (workout_template_id, position)
    deferrable initially deferred,
  constraint planned_exercises_id_user_id_key unique (id, user_id)
);

create index planned_exercises_exercise_id_idx on public.planned_exercises (exercise_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Ficha não se apaga (arquiva-se). Treino e exercício prescrito se apagam.

alter table public.workout_plans enable row level security;
alter table public.workout_templates enable row level security;
alter table public.planned_exercises enable row level security;

create policy workout_plans_select_own on public.workout_plans
  for select to authenticated using ((select auth.uid()) = user_id);
create policy workout_plans_insert_own on public.workout_plans
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy workout_plans_update_own on public.workout_plans
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy workout_templates_select_own on public.workout_templates
  for select to authenticated using ((select auth.uid()) = user_id);
create policy workout_templates_insert_own on public.workout_templates
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy workout_templates_update_own on public.workout_templates
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy workout_templates_delete_own on public.workout_templates
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy planned_exercises_select_own on public.planned_exercises
  for select to authenticated using ((select auth.uid()) = user_id);
create policy planned_exercises_insert_own on public.planned_exercises
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy planned_exercises_update_own on public.planned_exercises
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy planned_exercises_delete_own on public.planned_exercises
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.workout_plans, public.workout_templates, public.planned_exercises from anon;

-- ── Funções ─────────────────────────────────────────────────────────────────
-- security invoker: rodam com as permissões de quem chama, então o RLS vale.

-- Ativa a ficha e desativa a anterior, na mesma transação.
create function public.activate_workout_plan(plan_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.workout_plans where id = plan_id and archived_at is null
  ) then
    raise exception 'workout plan not found or archived' using errcode = 'P0002';
  end if;

  update public.workout_plans set active = false where active and id <> plan_id;
  update public.workout_plans set active = true where id = plan_id;
end;
$$;

-- Grava a nova ordem dos treinos da ficha: a lista precisa ter todos os treinos, sem repetir.
create function public.reorder_workout_templates(plan_id uuid, template_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total integer;
begin
  select count(*) into total from public.workout_templates where workout_plan_id = plan_id;

  if cardinality(template_ids) <> total
    or (select count(distinct t.id) from unnest(template_ids) as t (id)) <> total
    or exists (
      select 1 from unnest(template_ids) as t (id)
      where not exists (
        select 1 from public.workout_templates w where w.id = t.id and w.workout_plan_id = plan_id
      )
    )
  then
    raise exception 'template list does not match the plan' using errcode = '22023';
  end if;

  update public.workout_templates w
  set position = o.ordem
  from unnest(template_ids) with ordinality as o (id, ordem)
  where w.id = o.id;
end;
$$;

-- Mesma regra para os exercícios prescritos de um treino.
create function public.reorder_planned_exercises(template_id uuid, planned_exercise_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total integer;
begin
  select count(*) into total from public.planned_exercises where workout_template_id = template_id;

  if cardinality(planned_exercise_ids) <> total
    or (select count(distinct p.id) from unnest(planned_exercise_ids) as p (id)) <> total
    or exists (
      select 1 from unnest(planned_exercise_ids) as p (id)
      where not exists (
        select 1 from public.planned_exercises e
        where e.id = p.id and e.workout_template_id = template_id
      )
    )
  then
    raise exception 'planned exercise list does not match the template' using errcode = '22023';
  end if;

  update public.planned_exercises e
  set position = o.ordem
  from unnest(planned_exercise_ids) with ordinality as o (id, ordem)
  where e.id = o.id;
end;
$$;

revoke execute on function public.activate_workout_plan(uuid) from public, anon;
revoke execute on function public.reorder_workout_templates(uuid, uuid[]) from public, anon;
revoke execute on function public.reorder_planned_exercises(uuid, uuid[]) from public, anon;
grant execute on function public.activate_workout_plan(uuid) to authenticated;
grant execute on function public.reorder_workout_templates(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_planned_exercises(uuid, uuid[]) to authenticated;
