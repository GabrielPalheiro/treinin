-- Seed do banco local, aplicado no `supabase db reset`.
-- Nunca vai para produção: o `supabase db push` não aplica seed.

-- Usuário de desenvolvimento, só no banco local.
--   e-mail: dev@treinin.local
--   senha:  treinin-dev
-- Os campos de token vazios ('') são exigidos pelo Supabase Auth: com null o login falha.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'd0d0d0d0-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'dev@treinin.local',
  extensions.crypt('treinin-dev', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{}',
  now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'd0d0d0d0-0000-4000-8000-000000000001',
  'd0d0d0d0-0000-4000-8000-000000000001',
  'email',
  '{"sub":"d0d0d0d0-0000-4000-8000-000000000001","email":"dev@treinin.local","email_verified":true}',
  now(), now(), now()
);

-- A TACO entra na Fatia 3.
