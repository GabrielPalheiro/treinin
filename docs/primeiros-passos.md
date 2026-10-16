# Primeiros passos — TreinIn

> Guia completo, do computador zerado até o Claude Code começar a Fatia 0.
> **Ambiente: Windows 11 · PowerShell 7 · VS Code · Docker Desktop.**
> Siga de cima para baixo. Cada fase termina com uma conferência (**✔**): só avance se ela passar.

### O que você vai montar

```
Seu computador                         Nuvem (tudo no plano gratuito)
─────────────────────────────          ─────────────────────────────────────
D:\TreinIn                             GitHub    código, PRs e CI
  web\        app Next.js     ──push─►   │
  supabase\   migrations e seed           ▼
                                       Vercel    publica o app a cada merge
Docker Desktop                                    │
  └─ Supabase local (banco + login)               ▼
                                       Supabase  banco + login de produção
```

Você desenvolve contra o **Supabase local** (dentro do Docker) e publica contra o **Supabase de
produção**. Nenhum dado de teste vai para produção.

### Contas que você vai precisar

| Serviço | Para quê | Cartão? |
|---|---|---|
| GitHub | Repositório, PRs e CI | Não |
| Supabase | Banco PostgreSQL e login | Não |
| Vercel | Hospedagem do app | Não |
| Claude (assinatura) | Claude Code | — |

---

## Fase 1 — Preparar o Windows

### 1.1 PowerShell 7 e Windows Terminal

O PowerShell que vem no Windows é a versão 5.1, antiga. Instale a atual:

```powershell
winget install Microsoft.PowerShell
winget install Microsoft.WindowsTerminal
```

Abra o **Windows Terminal** e, em *Configurações → Inicialização → Perfil padrão*, escolha
**PowerShell** (ícone preto), não o "Windows PowerShell" (ícone azul).

> Todos os comandos deste guia são para PowerShell 7.

### 1.2 Liberar a execução de scripts

O `pnpm` e o Scoop usam scripts `.ps1`, que o Windows bloqueia por padrão:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Responda `S`. Isso libera scripts locais e assinados.

### 1.3 Caminhos longos e antivírus

Abra o Windows Terminal **como Administrador** (clique direito → *Executar como administrador*):

```powershell
# Remove o limite de 260 caracteres de caminho (node_modules estoura fácil)
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Opcional: o Defender para de escanear a pasta do projeto (instalação e build bem mais rápidos)
Add-MpPreference -ExclusionPath "D:\TreinIn"
```

**✔ Passou quando:** `$PSVersionTable.PSVersion` mostra versão 7 ou superior.

---

## Fase 2 — Instalar as ferramentas

### 2.1 Pelo winget

Ainda **como Administrador**:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
winget install Microsoft.VisualStudioCode
winget install Docker.DockerDesktop
```

**Feche e reabra o Windows Terminal** (o `PATH` só atualiza numa janela nova). Agora num
terminal **comum**, ative o pnpm:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

### 2.2 Docker Desktop

Abra o **Docker Desktop** pelo menu Iniciar e deixe terminar a configuração inicial.

> O Docker Desktop usa o WSL2 como motor interno — você nunca vai abrir um terminal Linux.
> Se o instalador reclamar de virtualização, ative *Intel VT-x* ou *AMD-V* na BIOS e rode, como
> Administrador: `wsl --install --no-distribution`

O Docker é necessário porque o **Supabase local roda dentro dele**.

### 2.3 Scoop e Supabase CLI

A Supabase CLI sobe o banco e o login na sua máquina, cria migrations e gera os tipos
TypeScript. No Windows, ela é instalada pelo **Scoop**. Num terminal **comum** (não
Administrador):

```powershell
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

> Para atualizar no futuro: `scoop update supabase`.

### 2.4 Claude Code

```powershell
irm https://claude.ai/install.ps1 | iex
```

> Essa instalação se atualiza sozinha. Abra uma janela nova do terminal antes de conferir.

### 2.5 Extensões do VS Code

```powershell
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension editorconfig.editorconfig
code --install-extension ms-playwright.playwright
code --install-extension anthropic.claude-code
```

