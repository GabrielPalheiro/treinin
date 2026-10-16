# Incidentes — TreinIn

Registro dos erros que aconteceram, a causa e a correção aplicada. O objetivo é não repetir.

**Regra:** erro que custou mais que alguns minutos ou que vai voltar a acontecer ganha um arquivo
aqui, no mesmo PR da correção. Numeração sequencial, nome curto.

| # | Data | Onde | Resumo | Status |
|---|---|---|---|---|
| [001](001-login-email-desligado-no-supabase-local.md) | 16/10/2026 | Supabase local | Desligar cadastro em `[auth.email]` desligou o login por e-mail | Corrigido |
| [002](002-login-recusado-em-producao.md) | 16/10/2026 | Supabase produção | Login recusado com a senha certa: dois projetos e usuário não confirmado | Corrigido |
| [003](003-build-de-preview-sem-variaveis.md) | 16/10/2026 | Vercel | Deploy de preview falhou: variáveis só em Production | Corrigido |

## Ajustes menores da Fatia 0

Não viraram incidente, mas ficam anotados:

- **`LayoutProps` não encontrado no `tsc`.** No Next 16 os tipos de rota são gerados.
  O script `typecheck` roda `next typegen` antes do `tsc --noEmit`.
- **`pnpm db:types` falhou com "caminho não encontrado".** O redirecionamento `>` não cria pasta.
  `web/src/lib/supabase/` agora existe no repositório.
