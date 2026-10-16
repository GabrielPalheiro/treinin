# 003 — Deploy de preview falhou: variáveis só em Production

| | |
|---|---|
| **Data** | 16/10/2026 |
| **Ambiente** | Vercel, deploy de preview do PR #2 |
| **Fatia** | 0 — Fundação |
| **Impacto** | Previews de PR quebrados. Produção não foi afetada |
| **Status** | Corrigido |

## Sintoma

No PR #2 o CI passou, mas o check **Vercel** falhou: `Deployment has failed`.

Log do build (`vercel inspect <deployment> --logs`):

```
Error: Failed to collect configuration for /hoje
  [cause]: Error: Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Veja web/.env.example.
    at module evaluation (src/lib/supabase/config.ts:6:9)
    at module evaluation (src/features/auth/botao-sair.tsx:3:1)
```

## Causa

`vercel env ls` mostrou as duas variáveis cadastradas **só no ambiente Production**. O deploy da
`main` usa Production e funcionou; o de PR usa **Preview** e rodou sem as variáveis.

O `config.ts` falhar no build é intencional: é melhor quebrar o deploy do que publicar um app que
não consegue falar com o banco.

## Correção

1. Projeto local ligado à Vercel: `vercel link --project web --scope gpt-ech1`
   (cria `web/.vercel/`, que o Git ignora)
2. Valores de Production copiados para **Preview** e **Development** com `vercel env pull` +
   `vercel env add`, por arquivo temporário e entrada padrão. Os valores não foram exibidos nem
   gravados no repositório.
3. Novo deploy de preview, disparado pelo push deste PR

### Efeito colateral corrigido

O `vercel link` também:

- acrescentou `.vercel` e `.env*` ao fim de `web/.gitignore`. O `.env*` ficava **depois** do
  `!.env.example` e voltaria a ignorar o modelo. **Revertido**: as duas regras já existiam no
  lugar certo;
- acrescentou `VERCEL_OIDC_TOKEN` ao `web/.env.local`, que é local e ignorado pelo Git.

## Verificação

- `vercel env ls`: as duas `NEXT_PUBLIC_*` em Production, Preview e Development
- Check **Vercel** do PR #2 verde

## Para não repetir

- Variável nova vai para **os três ambientes** da Vercel de uma vez, ou com
  `vercel env add <NOME>` para cada ambiente
- Depois de `vercel link` ou `vercel env pull`, rodar `git diff` antes de commitar
- Registrado em "Erros comuns" de `docs/primeiros-passos.md`
