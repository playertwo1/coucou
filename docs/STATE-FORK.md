# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-14 · **Última release:** [`windows-v0.6.15`](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.15) (Lumen; validação real em avaliação) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), L0 concluída; L1.4a e L1.4d-1/d-2/d-3/d-4 aprovadas visualmente; protótipo L1.4b entregue; Canvas escolhido na L1.4c; L1.3 e L1.4 reais em avaliação; L2.1 e L2.2 aprovadas sinteticamente (`0.6.15`; login e chat reais pendentes)

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Pausadas (D-053); ver inventário L0 na Fase L |
| L | Em andamento. L0 concluída; L1.1 B escolhida; L1.2 implementada; L1.3 aprovada sinteticamente; avaliação real da migração e L1.4 pendente; L1.4a e L1.4d-1/d-2/d-3/d-4 aprovadas visualmente; L1.4b entregue com limites de medição registrados; Canvas escolhido na L1.4c em 2026-11-13; L2.1 sintética aprovada (0.6.14); L2.2 implementada e verificada sinteticamente em 2026-11-14; release `0.6.15` publicada localmente (inclui L1.4d-3/d-4 e L2.2); validação real de L1.3, L1.4 e L2 pendente; próxima etapa: L3 |
| 2B, 2C | Pausadas (decisão do dono, 2026-11-13) |
| M0–M10 | Viram "Lumen assistente"; começam depois do Checkpoint L7 |
| 3 (identidade) | Incorporada à L1 |

## Trabalho em andamento fora da `main`

- Worktree `../coucou-git-pill`, branch `codex/windows-git-pill`: pílula Git somente leitura.
- Worktree `../coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`: avaliação de notificações de permissão.
- Branch `codex/windows-permission-toast-synthetic`.
- Worktree `../coucou-lumen-identity`, branch `codex/l1-lumen-identidade`: commit `c3b2af2` está em `origin/main`; tag e release `windows-v0.6.13` publicadas. CI `43424866776` e CI da release `43428181413` passaram nos testes sintéticos MSI/NSIS; Defender não detectou ameaças nos artefatos do preflight nem nos instaladores finais. L1 aguarda avaliação real do proprietário.
- Na worktree principal há alterações locais ainda não commitadas do app sintético (`windows/synthetic/`, testes e specs de 2026-11-12). Elas são do dono e ficaram fora do commit de reestruturação de 2026-11-13.
- Branch `feat/chat-web-localizacao` (2026-11-14, pedido do dono fora da ordem das fases): chat com internet e localização. O Plano ChatGPT envia a ferramenta `web_search` do provedor em `/responses` (com repetição sem web se o plano responder 400) e o prompt leva a data de hoje e a cidade salva em Configurações → Chat → Sua localização. Sintético aprovado: `npx tsc --noEmit`, 673 testes Node, `npm run build`, 670 testes Rust (8 ignorados). **Real: NOT_RUN** (falta o dono perguntar o clima com a conta real e registrar se o plano aceita `web_search`). Sem release e sem merge na `main`. Spec: `docs/superpowers/specs/2026-11-14-chat-web-localizacao-design.md`.
- As worktrees acima e as alterações locais do app sintético não foram alteradas nesta sessão. O preflight 0.6.12 `43402455643` foi cancelado; a tag existe, mas não há release publicada.

## Próxima ação

1. O proprietário relatou que a identidade da 0.6.13 aparece ("aparece tudo"). Ainda faltam os resultados por cenário da migração real: tipo de instalação (MSI ou NSIS), settings, hooks, permissões e atualizador.
2. **Decisões do proprietário (2026-11-13 e 2026-11-14):** sem autorização escrita para usar o Mochi, os personagens do Lumen são originais; a Bússola continua somente como ícone do app. O aceite visual explícito cobre a lineup, as pranchas estáticas e as subetapas L1.4d-1, L1.4d-2, L1.4d-3 e L1.4d-4 (incluindo os ajustes de `working` com computador e `PC Memória` com pente horizontal de RAM em `afc7552`). As aprovações visuais não fecham o checkpoint real L1.4 nem validam o app em uso real; os limites de medição da comparação continuam registrados.
3. **L2.1 e L2.2 sintéticas concluídas:**
   - L2.1 sintética passou e a `0.6.14` foi publicada em 2026-11-13 (659 testes Node, build Vite e 660 testes Rust com 8 ignorados; CIs `43477378762` e `43482202733`).
   - L2.2 (chat usando o login OAuth `"Plano ChatGPT"` / `provider: "chatgpt"`, catálogo `/models`, streaming `/responses` com `store: false`, renovação serializada de token e UI em chat/Configurações) concluída sinteticamente em 2026-11-14: `npx tsc --noEmit`, 673 testes Node, `npm run build` (`vite build`) e 664 testes Rust (8 ignorados) passaram com mocks loopback. Release `windows-v0.6.15` compilada, empacotada (`npm run pack`), verificada com Microsoft Defender (`1.463.288.0`, sem ameaças) e publicada 100% localmente via `gh release` (`no-github-actions`), entregando L1.4d-3, L1.4d-4 e L2.2 juntas para validação real no notebook (upgrade sintético destrutivo local não foi executado neste perfil). Próxima etapa: L3.
4. Achados do QwenPaw registrados em [research/qwenpaw.md](research/qwenpaw.md) e marcados "(QwenPaw)" em L2, L3, L4, L6, M0, M1, M5, M8 e M9.

## Pendências do dono

- Informar os resultados reais pendentes da instalação da 0.6.13 (MSI/NSIS, settings, hooks, permissões e atualizador).
- Testar o login e o chat ChatGPT reais (L2.1 + L2.2); nenhum teste real do Sign in with ChatGPT nem das chamadas `/models` e `/responses` com conta real foi executado.
- Validar no uso real os novos personagens e animações no app (L1.4), além de L1.3 e do fluxo real ChatGPT (Checkpoint L2).
- Validações reais abertas nas fases 0, 1 e 2 (ver inventário da L0 na Fase L).
