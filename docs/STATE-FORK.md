# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-13 · **Última release:** `windows-v0.6.11` (2026-11-13) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), começando pela L0

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Em andamento. A L0 fecha só o que está quase pronto e pausa o resto |
| L | Próxima. L0 → L1 (renomear para Lumen) → L2 a L7 |
| 2B, 2C | Pausadas (decisão do dono, 2026-11-13) |
| M0–M10 | Viram "Lumen assistente"; começam depois do Checkpoint L7 |
| 3 (identidade) | Incorporada à L1 |

## Trabalho em andamento fora da `main`

- Worktree `../coucou-git-pill`, branch `codex/windows-git-pill`: pílula Git somente leitura.
- Worktree `../coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`: avaliação de notificações de permissão.
- Branch `codex/windows-permission-toast-synthetic`.
- Na worktree principal há alterações locais ainda não commitadas do app sintético (`windows/synthetic/`, testes e specs de 2026-11-12). Elas são do dono e ficaram fora do commit de reestruturação de 2026-11-13.

## Próxima ação

1. **L0:** listar nas fases 0, 1 e 2 o que só falta validar ou está a uma etapa do fim. Fechar isso e marcar o resto como pausado.
2. **L1.1:** protótipo com 2–3 opções de personagem, ícone e sons do Lumen para o dono escolher.

## Pendências do dono

- Escolher o visual do Lumen (L1.1).
- Validações nativas abertas nas fases 0, 1 e 2 (lista sai da L0).
