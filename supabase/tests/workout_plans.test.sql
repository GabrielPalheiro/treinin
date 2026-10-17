-- RLS e regras da ficha. Rodar com: supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(25);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local');

select ok(
  (select bool_and(relrowsecurity) from pg_class
   where oid in ('public.workout_plans'::regclass, 'public.workout_templates'::regclass, 'public.planned_exercises'::regclass)),
  'RLS ligado nas três tabelas da ficha'
);

-- ── Usuário A monta uma ficha ──────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

insert into public.exercises (id, name) values
  ('a0000000-0000-0000-0000-00000000e001', 'Mesa flexora'),
  ('a0000000-0000-0000-0000-00000000e002', 'Cadeira extensora');

insert into public.workout_plans (id, name) values
  ('a0000000-0000-0000-0000-0000000000f1', 'Ficha outubro'),
  ('a0000000-0000-0000-0000-0000000000f2', 'Ficha novembro');

insert into public.workout_templates (id, workout_plan_id, name, position) values
  ('a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-0000000000f1', 'Lower A', 1),
  ('a0000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-0000000000f1', 'Upper A', 2),
  ('a0000000-0000-0000-0000-0000000000a3', 'a0000000-0000-0000-0000-0000000000f1', 'Lower B', 3);

insert into public.planned_exercises (id, workout_template_id, exercise_id, position, target_sets, rep_min, rep_max) values
  ('a0000000-0000-0000-0000-0000000000b1', 'a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000e001', 1, 2, 8, 10),
  ('a0000000-0000-0000-0000-0000000000b2', 'a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000e002', 2, 3, 10, 12);

-- Ativar
select public.activate_workout_plan('a0000000-0000-0000-0000-0000000000f1');
select is((select active from public.workout_plans where id = 'a0000000-0000-0000-0000-0000000000f1'), true, 'ativar marca a ficha como ativa');

select public.activate_workout_plan('a0000000-0000-0000-0000-0000000000f2');
select results_eq(
  $$ select name from public.workout_plans where active $$,
  $$ values ('Ficha novembro') $$,
  'ativar outra ficha desativa a anterior: só uma ativa'
);

select throws_ok(
  $$ update public.workout_plans set active = true where id = 'a0000000-0000-0000-0000-0000000000f1' $$,
  '23505', null,
  'o banco recusa duas fichas ativas'
);

update public.workout_plans set archived_at = now(), active = false where id = 'a0000000-0000-0000-0000-0000000000f2';
select throws_ok(
  $$ select public.activate_workout_plan('a0000000-0000-0000-0000-0000000000f2') $$,
  'P0002', null,
  'ficha arquivada não pode ser ativada'
);
select throws_ok(
  $$ update public.workout_plans set active = true where id = 'a0000000-0000-0000-0000-0000000000f2' $$,
  '23514', null,
  'o banco recusa ficha arquivada e ativa ao mesmo tempo'
);

select is_empty($$ delete from public.workout_plans returning id $$, 'ficha não se apaga (arquiva-se)');

-- Prescrição
select throws_ok(
  $$ insert into public.planned_exercises (workout_template_id, exercise_id, position, target_sets, rep_min, rep_max)
     values ('a0000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-00000000e001', 1, 2, 12, 8) $$,
  '23514', null,
  'rep_min maior que rep_max é recusado'
);
select throws_ok(
  $$ insert into public.planned_exercises (workout_template_id, exercise_id, position, target_sets, rep_min, rep_max)
     values ('a0000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-00000000e001', 1, 0, 8, 10) $$,
  '23514', null,
  'zero séries é recusado'
);
select throws_ok(
  $$ insert into public.workout_templates (workout_plan_id, name, position)
     values ('a0000000-0000-0000-0000-0000000000f1', 'lower a', 4) $$,
  '23505', null,
  'nome do treino é único dentro da ficha'
);

