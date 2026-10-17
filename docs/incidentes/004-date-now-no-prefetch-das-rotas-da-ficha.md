# 004 — `Date.now()` no prefetch das rotas da ficha

| | |
|---|---|
| **Data** | 16/10/2026 |
| **Ambiente** | Build de produção local (`next start`), pego pelo primeiro E2E |
| **Fatia** | 1 — Ficha |
| **Impacto** | Nenhum em produção: pego antes do merge do PR #6 |
| **Status** | Corrigido no PR #6 |

## Sintoma

Durante o E2E, o servidor registrava em `/ficha`, `/treino` e nas rotas da ficha:

```
Error: Route "/ficha": Next.js encountered the unstable value `Date.now()` while prerendering.
    at dl.__loadSession (...)
    at async dl._useSession (...)
    at async dl._emitInitialSession (...)
```

O build passava e as telas abriam. O erro só aparece quando um link é pré-carregado.

## Causa

- O `next.config.ts` liga `cacheComponents` e `partialPrefetching`. Com isso, o Next **pré-renderiza
  a rota no prefetch dos links**, já com os cookies disponíveis.
- Nesse prerender, valores que mudam a cada chamada, como o relógio, são proibidos.
- O cliente do Supabase chama `Date.now()` ao carregar a sessão (`__loadSession`), para checar a
  validade do token. A leitura de cookies sozinha não impede o prerender do prefetch.

## Correção

`criarClienteParaLeitura()` em `web/src/lib/supabase/servidor.ts`: chama `await connection()`
antes de criar o cliente, o que deixa a consulta só para a hora da requisição. As consultas
(`features/ficha/consultas.ts`) passam a usá-lo. As Server Actions continuam com
`criarClienteServidor()`, porque não passam por prerender.

## Verificação

- O E2E (`pnpm test:e2e`) roda sem o erro no log do servidor
- `pnpm build` verde

## Para não repetir

- Consulta ao Supabase em Server Component usa **`criarClienteParaLeitura()`**
- Erro de "unstable value" no log: procurar no stack quem lê relógio ou número aleatório antes
  de `connection()`
