-- Sessão de treino: WorkoutSession → ExerciseLog → SetLog (docs/dominio.md).
-- FKs compostas (id, user_id), como na ficha: a checagem de FK ignora o RLS.

create type public.exercise_log_status as enum ('Done', 'Skipped');
create type public.load_unit as enum ('Kg', 'Plates', 'Bodyweight');

-- ── WorkoutSession — Sessão ────────────────────────────────────────────────

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  workout_template_id uuid,
  note text,
  finished_at timestamptz,
  created_at timestamptz not null default now(),

  constraint workout_sessions_note_length check (char_length(note) <= 1000),
  -- Treino apagado da ficha: a sessão fica, só perde o vínculo.
  constraint workout_sessions_template_fkey foreign key (workout_template_id, user_id)
    references public.workout_templates (id, user_id) on delete set null (workout_template_id),
  constraint workout_sessions_id_user_id_key unique (id, user_id)
);

-- No máximo uma sessão aberta por usuário.
create unique index workout_sessions_one_open_per_user
  on public.workout_sessions (user_id) where finished_at is null;

create index workout_sessions_user_date_idx
  on public.workout_sessions (user_id, date desc, created_at desc);

-- ── ExerciseLog — Exercício executado ──────────────────────────────────────

create table public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workout_session_id uuid not null,
  exercise_id uuid not null,
  planned_exercise_id uuid,
  status public.exercise_log_status not null default 'Done',
  note text,
  created_at timestamptz not null default now(),

  constraint exercise_logs_note_length check (char_length(note) <= 500),
  constraint exercise_logs_session_fkey foreign key (workout_session_id, user_id)
    references public.workout_sessions (id, user_id) on delete cascade,
  constraint exercise_logs_exercise_fkey foreign key (exercise_id, user_id)
    references public.exercises (id, user_id),
  -- Exercício prescrito apagado da ficha: o registro fica, só perde o vínculo.
  constraint exercise_logs_planned_fkey foreign key (planned_exercise_id, user_id)
    references public.planned_exercises (id, user_id) on delete set null (planned_exercise_id),
  constraint exercise_logs_id_user_id_key unique (id, user_id)
);

-- Um registro por exercício prescrito em cada sessão.
create unique index exercise_logs_session_planned_key
  on public.exercise_logs (workout_session_id, planned_exercise_id)
  where planned_exercise_id is not null;

-- "Última vez" busca por exercício.
create index exercise_logs_user_exercise_idx on public.exercise_logs (user_id, exercise_id, created_at desc);

-- ── SetLog — Série ─────────────────────────────────────────────────────────

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_log_id uuid not null,
  position integer not null,
  load numeric(6, 2),
  load_unit public.load_unit not null,
  reps smallint not null,
  created_at timestamptz not null default now(),

  constraint set_logs_position_positive check (position >= 1),
  constraint set_logs_reps_range check (reps between 1 and 1000),
  -- Peso corporal não tem carga; as outras unidades têm.
  constraint set_logs_load_matches_unit check ((load_unit = 'Bodyweight') = (load is null)),
  constraint set_logs_load_range check (load is null or (load > 0 and load <= 9999)),
  constraint set_logs_exercise_log_fkey foreign key (exercise_log_id, user_id)
    references public.exercise_logs (id, user_id) on delete cascade,
  constraint set_logs_log_position_key unique (exercise_log_id, position)
    deferrable initially deferred
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Sessão não se apaga no v1. Registro de exercício e série se apagam.

alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.set_logs enable row level security;

create policy workout_sessions_select_own on public.workout_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy workout_sessions_insert_own on public.workout_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy workout_sessions_update_own on public.workout_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy exercise_logs_select_own on public.exercise_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy exercise_logs_insert_own on public.exercise_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy exercise_logs_update_own on public.exercise_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy exercise_logs_delete_own on public.exercise_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy set_logs_select_own on public.set_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy set_logs_insert_own on public.set_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy set_logs_update_own on public.set_logs
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy set_logs_delete_own on public.set_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.workout_sessions, public.exercise_logs, public.set_logs from anon;
