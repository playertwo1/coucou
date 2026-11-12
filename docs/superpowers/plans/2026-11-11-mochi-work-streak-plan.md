# Plano — Mochi sente as horas com os agentes (1.7d)

Spec aprovada: `docs/superpowers/specs/2026-11-11-mochi-feels-the-pc-design.md`.

## Escopo

- Portar `WorkStreak.swift`: guardar somente início e horário do último evento em memória; sem timer e sem persistência.
- Contar `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure` e `Stop`, como no Mac.
- Um intervalo de 20 min sem eventos ou com `idleSeconds >= 1200` zera a sequência; após 2 h, `tired = 0.7`; após 3 h, `tired = 1`.
- Combinar cansaço de trabalho e bateria com o maior nível; sono (`asleep`) continua exclusivo da bateria quase vazia.
- Reusar a amostragem visível de 3 s e a aplicação de humor já existentes para ilha e desktop. Não criar leitura em segundo plano, configuração, texto ou dependência.

## Arquivos previstos

- Novo `windows/src/mochi/work-streak.ts`: estado em memória e cálculo determinístico por timestamps explícitos.
- `windows/src/island/hooks.ts`: registrar os cinco eventos de trabalho no ponto de entrada do bridge.
- `windows/src/island/island.ts` e `windows/src/mochi/vitals.ts`: calcular o cansaço por sequência durante a amostragem existente e combiná-lo com a bateria.
- Novo `windows/tests/work-streak.test.mjs`; acrescentar cobertura de integração em `windows/tests/hooks.test.mjs` e de composição em `windows/tests/vitals.test.mjs`.
- `docs/roadmap/fase-1-recursos-mac.md`: registrar resultado, verificações e pendências depois da implementação.

## Interfaces de teste propostas — confirmar antes de escrever testes

1. **Sequência pura:** horários fornecidos pelo teste verificam os limiares de 2 h/3 h e o reset por 20 min de inatividade/eventos; pega erros de fronteira sem esperar tempo real.
2. **Hook pelo bridge existente:** `hooks.test.mjs` emite os eventos através de `registerHookHandlers`; verifica quais eventos contam e que eventos de sessão desconhecidos não contam.
3. **Composição do humor:** a interface pura de `moodFromVitals` verifica `max(cansaço da bateria, do trabalho)` e que `asleep` continua dependendo da bateria; pega regressões na integração com o motor.

## Aceite e validação

- Testes determinísticos cobrem abaixo, exatamente e acima de 2 h, 3 h e 20 min, sequência reiniciada e `idleSeconds` indisponível.
- Hook real entregue pelo bridge mantém os timestamps apenas em memória; desligar as reações mantém o Mochi calmo e não inicia leitura adicional.
- `npx tsc --noEmit`, `npm test` e `npm run build` em `windows`; sem Rust previsto nesta subfase.
- Atualizar o status da 1.7d somente após essas verificações. Sem teste de espera de 2–3 h em sessão real: os limiares são cobertos por tempo sintético; eventual conferência visual fica identificada como manual.

## Pré-condições

- Seams confirmados pelo proprietário em 2026-11-11: timestamps puros; `hooks.test.mjs` via `registerHookHandlers`; composição em `moodFromVitals`, com `asleep` exclusivo da bateria.
- `State.paused` (decisão de 2026-11-11): os cinco eventos de trabalho contam mesmo com a ilha pausada. Registrar antes do `return` de `handleHook`, sem revelar a ilha, sem som e sem mudar a recusa de pedido pendente. `StatusLine` fica fora.
- O proprietário pediu para avançar em 2026-11-11 com o checkpoint visual da 1.7c ainda aberto (ciclo de 3 s no app). `upstream/main` seguia contido no `HEAD` (`b1bc09d`).

## Rollback

Reverter o módulo novo e os três pontos de chamada; não há migração, configuração persistida ou dado em disco.
