# Plano — L1.4d-2 outros seis personagens em Canvas

1. **Mapeamento e tipos em `windows/src/lumen/compass-engine.ts`:**
   - Ampliar `LumenCharacter` para `"claude" | "codex" | "chatgpt" | "antigravity" | "gemini" | "opencode" | "generic"`.
   - Atualizar `characterForAgent` com os IDs reais (`integration_claude`/`claude`, `agent_codex`/`codex`, `ai_openai`/`openai`, `agent_antigravity`/`antigravity`, `agent_gemini`/`gemini`, `agent_opencode`/`opencode`) e fallback para `"generic"`.
   - Definir cores padrão da família e geometria facial (`eyeLeftX`, `eyeRightX`, `eyeY`, `mouthX`, `mouthY`) por personagem, preservando Codex exatamente como aprovado em d1.
2. **Desenho Canvas dos seis personagens:**
   - Implementar primitivas puras para Claude Code (página + canto dobrado + marcador areia), ChatGPT (balão circular sem marca), Antigravity (gota + duas bolinhas flutuantes), Gemini CLI (quatro arcos externos unidos formando dois volumes com rosto único), OpenCode (arco vazado com `evenodd` transparente + retalho areia) e ajustar Genérico (pílula/oval inferior e rosto acima dela conforme `generico-estados.png`).
3. **Estados `searching`, `ratelimit` e `dizzy` + `prefers-reduced-motion`:**
   - `searching`: badge de pensamento e varredura horizontal suave dos olhos pelo `elapsed` em `update(dt)` (parada e deslocada quando `prefers-reduced-motion`).
   - `ratelimit`: olhos cansados (`tired`) e gota de suor; sem pose de dormindo.
   - `dizzy`: olhos em espiral, boca `frown` e balanço suave pelo `elapsed` (sem pose de pergunta e parado quando `prefers-reduced-motion`).
   - Manter `busy = false` em `idle` e com `prefers-reduced-motion`; retornar `busy = true` para `searching` e `dizzy` apenas com movimento habilitado (sem afetar ilha oculta, que ignora `engine.busy`).
4. **Integração nas mini pílulas (`windows/src/mochi/minibots.ts`):**
   - Ajustar `setMiniAgent` para aplicar `hexToRGB(task.color)` quando `character !== "generic"` (ou `character === undefined` fora do alias Win32) e `null` para `generic`.
5. **Página de conferência e testes:**
   - Atualizar `windows/design/personagens/prototipo/l14d1-conferencia.html` para renderizar os 7 agentes × 11 estados em Canvas (22/96 px, DPR 1/1,5/2) ao lado das pranchas PNG aprovadas e indicar os 3 estados sem prancha.
   - Expandir `windows/tests/lumen-character-engine.test.mjs` cobrindo mapeamento dos 7 IDs reais + fallback, desenho de todos os 7 × 11 estados e 7 emotes, varredura de `searching`, balanço/espiral de `dizzy` (sem pose de `question`), `ratelimit` (sem `sleeping`), `idle` fora do loop, `prefers-reduced-motion` e ausência de timers/RAF.
6. **Documentação e verificação:**
   - Atualizar `LICENSE-ASSETS.md`, `docs/STATE-FORK.md`, `docs/ROADMAP-FORK.md`, `docs/roadmap/fase-l-lumen.md` e `docs/roadmap/parqueado.md` preservando histórico e sem antecipar aceite real.
   - Rodar `npx tsc --noEmit`, `npm test`, `npm run build` e `cargo test --lib`.
   - Conferir visualmente a página via servidor Vite em `/design/personagens/prototipo/l14d1-conferencia.html` (se navegador disponível) ou validar módulo/DOM/build.
   - Commit em português na branch `feat/l14d2-canvas-personagens`, push para `origin`, merge na `main` local e push para `origin/main` após validação, parando antes de d3.

## Rollback

Um `git revert` único do commit de L1.4d-2 desfaz toda a subetapa sem alterar configurações nem histórico anterior.
