# 002 — Login recusado em produção com a senha certa

| | |
|---|---|
| **Data** | 16/10/2026 |
| **Ambiente** | Produção (Vercel + Supabase) |
| **Fatia** | 0 — Fundação |
| **Impacto** | O autor não conseguia entrar no app publicado |
| **Status** | Corrigido. Melhoria no código feita em `fix/auth-mensagem-de-erro` |

## Sintoma

O app publicado mostrava **"E-mail ou senha incorretos."** com o e-mail e a senha que tinham
acabado de ser cadastrados no painel do Supabase.

## Investigação

1. A Server Action `entrar` (`web/src/features/auth/acoes.ts`) devolve a **mesma mensagem para
   qualquer erro** do Supabase. A tela não ajudava a achar a causa.
2. `supabase projects list` mostrou **dois projetos** na conta, os dois criados naquele dia e os
   dois em `us-east-1`, e não em São Paulo como o guia previa:
   - `treinin`
   - `gabriel_palheiros@hotmail.com's Project` (criado sem querer)
3. O endpoint público `/auth/v1/settings` dos dois mostrou:
   - `disable_signup = false`: **cadastro público ligado** nos dois (a Fase 6.2 do guia não
     tinha sido aplicada)
   - `mailer_autoconfirm = false`: usuário criado sem **Auto Confirm User** fica pendente e não
     consegue entrar

## Causa

Combinação de:

- variáveis da Vercel e usuário em projetos diferentes, ou usuário criado sem confirmação. As
  duas situações viram a mesma mensagem genérica na tela;
- cadastro público ligado: um risco de segurança, mesmo sem ter causado o sintoma.

## Correção

Feita pelo autor no painel:

- os dois projetos antigos foram apagados
- criado um projeto único, **`TreinIn`, em `sa-east-1`** (São Paulo), ligado ao repositório
  com `supabase link`
- **cadastro público desligado** (conferido: `disable_signup = true`)
- usuário recriado com **Auto Confirm User**
- variáveis da Vercel atualizadas para o projeto novo

## Verificação

- Login pelo celular no app publicado funcionando
- `/auth/v1/settings` do projeto novo: `email = true`, `disable_signup = true`

## Melhoria no código (`fix/auth-mensagem-de-erro`)

- A action `entrar` grava no log do servidor o `code` e o `status` do erro, sem e-mail nem senha.
  O registro aparece nos logs da Vercel como `[auth] login recusado`.
- `mensagemDeErroDoLogin(code)` (`web/src/features/auth/mensagem-de-erro.ts`, com teste) mostra:
  - `invalid_credentials` → "E-mail ou senha incorretos." Continua genérica, de propósito.
  - `email_not_confirmed` → pede para confirmar o usuário no painel
  - `over_request_rate_limit` → pede para aguardar
  - qualquer outro → "Não foi possível entrar agora."
- Códigos conferidos contra o Supabase local com um usuário não confirmado.

## Para não repetir

- Depois de criar ou trocar o projeto Supabase, conferir `/auth/v1/settings`
  (`disable_signup = true`)
- Uma conta, um projeto: apagar na hora projeto criado por engano
