-- RLS e regras de exercises. Rodar com: supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

-- Dois usuários: A (1111…) e B (2222…)
insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.exercises'::regclass),
  'RLS ligado em exercises'
);

-- ── Usuário A ──────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

insert into public.exercises (name) values ('Supino reto máquina');

select is(
  (select user_id from public.exercises where name = 'Supino reto máquina'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'user_id vem de auth.uid()'
);

select throws_ok(
  $$ insert into public.exercises (name) values ('  supino RETO máquina ') $$,
  '23505', null,
  'nome único por usuário, sem diferenciar maiúsculas e espaços nas pontas'
);

select throws_ok(
  $$ insert into public.exercises (name, user_id) values ('Intruso', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null,
  'A não grava com o user_id de B'
);

select throws_ok(
  $$ insert into public.exercises (name) values ('   ') $$,
  '23514', null,
  'nome vazio é recusado'
);

update public.exercises set name = 'Supino reto' where name = 'Supino reto máquina';
select is(
  (select count(*)::int from public.exercises where name = 'Supino reto'),
  1,
  'A renomeia o próprio exercício'
);

select is_empty(
  $$ delete from public.exercises returning id $$,
  'exercício não se apaga (sem política de delete)'
);

-- ── Usuário B ──────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is_empty(
  $$ select id from public.exercises $$,
  'B não vê os exercícios de A'
);

select is_empty(
  $$ update public.exercises set name = 'Hackeado' returning id $$,
  'B não altera os exercícios de A'
);

select lives_ok(
  $$ insert into public.exercises (name) values ('Supino reto') $$,
  'B pode ter um exercício com o mesmo nome que A'
);

select throws_ok(
  $$ update public.exercises set user_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'B não transfere o próprio exercício para A'
);

-- ── Anônimo ────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select id from public.exercises $$,
  '42501', null,
  'anônimo não tem acesso'
);

select * from finish();
rollback;