### ✔ Conferência da Fase 2

Feche e reabra o terminal e rode:

```powershell
node --version          # v20 ou superior
pnpm --version
git --version
gh --version
docker --version
supabase --version
claude --version
docker run --rm hello-world
```

**Passou quando:** todos mostram versão e o `hello-world` imprime a mensagem de boas-vindas.
Se algum falhar, reinstale só ele.

---

## Fase 3 — Configurar o Git e o GitHub

```powershell
git config --global user.name "Gabriel Palheiros"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global core.longpaths true
git config --global core.autocrlf false
```

> ⚠️ **`core.autocrlf false` é importante.** O projeto força fim de linha LF pelo
> `.gitattributes`. Se o Git também converter por conta própria, os dois brigam e arquivos
> aparecem modificados sem você ter mexido.

Autentique no GitHub:

```powershell
gh auth login
```

Escolha **GitHub.com → HTTPS → Login with a web browser**, copie o código, cole no navegador e
autorize.

**✔ Passou quando:** `gh auth status` mostra que você está logado.

---

## Fase 4 — Criar a pasta do projeto

### 4.1 Pasta curta, fora do OneDrive

```
✅ D:\TreinIn
❌ C:\Users\Gabriel\Documents\Projetos\TreinIn
```

Pastas dentro de *Documentos* e *Área de Trabalho* costumam ser sincronizadas pelo OneDrive,
que tenta sincronizar `node_modules` e trava a máquina.

```powershell
New-Item -ItemType Directory -Path D:\TreinIn\docs -Force   # se a pasta já existir, só cria docs
Set-Location D:\TreinIn
```

### 4.2 Colocar a documentação

Baixe os documentos do TreinIn e organize assim:

```
D:\TreinIn\
  CLAUDE.md                 ← na raiz
  docs\
    blueprint.md
    dominio.md
    roadmap.md
    primeiros-passos.md     ← este arquivo
```

Se eles estiverem em `Downloads`:

```powershell
Move-Item "$HOME\Downloads\CLAUDE.md" D:\TreinIn\
Move-Item "$HOME\Downloads\blueprint.md", "$HOME\Downloads\dominio.md", `
  "$HOME\Downloads\roadmap.md", "$HOME\Downloads\primeiros-passos.md" D:\TreinIn\docs\
```

### 4.3 Arquivos base do repositório

Ainda em `D:\TreinIn`, cole cada bloco no terminal. Cada um cria um arquivo.

**`.gitignore`** — o que nunca vai para o repositório

```powershell
@'
# Dependências
node_modules/
.pnpm-store/

# Next.js
.next/
out/
next-env.d.ts

# Build e testes
dist/
coverage/
playwright-report/
test-results/

# Ambiente — nunca commitar
.env
.env.local
.env.*.local

# Supabase local
supabase/.branches/
supabase/.temp/

# Vercel
.vercel/

# Sistema
Thumbs.db
*.log
'@ | Set-Content -Path .gitignore -Encoding utf8NoBOM
```

**`.gitattributes`** — fim de linha LF em tudo

```powershell
@'
* text=auto eol=lf
*.png binary
*.jpg binary
*.ico binary
*.webp binary
'@ | Set-Content -Path .gitattributes -Encoding utf8NoBOM
```

**`.editorconfig`** — mesmo formato em qualquer editor

```powershell
@'
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
'@ | Set-Content -Path .editorconfig -Encoding utf8NoBOM
```

**`README.md`** — provisório; o definitivo sai na Fatia 4

```powershell
@'
# TreinIn

Caderno de treino e dieta no celular: treino registrado série por série, com a última vez ao
lado, e calorias do dia calculadas sozinhas.

Next.js · Supabase · Vercel — um projeto da GP.Tech.

