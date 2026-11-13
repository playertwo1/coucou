# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-13 · **Última release:** `windows-v0.6.11` (2026-11-13; publicação Lumen 0.6.13 pendente) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), L0 concluída; L1.1 escolhida (B); L1.2 implementada; L1.3 sintética aprovada; avaliação real pendente

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Pausadas (D-053); ver inventário L0 na Fase L |
| L | Em andamento. L0 concluída; L1.1 B escolhida; L1.2 implementada; L1.3 aprovada sinteticamente; publicação e avaliação real pendentes → L2 a L7 |
| 2B, 2C | Pausadas (decisão do dono, 2026-11-13) |
| M0–M10 | Viram "Lumen assistente"; começam depois do Checkpoint L7 |
| 3 (identidade) | Incorporada à L1 |

## Trabalho em andamento fora da `main`

- Worktree `../coucou-git-pill`, branch `codex/windows-git-pill`: pílula Git somente leitura.
- Worktree `../coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`: avaliação de notificações de permissão.
- Branch `codex/windows-permission-toast-synthetic`.
- Worktree `../coucou-lumen-identity`, branch `codex/l1-lumen-identidade`: L1.2 implementada; CI `43424866776` passou nos testes sintéticos MSI/NSIS; Defender aprovou os artefatos de preflight. Não alterar as worktrees anteriores nem o app sintético.
- Na worktree principal há alterações locais ainda não commitadas do app sintético (`windows/synthetic/`, testes e specs de 2026-11-12). Elas são do dono e ficaram fora do commit de reestruturação de 2026-11-13.
- As worktrees acima e as alterações locais do app sintético não foram alteradas nesta sessão. O preflight 0.6.12 `43402455643` foi cancelado; a tag existe, mas não há release publicada.

## Próxima ação

1. Fast-forward do commit L1 para `main` e publicar `windows-v0.6.13` após concluir o checklist de release.
2. Após a release, o proprietário atualiza o aplicativo e verifica a instalação/identidade no uso real; manter L1 em avaliação até receber esse resultado.

## Pendências do dono

- A direção visual B foi escolhida. Falta avaliar a versão instalada no uso real após a publicação.
- Validações reais abertas nas fases 0, 1 e 2 (ver inventário da L0 na Fase L).
