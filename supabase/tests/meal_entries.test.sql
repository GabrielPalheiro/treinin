-- RLS e regras de meal_entries. Rodar com: supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

-- Dois usuários: A (1111…) e B (2222…)
insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local');

-- Alimento próprio de A, criado como dono do banco
insert into public.foods (id, user_id, name, kcal_per_100g)
values ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Pão da padaria', 280);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.meal_entries'::regclass),
  'RLS ligado em meal_entries'
);

-- ── Usuário A ──────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

insert into public.meal_entries (date, meal, food_id, grams, kcal)
select '2026-10-29', 'Lunch', id, 150, 114 from public.foods where name = 'Feijão, carioca, cozido';

select is(
  (select user_id from public.meal_entries),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'user_id vem de auth.uid()'
);

select lives_ok(
  $$ insert into public.meal_entries (date, meal, food_id, grams, kcal)
     values ('2026-10-29', 'Breakfast', 'aaaaaaaa-0000-0000-0000-000000000001', 50, 140) $$,
  'A registra com o próprio alimento Custom'
);

select throws_ok(
  $$ insert into public.meal_entries (date, meal, food_id, grams, kcal)
     select '2026-10-29', 'Lunch', id, 0, 0 from public.foods where name = 'Feijão, carioca, cozido' $$,
  '23514', null,
  'gramas precisam ser maiores que zero'
);

select throws_ok(
  $$ insert into public.meal_entries (date, meal, food_id, grams, kcal, user_id)
     select '2026-10-29', 'Lunch', id, 100, 76, '22222222-2222-2222-2222-222222222222'
     from public.foods where name = 'Feijão, carioca, cozido' $$,
  '42501', null,
  'A não grava com o user_id de B'
);

update public.meal_entries set grams = 200, kcal = 152 where meal = 'Lunch';
select is(
  (select grams from public.meal_entries where meal = 'Lunch'),
  200.0::numeric,
  'A edita as gramas do próprio registro'
);

-- ── Usuário B ──────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is_empty(
  $$ select id from public.meal_entries $$,
  'B não vê os registros de A'
);

select is_empty(
  $$ update public.meal_entries set grams = 1 returning id $$,
  'B não altera os registros de A'
);

select is_empty(
  $$ delete from public.meal_entries returning id $$,
  'B não apaga os registros de A'
);

select throws_ok(
  $$ insert into public.meal_entries (date, meal, food_id, grams, kcal)
     values ('2026-10-29', 'Lunch', 'aaaaaaaa-0000-0000-0000-000000000001', 50, 140) $$,
  '42501', null,
  'B não registra com o alimento Custom de A, mesmo sabendo o id'
);

-- ── Usuário A apaga o próprio ──────────────────────────────
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

delete from public.meal_entries where meal = 'Breakfast';
select is(
  (select count(*)::int from public.meal_entries where meal = 'Breakfast'),
  0,
  'A apaga o próprio registro'
);

-- ── Anônimo ────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select id from public.meal_entries $$,
  '42501', null,
  'anônimo não tem acesso'
);

select * from finish();
rollback;