Documentação em [`docs/`](docs/).
'@ | Set-Content -Path README.md -Encoding utf8NoBOM
```

**✔ Passou quando:** `Get-ChildItem -Force` mostra `docs`, `.editorconfig`, `.gitattributes`,
`.gitignore`, `CLAUDE.md` e `README.md`, e `Get-ChildItem docs` mostra os quatro documentos.

---

## Fase 5 — Subir para o GitHub

```powershell
Set-Location D:\TreinIn
git init
git add .
git commit -m "docs: documentacao inicial do projeto e arquivos base do repositorio"
gh repo create treinin --public --description "Caderno de treino e dieta. Next.js + Supabase" --source=. --remote=origin --push
```

> **Por que público?** Não há segredo no código (as chaves ficam em `.env.local`, ignorado pelo
> Git) e, no plano gratuito do GitHub, só repositório público aplica as regras de proteção da
> `main` e o bloqueio automático de chaves vazadas.

Ajuste o jeito de mesclar (só squash) e a limpeza de branches:

```powershell
gh repo edit --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge --enable-wiki=false
```

Abra o repositório no navegador:

```powershell
gh repo view --web
```

Em **Settings → Code security**, ligue:

- ☑️ Dependabot alerts
- ☑️ Dependabot security updates
- ☑️ Secret scanning + **Push protection** (bloqueia o push se detectar uma chave)

> Este foi o **único push direto na `main`**. Daqui em diante, tudo entra por PR.

**✔ Passou quando:** o repositório abre no navegador com os documentos.

---

## Fase 6 — Supabase de produção

### 6.1 Criar o projeto

1. Crie a conta em **supabase.com** (dá para entrar com o GitHub)
2. **New project**
   - Nome: `treinin`
   - Região: **South America (São Paulo)**
   - Senha do banco: gere uma forte e **guarde no seu gerenciador de senhas**. Ela não vai para
     o repositório nem para o chat.
3. Aguarde o provisionamento (um ou dois minutos)

### 6.2 Desligar o cadastro público

**Authentication → Sign In / Providers**:

- ☐ **Allow new users to sign up** → **desligado**
- Provider **Email** habilitado

> Assim ninguém cria conta no seu app, mesmo que encontre o link.

### 6.3 Criar o seu usuário

**Authentication → Users → Add user → Create new user**

- Seu e-mail e uma senha
- ☑️ **Auto Confirm User**

### 6.4 Anotar os dados de conexão

**Project Settings → API Keys** (em alguns painéis, **Data API**):

| Valor | Variável |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable key** (ou **anon key**, se o painel ainda mostrar a chave antiga) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **Project ref** — o código na URL do painel (`supabase.com/dashboard/project/<ref>`) | usado no `supabase link` |

> Essas duas chaves são **públicas por natureza**: vão para o navegador. Quem protege os dados é
> o Row Level Security no banco.
> A **secret key / service_role** é outra coisa: **nunca** copie para o projeto nem para a Vercel.

> No plano gratuito, projetos ociosos por um período são pausados. Com uso diário isso não
> acontece; se acontecer, é só reativar no painel.

**✔ Passou quando:** seu usuário aparece em *Authentication → Users* e o cadastro público está
desligado.

---

## Fase 7 — Vercel

1. Crie a conta em **vercel.com** entrando com o **GitHub** (plano Hobby)
2. Autorize a Vercel a acessar o repositório `treinin` quando ela pedir
3. **Ainda não importe o projeto.** O app Next.js só passa a existir na Fatia 0; a importação
   é feita lá (Fase 9)

**✔ Passou quando:** você está logado na Vercel com a conta do GitHub.

---

## Fase 8 — Conferir o Claude Code

```powershell
Set-Location D:\TreinIn
claude
```

Na primeira vez ele pede login (use sua conta Claude) e pede para confiar na pasta — aceite.
O `CLAUDE.md` da raiz é lido sozinho em toda sessão; você não precisa pedir para ele ler.

Pergunte:

```
Qual e o nome do projeto, qual a stack e o que esta fora de escopo no v1?
```

**✔ Passou quando** ele responder **TreinIn** (T e I maiúsculos), citar **Next.js + Supabase +
Vercel, sem API separada**, e listar **API separada, multiusuário e importação da planilha** como
fora de escopo. Se não, você abriu o `claude` fora de `D:\TreinIn`.

Saia com `/exit`.

---

## Fase 9 — Fatia 0

### 9.1 Branch e plano

```powershell
Set-Location D:\TreinIn
git switch main
git pull
git switch -c chore/fundacao
```

Com o **Docker Desktop aberto**, inicie o Claude Code:

```powershell
claude
```

E peça:

```
Leia docs/roadmap.md e monte o plano da Fatia 0. Apresente o plano e espere minha aprovacao
antes de criar qualquer arquivo.
```

Revise o plano, corrija o que discordar e aprove. Ele vai pedir permissão antes de instalar cada
dependência — é regra do `CLAUDE.md`.

### 9.2 O que é com você durante a Fatia 0

O Claude Code cria o código. Autenticação e segredos são **seus** — ele vai parar e pedir.

**a) Primeiro `supabase start`**
Demora alguns minutos na primeira vez (baixa as imagens). Ao terminar, imprime a **URL local**
e as **chaves locais**. Você também vê isso a qualquer momento com `supabase status`.

**b) Criar `web\.env.local`** a partir do modelo (`Copy-Item web\.env.example web\.env.local`) e
preencher com os valores **locais** do passo anterior (no `supabase status`, a `Publishable key`):

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave-local-do-supabase-status>
```

