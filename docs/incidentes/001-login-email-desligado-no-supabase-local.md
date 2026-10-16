# 001 — Login por e-mail desligado no Supabase local

| | |
|---|---|
| **Data** | 16/10/2026 |
| **Ambiente** | Supabase local (`supabase start`) |
| **Fatia** | 0 — Fundação |
| **Impacto** | Ninguém conseguia entrar no app local. Pego antes de chegar ao autor |
| **Status** | Corrigido em `6f8e7dd` |

## Sintoma

O teste de login de ponta a ponta falhou com:

```
AuthApiError: Email logins are disabled
code: 'email_provider_disabled', status: 422
```

## Causa

Para desligar o cadastro público, o `supabase/config.toml` recebeu `enable_signup = false` em
**dois** lugares:

```toml
[auth]
enable_signup = false        # bloqueia cadastro público ✅

[auth.email]
enable_signup = false        # desliga o provedor de e-mail inteiro ❌
```

O nome é o mesmo, mas o efeito é diferente: em `[auth.email]` ele desliga o **provedor** de
e-mail, e com ele o login.

## Correção

```toml
[auth.email]
# TreinIn: precisa ficar true, senao o login por e-mail inteiro e desligado.
# Quem bloqueia o cadastro publico e o enable_signup = false de [auth].
enable_signup = true
```

Depois, `supabase stop` e `supabase start` para aplicar.

## Verificação

Com um usuário descartável no banco local:

- login com a senha certa → sessão criada, `/hoje` abre
- senha errada → `Invalid login credentials`
- `signUp` público → `Signups not allowed for this instance`

## Para não repetir

- Mudança em `[auth]` do `config.toml` se testa com login **e** com tentativa de cadastro
- Registrado em "Erros comuns" de `docs/primeiros-passos.md`
