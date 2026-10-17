-- RLS e regras da sessão de treino. Rodar com: supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local');

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.workout_sessions'::regclass, 'public.exercise_logs'::regclass, 'public.set_logs'::regclass)),
  'RLS ligado nas três tabelas da sessão'
);

-- ── A: ficha com um treino de um exercício ─────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

insert into public.exercises (id, name) values ('a0000000-0000-0000-0000-00000000e001', 'Mesa flexora');
insert into public.workout_plans (id, name) values ('a0000000-0000-0000-0000-0000000000f1', 'Ficha');
insert into public.workout_templates (id, workout_plan_id, name, position)
  values ('a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-0000000000f1', 'Lower A', 1);
insert into public.planned_exercises (id, workout_template_id, exercise_id, position, target_sets, rep_min, rep_max)
  values ('a0000000-0000-0000-0000-0000000000b1', 'a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000e001', 1, 2, 8, 10);

insert into public.workout_sessions (id, date, workout_template_id)
  values ('a0000000-0000-0000-0000-0000000000c1', '2026-10-16', 'a0000000-0000-0000-0000-0000000000a1');

select throws_ok(
  $$ insert into public.workout_sessions (date) values ('2026-10-16') $$,
  '23505', null,
  'no máximo uma sessão aberta por usuário'
);

insert into public.exercise_logs (id, workout_session_id, exercise_id, planned_exercise_id)
  values ('a0000000-0000-0000-0000-0000000000d1', 'a0000000-0000-0000-0000-0000000000c1',
          'a0000000-0000-0000-0000-00000000e001', 'a0000000-0000-0000-0000-0000000000b1');

select is(
  (select status::text from public.exercise_logs where id = 'a0000000-0000-0000-0000-0000000000d1'),
  'Done',
  'registro nasce como Done'
);

select throws_ok(
  $$ insert into public.exercise_logs (workout_session_id, exercise_id, planned_exercise_id)
     values ('a0000000-0000-0000-0000-0000000000c1', 'a0000000-0000-0000-0000-00000000e001', 'a0000000-0000-0000-0000-0000000000b1') $$,
  '23505', null,
  'um registro por exercício prescrito na sessão'
);

insert into public.set_logs (exercise_log_id, position, load, load_unit, reps) values
  ('a0000000-0000-0000-0000-0000000000d1', 1, 58.5, 'Kg', 10),
  ('a0000000-0000-0000-0000-0000000000d1', 2, 4, 'Plates', 8);
insert into public.set_logs (exercise_log_id, position, load, load_unit, reps)
  values ('a0000000-0000-0000-0000-0000000000d1', 3, null, 'Bodyweight', 15);

select is(
  (select count(*)::int from public.set_logs where exercise_log_id = 'a0000000-0000-0000-0000-0000000000d1'),
  3,
  'séries em kg (decimal), placas e peso corporal'
);

select throws_ok(
  $$ insert into public.set_logs (exercise_log_id, position, load, load_unit, reps)
     values ('a0000000-0000-0000-0000-0000000000d1', 4, 20, 'Bodyweight', 10) $$,
  '23514', null,
  'peso corporal com carga é recusado'
);
select throws_ok(
  $$ insert into public.set_logs (exercise_log_id, position, load, load_unit, reps)
     values ('a0000000-0000-0000-0000-0000000000d1', 4, null, 'Kg', 10) $$,
  '23514', null,
  'kg sem carga é recusado'
);
select throws_ok(
  $$ insert into public.set_logs (exercise_log_id, position, load, load_unit, reps)
     values ('a0000000-0000-0000-0000-0000000000d1', 4, 50, 'Kg', 0) $$,
  '23514', null,
  'zero reps é recusado'
);
select throws_ok(
  $$ insert into public.set_logs (exercise_log_id, position, load, load_unit, reps)
     values ('a0000000-0000-0000-0000-0000000000d1', 4, 50, 'Libras', 10) $$,
  '22P02', null,
  'unidade fora do enum é recusada'
);

-- Treino apagado da ficha: a sessão fica, sem o vínculo
delete from public.planned_exercises where id = 'a0000000-0000-0000-0000-0000000000b1';
select is(
  (select planned_exercise_id from public.exercise_logs where id = 'a0000000-0000-0000-0000-0000000000d1'),
  null,
  'apagar o exercício prescrito mantém o registro, sem o vínculo'
);
delete from public.workout_templates where id = 'a0000000-0000-0000-0000-0000000000a1';
select ok(
  (select workout_template_id is null and user_id = '11111111-1111-1111-1111-111111111111'
   from public.workout_sessions where id = 'a0000000-0000-0000-0000-0000000000c1'),
  'apagar o treino mantém a sessão e o dono, sem o vínculo'
);

update public.workout_sessions set finished_at = now(), note = '15 min de esteira'
  where id = 'a0000000-0000-0000-0000-0000000000c1';
select lives_ok(
  $$ insert into public.workout_sessions (date) values ('2026-10-17') $$,
  'depois de finalizar, pode abrir outra sessão'
);

select is_empty($$ delete from public.workout_sessions returning id $$, 'sessão não se apaga');

-- ── B ──────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is_empty($$ select id from public.workout_sessions $$, 'B não vê as sessões de A');
select is_empty($$ select id from public.exercise_logs $$, 'B não vê os registros de A');
select is_empty($$ select id from public.set_logs $$, 'B não vê as séries de A');

select throws_ok(
  $$ insert into public.exercise_logs (workout_session_id, exercise_id)
     values ('a0000000-0000-0000-0000-0000000000c1', 'a0000000-0000-0000-0000-00000000e001') $$,
  '23503', null,
  'B não registra na sessão de A (FK composta)'
);
select throws_ok(
  $$ insert into public.set_logs (exercise_log_id, position, load, load_unit, reps)
     values ('a0000000-0000-0000-0000-0000000000d1', 9, 50, 'Kg', 10) $$,
  '23503', null,
  'B não grava série no registro de A (FK composta)'
);
select is_empty(
  $$ delete from public.set_logs returning id $$,
  'B não apaga as séries de A'
);

-- ── Anônimo ────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok($$ select id from public.set_logs $$, '42501', null, 'anônimo não lê séries');

select * from finish();
rollback;