> Crie e edite esse arquivo você mesmo, no VS Code. Nunca cole chaves no chat.

**c) Ligar o projeto local ao de produção:**

```powershell
supabase login
supabase link --project-ref <ref-da-fase-6.4>
```

A senha do banco (Fase 6.1) é pedida aqui.

**d) Criar o seu usuário no banco local** — para conseguir logar enquanto desenvolve:
abra o painel local (o endereço do **Studio** aparece no `supabase status`, normalmente
`http://127.0.0.1:54323`) → *Authentication → Add user*, com **Auto Confirm**.

**e) Aplicar as migrations em produção** — quando o Claude Code avisar que a primeira está
pronta:

```powershell
supabase db push
```

**f) Importar na Vercel** — depois do primeiro push da branch:

1. *Add New → Project → treinin*
2. **Root Directory: `web`**
3. *Environment Variables*: as duas `NEXT_PUBLIC_*` com os valores de **produção** (Fase 6.4)
4. *Deploy*

### 9.3 Fechar a Fatia 0

```powershell
git push -u origin chore/fundacao
gh pr create --fill
gh pr checks --watch
gh pr merge --squash --delete-branch
```

No celular, abra o endereço que a Vercel gerou (algo como `treinin-xxxx.vercel.app`), entre com
seu usuário e use **Adicionar à tela inicial**.

**✔ Fatia 0 pronta quando:** o TreinIn está na tela inicial do seu celular, pede login e entra
com o usuário da Fase 6.3.

### 9.4 Proteger a `main`

Agora que o CI já rodou uma vez, no GitHub: **Settings → Rules → Rulesets → New branch ruleset**

| Campo | Valor |
|---|---|
| Nome | `proteger-main` |
| Enforcement | Active |
| Target | Default branch |
| ☑️ Restrict deletions | |
| ☑️ Block force pushes | |
| ☑️ Require a pull request before merging | Approvals: **0** · Merge methods: **Squash** |
| ☑️ Require status checks to pass | Selecione o job do CI · ☑️ Require branches to be up to date |

> Isso impede você mesmo de, num dia cansado, empurrar algo quebrado direto na `main`.

---

## Fase 10 — O ciclo de trabalho, daqui em diante

Toda atividade segue este roteiro:

```powershell
# 1. Partir da main atualizada
Set-Location D:\TreinIn
git switch main
git pull

# 2. Branch da atividade
git switch -c feat/serie-pre-preenchida

# 3. Docker Desktop aberto, banco local de pé
supabase start

# 4. Trabalhar com o Claude Code (plano → aprovação → testes → código)
claude

# 5. Enviar e abrir o PR
git push -u origin feat/serie-pre-preenchida
gh pr create --fill

# 6. Esperar o CI e mesclar
gh pr checks --watch
gh pr merge --squash --delete-branch

# 7. Ao terminar o dia
supabase stop
```

### Quando o PR tiver migration

Antes de mesclar, aplique no banco de produção:

```powershell
supabase db push
```

> **Ordem importa: primeiro o banco, depois o merge.** O merge dispara o deploy na Vercel; assim o
> código novo nunca sobe procurando uma tabela que ainda não existe.

