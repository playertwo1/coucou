# 2B.6 — Nova sessão com escolha de agente

Status: aprovada para implementação e avaliação sintética em 2026-11-13, conforme a decisão do proprietário de publicar uma versão por etapa e deixar o teste real para depois.

## Escopo

- Na tela existente de Nova sessão, permitir escolher Claude Code, Codex, Antigravity ou Hermes.
- Enumerar somente CLIs encontrados pelo localizador compartilhado do app; a enumeração não inicia processos nem lê credenciais.
- Manter projeto, seletor de pastas e comportamento da sessão existente. O agente escolhido fica visível no cartão e a última escolha fica no `localStorage` do próprio Coucou.
- A ponte chama `launch_session(folder, prompt, agent)`. Pasta inválida, agente ausente, cancelamento ou falha antes de iniciar o terminal não cria processo de agente.
- O agente é iniciado diretamente pelo `std::process::Command` em um console novo do Windows. O prompt é um único argumento argv, sem arquivo temporário, PowerShell, `cmd.exe` ou shell intermediário.
- Argv interativo: Claude `claude <prompt>`, Codex `codex <prompt>`, Antigravity `agy -i <prompt>`, Hermes `hermes chat -q <prompt>`. Não acrescentar flags de aprovação automática.
- A interface apresenta CLI ausente/falha com erro localizado e mantém o seletor acessível para escolher outro agente. Não grava configuração de Claude, Codex, Antigravity ou Hermes.

## Contratos

- `LaunchAgent`: enumeração serializada como `claude`, `codex`, `antigravity`, `hermes`.
- `launch_agents()`: retorna pares `{ agent, available }` na ordem acima.
- `launch_session(folder, prompt, agent)`: retorna `{ ok, error }`, com erros estáveis `invalidFolder`, `agentUnavailable` e `terminalStartFailed`.
- Prompt: sequência UTF-8 preservada, incluindo aspas, `;`, `&`, Unicode e quebras de linha. A pasta permanece argumento/cwd separado.

## Validação sintética

- Testes Rust de enumeração, resolução de `.cmd` para entrada JavaScript sem executar o shim, argumentos por agente, cwd, prompt malicioso/multilinha e falha antes do spawn.
- Testes TypeScript da escolha persistida, filtro de agentes indisponíveis, erro e cancelamento sem iniciar.
- Teste integrado sintético da ponte e do cartão usando somente CLIs e projetos fictícios; nenhum CLI real é executado.
- `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run synthetic:build`, `cargo test --offline --locked --lib`, verificação de 13 línguas e `git diff --check`.

## Aceite real pendente

Após a publicação, o proprietário testa cada CLI instalado, incluindo prompt com múltiplas linhas e caracteres especiais, pasta selecionada e falha/CLI ausente. Os testes sintéticos não afirmam que cada versão instalada aceita o argv nem que o console realmente abriu e criou a sessão.

## Rollback

Reverter somente os arquivos deste checkpoint; a escolha anterior fica no `localStorage` e configurações externas dos agentes não são alteradas.
