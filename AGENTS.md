# Lumen (playertwo1/lumen, antes fork playertwo1/coucou) — guia para agentes de código

Este arquivo é a porta de entrada para qualquer agente (Codex, Claude Code, Gemini) que trabalhe **neste fork**. O `CLAUDE.md` da raiz vem do projeto original. As regras de código dele continuam valendo, e este arquivo acrescenta as do fork. Se os dois conflitarem num ponto do fork, vale este.

## O que é este repositório

- Fork público de [Louis-CFM/coucou](https://github.com/Louis-CFM/coucou) (código MIT). O trabalho do fork é o app **Windows** em `windows/`: Tauri 2, com Rust em `src-tauri/` e TypeScript em `src/`.
- O fork está virando o **Lumen**, o lado desktop da Segunda Mente. A Segunda Mente é um app Android em Flutter, num repositório privado separado (`playertwo1/segundamente-app`). Os dois vão trocar tarefas, notas, conversas e personas por sync.
- Nome, personagem, ícone e sons do Coucou/Mochi **não** são livres (`LICENSE-ASSETS.md`). Renomear para Lumen, com assets próprios, é a etapa L1 da Fase L.

## Antes de agir, leia nesta ordem

1. [docs/STATE-FORK.md](docs/STATE-FORK.md): estado atual, trabalho em andamento e próxima ação.
2. [docs/ROADMAP-FORK.md](docs/ROADMAP-FORK.md): regras de execução, restrições e ordem das fases. Depois abra **só** o arquivo da fase em `docs/roadmap/`. A fase da vez é a [Fase L](docs/roadmap/fase-l-lumen.md).
3. [CLAUDE.md](CLAUDE.md): mapa do código e regras herdadas do original.
4. Antes de código com UX ou comportamento novo: uma spec curta em `docs/superpowers/specs/` e um plano em `docs/superpowers/plans/`, como manda o ROADMAP-FORK.

## Mapa do que importa ao fork

| Caminho | Conteúdo |
|---|---|
| `windows/src-tauri/src/` | Backend Rust: ilha, chat, `flow/` (ditado), `notes/` (Notetaker), `mail/` (Outlook), `phone_link/` (ligação com o Android: LAN TLS e relay), `speech/`, `voice/` |
| `windows/src/` | Interface TypeScript; frases novas em `windows/src/i18n/extra.json` |
| `windows/tests/`, `windows/synthetic/` | Testes e app sintético de validação |
| `relay/` | Worker do Cloudflare (relay sem estado; a Fase L acrescenta a caixa de correio) |
| `docs/ANDROID_LINK.md`, `docs/RELAY_LINK.md` | Protocolo de ligação com o celular, base do sync com a Segunda Mente |
| `docs/roadmap/` | Um arquivo por fase do fork |
| `docs/questionario/` | Decisões tomadas por questionário com o dono |
| `docs/superpowers/` | Specs e planos por etapa |
| `NotchBuddy/`, `android/`, `linux/` | Código do original (Mac, Android do Coucou, Linux); o fork não mexe sem pedido |

## Regras do fork

- **Evidência:** checkpoint só fecha com o resultado exigido. O sintético não substitui a validação real. O que não foi executado não está aprovado.
- **Escopo:** uma subfase por vez, na ordem do ROADMAP-FORK. Fases pausadas não reabrem sem decisão do dono.
- **Repositório público:** não registrar dados pessoais do dono, conteúdo do trabalho dele, caminhos pessoais, tokens nem nada de clientes, em código, docs, fixtures ou logs. Use dados sintéticos.
- **Segredos:** só no cofre do sistema (Credential Manager). Nunca em disco ou no git.
- **Sem telemetria.** Rede só para os serviços que o usuário configurou.
- **Nada enviado sozinho:** e-mail, mensagem ou aprovação de permissão exigem clique explícito.
- **IA propõe, usuário confirma:** tarefa ou data ambígua nunca é gravada sem confirmação.
- **Idioma:** o trabalho da Fase L é só em pt-BR. O What's new das releases continua validado pelo CI nas línguas atuais até a L1 ajustar isso. Docs e commits do fork em pt-BR.

## Validação

| Mudança | Comando |
|---|---|
| TypeScript e testes Windows | em `windows/`: `npx tsc --noEmit` e `npm test` |
| UI e build | em `windows/`: `npm run build` |
| Rust do app | em `windows/src-tauri/`: `cargo test --lib` |
| Hook | em `windows/hook/`: `cargo test` |
| Relay | em `relay/`: testes do `package.json` |
| What's new | na raiz: `python3 scripts/test-whats-new.py` |

## Git e releases

- `origin` = `playertwo1/lumen`, o repositório próprio do Lumen desde a 0.6.18, é o único destino de push. `fork` = `playertwo1/coucou`, o fork antigo: os apps até a 0.6.17 procuram atualização lá, então ele só recebe a release ponte 0.6.18. `upstream` = `Louis-CFM/coucou` serve só para `fetch`/`merge`; nunca enviar para ele.
- Antes de cada subfase de código: árvore limpa, `git fetch upstream` e `git merge upstream/main`. Resolver conflitos num commit próprio.
- Trabalhe numa branch (`codex/…`, `feat/…`, `docs/…`) ou numa worktree, e integre na `main` com merge depois dos testes.
- Releases `windows-vX.Y.Z` seguem a autorização recorrente e o checklist descritos no ROADMAP-FORK (`docs/roadmap/release-checklist.md`). Nenhuma release usa o nome ou os assets do Coucou depois da L1.