### Comandos do dia a dia

| Quero… | Comando |
|---|---|
| Ver URL e chaves locais | `supabase status` |
| Zerar o banco local (reaplica migrations e seed) | `supabase db reset` |
| Abrir o painel local do banco | Endereço do **Studio** no `supabase status` |
| Ver o CI | `gh run list` · `gh run watch` |
| Ver meus PRs | `gh pr status` |

---

## Resumo — em ordem

**Sessão 1 — preparar tudo**

1. ☐ PowerShell 7 e Windows Terminal como padrão
2. ☐ Execution policy, caminhos longos e exclusão do Defender
3. ☐ Node, pnpm, Git, gh, VS Code, Docker Desktop
4. ☐ Scoop + Supabase CLI
5. ☐ Claude Code + extensões do VS Code
6. ☐ Git configurado (com `core.autocrlf false`) e `gh auth login`
7. ☐ `D:\TreinIn` com documentos e arquivos base
8. ☐ Repositório no GitHub + segurança ligada
9. ☐ Supabase: projeto, cadastro off, seu usuário, dados anotados
10. ☐ Conta na Vercel
11. ☐ Conferência do Claude Code

**Sessão 2 — Fatia 0**

12. ☐ Branch `chore/fundacao` e plano aprovado
13. ☐ `.env.local`, `supabase link`, usuário local
14. ☐ `supabase db push` e importação na Vercel
15. ☐ PR mesclado, app instalado no celular
16. ☐ Ruleset protegendo a `main`

---

## Erros comuns

| Sintoma | Causa | Correção |
|---|---|---|
| `não pode ser carregado porque a execução de scripts foi desabilitada` | Execution policy | Fase 1.2 |
| `node`, `scoop`, `supabase` ou `claude` não reconhecido logo após instalar | `PATH` não recarregou | Fechar e reabrir o Windows Terminal |
| `The specified path, file name, or both are too long` | Limite de 260 caracteres | Fase 1.3 e pasta em `D:\TreinIn` |
| Arquivos aparecem todos modificados sem você mexer | `core.autocrlf` brigando com o `.gitattributes` | `git config --global core.autocrlf false` |
| Docker não sobe | Virtualização desligada na BIOS | Ativar *Intel VT-x* / *AMD-V* |
| `supabase start` falha com erro de Docker | Docker Desktop fechado | Abrir o Docker Desktop e esperar ficar pronto |
| `supabase start` reclama de porta em uso | Outro Postgres ou container usando as portas | Parar o outro container no Docker Desktop, ou `supabase stop` e tentar de novo |
| Login local dá "Email logins are disabled" | `enable_signup = false` em `[auth.email]` do `supabase/config.toml` | Deixar `true` ali; quem bloqueia cadastro é o `enable_signup` de `[auth]`. Depois `supabase stop` e `supabase start` |
| Login local dá "Invalid login credentials" | Usuário existe só em produção, não no banco local | Criar o usuário no Studio local (Fase 9.2 d) |
| Login dá "Invalid login credentials" com a senha certa | Usuário não confirmado | Recriar com **Auto Confirm User** marcado |
| Produção funciona, preview de PR falha com "Faltam NEXT_PUBLIC_SUPABASE_URL…" | Variáveis cadastradas só em *Production* | Marcar também *Preview* e *Development* nas duas variáveis e refazer o deploy (incidente 003) |
| Funciona local, falha na Vercel | Variáveis não cadastradas, ou Root Directory errado | Conferir as duas `NEXT_PUBLIC_*` e Root Directory = `web`; refazer o deploy |
| Produção dá erro de tabela inexistente | PR mesclado antes do `supabase db push` | Rodar `supabase db push` |
| Build lento demais | Defender escaneando ou OneDrive sincronizando | Fase 1.3 e sair de `Documentos` |
| Push bloqueado por secret scanning | Chave dentro de um arquivo | **Rotacione a chave no Supabase primeiro**, depois limpe o histórico |
| Claude Code ignora as regras do projeto | Aberto fora da raiz | `Set-Location D:\TreinIn` antes de `claude` |
