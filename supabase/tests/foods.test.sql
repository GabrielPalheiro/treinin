-- RLS e regras de foods. Rodar com: supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Dois usuários: A (1111…) e B (2222…)
insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@teste.local'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@teste.local');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.foods'::regclass),
  'RLS ligado em foods'
);

select is(
  (select count(*)::int from public.foods where source = 'Taco'),
  593,
  'TACO carregada pela migration (597 menos 4 sem kcal)'
);

select is(
  (select kcal_per_100g from public.foods where name = 'Pão, trigo, francês'),
  300.0::numeric,
  'kcal por 100 g vem da TACO'
);

-- ── Usuário A ──────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.foods where source = 'Taco'),
  593,
  'usuário lê a TACO'
);

insert into public.foods (name, kcal_per_100g) values ('Whey da marca X', 400);

select is(
  (select row(user_id, source)::text from public.foods where name = 'Whey da marca X'),
  row('11111111-1111-1111-1111-111111111111'::uuid, 'Custom'::public.food_source)::text,
  'alimento novo é Custom, com user_id de auth.uid()'
);

select throws_ok(
  $$ insert into public.foods (name, kcal_per_100g) values ('  whey DA marca x ', 380) $$,
  '23505', null,
  'nome único entre os Custom do usuário'
);

select lives_ok(
  $$ insert into public.foods (name, kcal_per_100g) values ('Pão, trigo, francês', 290) $$,
  'Custom pode ter o mesmo nome de um alimento da TACO'
);

select throws_ok(
  $$ insert into public.foods (source, user_id, taco_number, name, kcal_per_100g)
     values ('Taco', null, 999, 'Falso da TACO', 100) $$,
  '42501', null,
  'usuário não cria alimento da TACO'
);

select is_empty(
  $$ update public.foods set kcal_per_100g = 1 where source = 'Taco' returning id $$,
  'usuário não altera a TACO'
);

select throws_ok(
  $$ insert into public.foods (name, kcal_per_100g) values ('Mais que gordura pura', 901) $$,
  '23514', null,
  'kcal por 100 g acima de 900 é recusada'
);

update public.foods set kcal_per_100g = 390 where name = 'Whey da marca X';
select is(
  (select kcal_per_100g from public.foods where name = 'Whey da marca X'),
  390.0::numeric,
  'A edita o próprio Custom'
);

select is_empty(
  $$ delete from public.foods returning id $$,
  'alimento não se apaga (sem política de delete)'
);

-- ── Usuário B ──────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is_empty(
  $$ select id from public.foods where source = 'Custom' $$,
  'B não vê os alimentos próprios de A'
);

select is_empty(
  $$ update public.foods set name = 'Hackeado' where source = 'Custom' returning id $$,
  'B não altera os alimentos próprios de A'
);

select throws_ok(
  $$ insert into public.foods (name, kcal_per_100g, user_id) values ('Intruso', 100, '11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'B não grava com o user_id de A'
);

-- ── Anônimo ────────────────────────────────────────────────
reset role;
set local role anon;
select throws_ok(
  $$ select id from public.foods $$,
  '42501', null,
  'anônimo não tem acesso'
);

select * from finish();
rollback;
