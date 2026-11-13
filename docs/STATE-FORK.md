# STATE do fork — ponto de retomada

**Atualizado:** 2026-11-13 · **Última release:** [`windows-v0.6.13`](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.13) (Lumen, 2026-11-13; avaliação real pendente) · **Fase da vez:** [Fase L — Lumen + Segunda Mente](roadmap/fase-l-lumen.md), L0 concluída; identidade Lumen 0.6.13 publicada; personagens atuais mantidos por decisão do dono; L1.4 cancelada; L1.3 real em avaliação; L2.1 em andamento

Este arquivo guarda só o estado atual e a próxima ação. Fases, checkpoints e evidências ficam nos arquivos de `docs/roadmap/`, e a ordem fica no [ROADMAP-FORK](ROADMAP-FORK.md).

## Estado

| Fase | Estado |
|---|---|
| 0, 1, 2 | Pausadas (D-053); ver inventário L0 na Fase L |
| L | Em andamento. L0 concluída; L1.1 B escolhida; L1.2 implementada; L1.3 aprovada sinteticamente; avaliação real da migração pendente; L1.4 cancelada pelo dono; L2.1 em andamento por instrução do dono |
| 2B, 2C | Pausadas (decisão do dono, 2026-11-13) |
| M0–M10 | Viram "Lumen assistente"; começam depois do Checkpoint L7 |
| 3 (identidade) | Incorporada à L1 |

## Trabalho em andamento fora da `main`

- Worktree `../coucou-git-pill`, branch `codex/windows-git-pill`: pílula Git somente leitura.
- Worktree `../coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`: avaliação de notificações de permissão.
- Branch `codex/windows-permission-toast-synthetic`.
- Worktree `../coucou-lumen-identity`, branch `codex/l1-lumen-identidade`: commit `c3b2af2` está em `origin/main`; tag e release `windows-v0.6.13` publicadas. CI `43424866776` e CI da release `43428181413` passaram nos testes sintéticos MSI/NSIS; Defender não detectou ameaças nos artefatos do preflight nem nos instaladores finais. L1 aguarda avaliação real do proprietário.
- Na worktree principal há alterações locais ainda não commitadas do app sintético (`windows/synthetic/`, testes e specs de 2026-11-12). Elas são do dono e ficaram fora do commit de reestruturação de 2026-11-13.
- As worktrees acima e as alterações locais do app sintético não foram alteradas nesta sessão. O preflight 0.6.12 `43402455643` foi cancelado; a tag existe, mas não há release publicada.

## Próxima ação

1. O proprietário relatou que a identidade da 0.6.13 aparece ("aparece tudo"). Ainda faltam os resultados por cenário da migração real: tipo de instalação (MSI ou NSIS), settings, hooks, permissões e atualizador.
2. **L1.4 foi cancelada pelo proprietário:** manter os personagens atuais do Coucou sem mudanças; a Bússola Lumen fica somente como ícone do aplicativo. Não gerar sprites nem alterar os personagens.
3. **L2.1 está em andamento por instrução explícita do proprietário para avançar.** Isso não fecha L1.3: a avaliação real da migração permanece pendente. A spec e o plano estão em `docs/superpowers/specs/2026-11-13-l2-chatgpt-oauth.md` e `docs/superpowers/plans/2026-11-13-l2-chatgpt-oauth.md`.
4. Achados do QwenPaw registrados em [research/qwenpaw.md](research/qwenpaw.md) e marcados "(QwenPaw)" em L2, L3, L4, L6, M0, M1, M5, M8 e M9.

## Pendências do dono

- Informar os resultados reais pendentes da instalação da 0.6.13 (MSI/NSIS, settings, hooks, permissões e atualizador).
- Testar o login ChatGPT real depois da release de avaliação da L2.1.
- Validações reais abertas nas fases 0, 1 e 2 (ver inventário da L0 na Fase L).
