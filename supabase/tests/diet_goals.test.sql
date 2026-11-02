-- RLS e regras de diet_goals. Rodar com: supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.diet_goals'::regclass),
  'RLS ligado em diet_goals'
);

-- ── Usuário A ──────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

insert into public.diet_goals (daily_kcal) values (2100);
select is(
  (select user_id from public.diet_goals),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'user_id vem de auth.uid()'
);

select throws_ok(
  $$ insert into public.diet_goals (daily_kcal) values (1800) $$,
  '23505', null,
  'uma meta só por usuário'
);

select throws_ok(
  $$ update public.diet_goals set daily_kcal = 499 $$,
  '23514', null,
  'meta abaixo de 500 é recusada'
);

select throws_ok(
  $$ insert into public.diet_goals (daily_kcal, user_id) values (2000, '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'A não grava a meta de B'
);

update public.diet_goals set daily_kcal = 1900;
select is((select daily_kcal from public.diet_goals), 1900, 'A ajusta a própria meta');

-- ── Usuário B ──────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is_empty($$ select user_id from public.diet_goals $$, 'B não vê a meta de A');

update public.diet_goals set daily_kcal = 3000;
delete from public.diet_goals;

-- ── De volta como A ────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select daily_kcal from public.diet_goals), 1900, 'B não altera a meta de A');

delete from public.diet_goals;
select is((select count(*)::int from public.diet_goals), 1, 'sem política de delete: a meta não se apaga');

select * from finish();
rollback;