-- Reordenar treinos
select public.reorder_workout_templates(
  'a0000000-0000-0000-0000-0000000000f1',
  array['a0000000-0000-0000-0000-0000000000a3', 'a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-0000000000a2']::uuid[]
);
select results_eq(
  $$ select name from public.workout_templates where workout_plan_id = 'a0000000-0000-0000-0000-0000000000f1' order by position $$,
  $$ values ('Lower B'), ('Lower A'), ('Upper A') $$,
  'reordenar treinos grava a nova rotação'
);
select results_eq(
  $$ select position from public.workout_templates where workout_plan_id = 'a0000000-0000-0000-0000-0000000000f1' order by position $$,
  $$ values (1), (2), (3) $$,
  'posições ficam 1..n'
);
select throws_ok(
  $$ select public.reorder_workout_templates('a0000000-0000-0000-0000-0000000000f1',
       array['a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-0000000000a2']::uuid[]) $$,
  '22023', null,
  'reordenar com lista incompleta é recusado'
);
select throws_ok(
  $$ select public.reorder_workout_templates('a0000000-0000-0000-0000-0000000000f1',
       array['a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-0000000000a2']::uuid[]) $$,
  '22023', null,
  'reordenar com item repetido é recusado'
);

-- Reordenar exercícios prescritos
select public.reorder_planned_exercises(
  'a0000000-0000-0000-0000-0000000000a1',
  array['a0000000-0000-0000-0000-0000000000b2', 'a0000000-0000-0000-0000-0000000000b1']::uuid[]
);
select results_eq(
  $$ select exercise_id from public.planned_exercises where workout_template_id = 'a0000000-0000-0000-0000-0000000000a1' order by position $$,
  $$ values ('a0000000-0000-0000-0000-00000000e002'::uuid), ('a0000000-0000-0000-0000-00000000e001'::uuid) $$,
  'reordenar exercícios prescritos grava a nova ordem'
);

-- Apagar treino leva junto os exercícios prescritos
delete from public.workout_templates where id = 'a0000000-0000-0000-0000-0000000000a3';
select is(
  (select count(*)::int from public.workout_templates where workout_plan_id = 'a0000000-0000-0000-0000-0000000000f1'),
  2,
  'A apaga um treino da própria ficha'
);

-- ── Usuário B ──────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is_empty($$ select id from public.workout_plans $$, 'B não vê as fichas de A');
select is_empty($$ select id from public.workout_templates $$, 'B não vê os treinos de A');
select is_empty($$ select id from public.planned_exercises $$, 'B não vê os exercícios prescritos de A');

select throws_ok(
  $$ insert into public.workout_templates (workout_plan_id, name, position)
     values ('a0000000-0000-0000-0000-0000000000f1', 'Intruso', 9) $$,
  '23503', null,
  'B não pendura treino na ficha de A (FK composta)'
);

insert into public.workout_plans (id, name) values ('b0000000-0000-0000-0000-0000000000f1', 'Ficha de B');
insert into public.workout_templates (id, workout_plan_id, name, position)
  values ('b0000000-0000-0000-0000-0000000000a1', 'b0000000-0000-0000-0000-0000000000f1', 'Full body', 1);
select throws_ok(
  $$ insert into public.planned_exercises (workout_template_id, exercise_id, position, target_sets, rep_min, rep_max)
     values ('b0000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000e001', 1, 2, 8, 10) $$,
  '23503', null,
  'B não prescreve um exercício do catálogo de A (FK composta)'
);

select throws_ok(
  $$ select public.activate_workout_plan('a0000000-0000-0000-0000-0000000000f1') $$,
  'P0002', null,
  'B não ativa a ficha de A'
);

select public.activate_workout_plan('b0000000-0000-0000-0000-0000000000f1');
select is(
  (select active from public.workout_plans where id = 'b0000000-0000-0000-0000-0000000000f1'),
  true,
  'B tem a própria ficha ativa, independente da de A'
);

select is_empty(
  $$ delete from public.workout_templates where workout_plan_id = 'a0000000-0000-0000-0000-0000000000f1' returning id $$,
  'B não apaga os treinos de A'
);

-- ── Anônimo ────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok($$ select id from public.workout_plans $$, '42501', null, 'anônimo não lê fichas');

select * from finish();
rollback;
