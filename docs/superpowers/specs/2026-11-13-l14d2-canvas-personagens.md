# L1.4d-2 — outros seis personagens em Canvas nos 11 estados

## Contexto e limite de aceite

A subetapa L1.4d-1 (commit `0d70004`, aprovada visualmente pelo proprietário em `2026-11-13`) implantou o motor base em `windows/src/lumen/compass-engine.ts` com primitivas Canvas originais e o personagem Codex nos 11 estados. Esta subetapa L1.4d-2 implementa os outros seis personagens nos 11 estados, mantém o Codex aprovado em d1 e atualiza a página de conferência para uso exclusivo em desenvolvimento. O aceite visual desta subetapa não fecha o checkpoint real da L1.4 nem autoriza início de d3 sem revisão do proprietário.

## Escopo

- **Personagens em Canvas:** manter `codex` e implementar `claude`, `chatgpt`, `antigravity`, `gemini`, `opencode` e `generic` em `windows/src/lumen/compass-engine.ts`, seguindo paleta, silhueta, acessório e proporções de `windows/design/personagens/README.md` e das pranchas aprovadas:
  - Claude Code (`#F5F6F8`): página vertical com canto superior direito dobrado e marcador areia (`#F4E8C9`) no topo esquerdo.
  - ChatGPT (`#10A37F`): balão circular com ponta lateral inferior direita, sem qualquer símbolo ou logotipo de marca.
  - Antigravity (`#E879F9`): gota vertical macia ladeada por duas bolinhas flutuantes.
  - Gemini CLI (`#8AB4F8`): dois volumes arredondados unidos formando um corpo duplo com um único rosto compartilhado na parte superior.
  - OpenCode (`#4ADE80`): retângulo alto arredondado com arco aberto transparente no topo e retalho areia (`#F4E8C9`) na base.
  - Genérico (`#F4E8C9` / `#26224B`): retângulo arredondado areia com oval/pílula índigo inferior e rosto deslocado acima do detalhe.
- **Mapeamento real de IDs:** usar os IDs reais presentes em `windows/src/core/pills.ts`, `windows/src/island/agents.ts` e `windows/src/core/providers.ts` sem inventar nem alterar IDs publicados:
  - `integration_claude` / `claude` → `claude`
  - `agent_codex` / `codex` → `codex`
  - `ai_openai` / `openai` → `chatgpt`
  - `agent_antigravity` / `antigravity` → `antigravity`
  - `agent_gemini` / `gemini` → `gemini`
  - `agent_opencode` / `opencode` → `opencode`
  - qualquer outro ID, `null` ou `undefined` → `generic`
- **Onze estados (`BotStateName`):** preservar as poses das pranchas aprovadas em `idle`, `working`, `thinking`, `approval`, `question`, `error`, `finished` e `sleeping`, e garantir diferenciação explícita nos três estados sem prancha:
  - `searching`: pose de `thinking` (bolinhas de pensamento) com olhos varrendo horizontalmente de um lado para o outro durante `update(dt)` (e deslocados no instante inicial).
  - `ratelimit`: olhos cansados (`tired`) e gota de suor azul-claro; nunca pose de dormindo.
  - `dizzy`: olhos em espiral, boca triste (`frown`) e balanço suave pelo `update(dt)`; nunca pose de pergunta (`o` / badge de pergunta).
- **Mini pílulas e ilha:** atualizar `windows/src/mochi/minibots.ts` para aplicar `task.color` nos seis personagens com silhueta própria e manter `null` no `generic` (areia/índigo do Lumen), preservando o comportamento Mochi fora do alias Win32.
- **Movimento e desempenho:** manter interface pública de `CompassEngine`/`BotEngine`, compatibilidade DPR 1 / 1,5 / 2, respeito a `prefers-reduced-motion` (sem movimento contínuo nem `busy = true`) e zero timers ou loops próprios (`setInterval`, `setTimeout`, `requestAnimationFrame`, animações CSS). `busy` permanece falso em `idle` e, com movimento normal, fica ativo apenas em animações transitórias ou nos estados `searching` e `dizzy` enquanto visíveis na ilha.
- **Página de conferência:** atualizar `windows/design/personagens/prototipo/l14d1-conferencia.html` para desenhar todos os 7 agentes × 11 estados em Canvas (22 e 96 px, DPR 1 / 1,5 / 2), mantendo comparação com as pranchas PNG aprovadas e rótulo explícito para os 3 estados sem prancha. Fora do build de release.

## Fora de escopo

- Animações gerais P1 (d3), P2 (d4) e P3 (L3–L7).
- Alteração de renderização do Mochi fora do alias Win32 em `windows/vite.config.ts`.
- Release, criação de instalador ou fechamento do checkpoint real L1.4.

## Arquivos e verificação

- `windows/src/lumen/compass-engine.ts`
- `windows/src/mochi/minibots.ts`
- `windows/design/personagens/prototipo/l14d1-conferencia.html`
- `windows/tests/lumen-character-engine.test.mjs`
- `LICENSE-ASSETS.md`, `docs/STATE-FORK.md`, `docs/ROADMAP-FORK.md`, `docs/roadmap/fase-l-lumen.md`, `docs/roadmap/parqueado.md`

Validação sintética exigida antes de apresentar a página: `npx tsc --noEmit`, `npm test`, `npm run build` (em `windows/`) e `cargo test --lib` (em `windows/src-tauri/`).

## Reversão

Um único `git revert` do commit da L1.4d-2 restaura o estado aprovado da L1.4d-1 sem impacto em dados ou configurações de usuário.
