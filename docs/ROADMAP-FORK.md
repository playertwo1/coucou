# Roadmap do fork Windows Coucou — playertwo1/coucou

Atualizado em 2026-11-13. Fonte canônica de estado: este índice e os arquivos de fase em `docs/roadmap/`.

**Entrada para agentes:** [AGENTS.md](../AGENTS.md) · **Estado e próxima ação:** [STATE-FORK.md](STATE-FORK.md) · **Fase da vez:** [Fase L](roadmap/fase-l-lumen.md)

## Estado e regras de leitura

- Decisão do proprietário (2026-11-13; D-050 a D-055 da Segunda Mente): este fork vira o **Lumen**, o lado desktop da Segunda Mente. A [Fase L](roadmap/fase-l-lumen.md) vai na frente. Das fases 0, 1 e 2, fecha-se só o que está quase pronto. As fases 2B e 2C ficam pausadas. As fases M passam a se chamar "Lumen assistente" e vêm depois da L. O Lumen é só em pt-BR: a regra das 13 línguas abaixo não vale para a Fase L.
- Decisão do proprietário (2026-11-12): executar testes sintéticos em todas as fases e etapas. Ao concluir cada etapa, gerar uma nova versão e publicá-la no GitHub para o proprietário atualizar e testar no uso real. Registrar separadamente os resultados sintéticos e reais; publicação para teste não fecha checkpoint que exige validação real, e nenhum resultado sintético substitui essa validação. Esta é uma autorização recorrente para publicar cada etapa concluída.
- O fork está na `main`, com a versão `windows-v0.6.14` publicada (2026-11-13); o atualizador consulta as releases de `playertwo1/coucou`.
- A L0 foi concluída: as fases 0, 1 e 2 e as fases 2B/2C estão **Pausadas (D-053)**, com inventário e evidências em [Fase L](roadmap/fase-l-lumen.md). A 2.8a tem PASS sintético, mas `windows-v0.6.12` não tem release publicada; o preflight `43402455643` foi cancelado e não há varredura válida dos assets finais. O aceite real de 2.1–2.8a segue pendente nos limites indicados na Fase L.
- O aplicativo e várias features já têm código e testes, mas ainda falta validação manual em runtime. Não marque uma feature como concluída só porque compila.
- Esforço: P = pequeno, M = médio, G = grande. Estimativa serve para comparar itens; uma feature M/G deve ser subdividida antes da implementação.
- [ ] Pendente.
- [x] Feito, com a evidência exigida pelo checkpoint.
- Item implementado, mas com validação manual pendente: marcar o código/teste como feito e manter a caixa de runtime vazia.
- Uma etapa condicional só pode ser marcada como N/A depois de registrar a evidência que a tornou desnecessária ou impossível.

### Como executar uma etapa

1. Trabalhar em uma subfase por vez. Não começar a etapa dependente enquanto o checkpoint anterior não estiver fechado.
2. Antes de uma etapa de código: `git status` limpo; `git fetch upstream && git merge upstream/main`. Se houver conflito ou alteração local, parar e resolver isso antes de prosseguir.
3. Antes de código com UX ou comportamento novo, escrever uma spec curta em `docs/superpowers/specs/` e um plano em `docs/superpowers/plans/`. Incluir arquivos, interfaces, testes, aceite e rollback de migração quando houver.
4. Implementar a menor mudança que cumpre o aceite. Para Fase 2B, seguir TDD. Nas demais, acrescentar os testes proporcionais à lógica alterada.
5. Ao concluir uma etapa, rodar os testes sintéticos aplicáveis, criar a nova versão e publicar no GitHub para teste real do proprietário; registrar versão, ambiente, resultados sintéticos e falhas sem segredos, prompts ou caminhos pessoais. Fazer um commit por subfase concluída. Manter checkpoints reais abertos até o proprietário fornecer o resultado exigido.
6. A autorização recorrente do proprietário cobre a publicação no GitHub após cada etapa concluída; não publicar antes de passar os testes sintéticos nem apresentar a publicação como validação real.

### Restrições do projeto para todas as etapas

- Não redesenhar nem alterar o visual de telas e pílulas existentes sem pedido explícito.
- Não renomear IDs de pílula publicados.
- Frases novas da interface vão em `windows/src/i18n/extra.json`, nas 13 línguas; executar a verificação de i18n existente.
- Nunca aprovar permissão sem clique explícito. Se não houver clique ou a resposta falhar, o agente continua perguntando no próprio terminal.
- Nunca sobrescrever configuração de agente sem backup datado, diff visível e confirmação explícita. Preservar hooks de outras ferramentas.
- Nunca enviar e-mail automaticamente, fazer transação, armazenar chave em texto puro ou adicionar telemetria.
- Usar dados locais quando o item disser local/offline. Não fazer fetch, push, gravação ou alteração de arquivos como efeito colateral de uma pílula somente de leitura.

### Comandos de validação por tipo de mudança

- TypeScript e testes Windows: em `windows`, `npx tsc --noEmit` e `npm test`.
- UI/recursos de build: em `windows`, também `npm run build`.
- Rust do app Windows: em `windows/src-tauri`, `cargo test --lib`.
- Relay/hook: em `windows/hook`, `cargo test`.
- What's New de release: na raiz, `python3 scripts/test-whats-new.py`.
- Teste manual: usar a lista de cenários do checkpoint; não substituir por typecheck ou teste unitário.

## Fases e ordem de execução

Este arquivo é o índice. Abra somente o arquivo da fase em que você está trabalhando; o estado detalhado (caixas e checkpoints) fica nele. Ao fechar uma fase, atualize a coluna Estado aqui.

Decisões que deram origem às fases M: `docs/questionario/2026-11-09-mochi-assistant-roadmap.md`.

Pesquisas de projetos externos ficam em `docs/research/`; as ideias aproveitadas aparecem nas fases com a origem entre parênteses, como "(Understudy)" e "(QwenPaw)" ([research/qwenpaw.md](research/qwenpaw.md), 2026-11-13).

| Ordem | Fase | Arquivo | Estado |
|---:|---|---|---|
| 1 | 0 — Validar o que já existe | [fase-0-validacao.md](roadmap/fase-0-validacao.md) | Pausada (D-053; L0 concluída; 0.4 fechado) |
| 2 | 1 — Recursos do Mac ainda não escolhidos | [fase-1-recursos-mac.md](roadmap/fase-1-recursos-mac.md) | Pausada (D-053; 1.2 concluída; 1.3 e 1.4 descartadas) |
| 3 | 2 — Melhorias próprias do Windows | [fase-2-melhorias-windows.md](roadmap/fase-2-melhorias-windows.md) | Pausada (D-053; 2.8a sintética; 0.6.12 sem release) |
| 4 | L — Lumen + Segunda Mente | [fase-l-lumen.md](roadmap/fase-l-lumen.md) | Em andamento (0.6.14 publicada; avaliação real da migração e do login ChatGPT pendentes; L1.4a e L1.4d-1 com aceite visual; L1.4b entregue; Canvas escolhido na L1.4c em 2026-11-13; L1.4d-2 implementada e aguardando conferência visual antes de d3; L2.1 aprovada sinteticamente) |
| — | 2B — Paridade entre agentes e ambientes | [fase-2b-paridade-agentes.md](roadmap/fase-2b-paridade-agentes.md) | Pausada (D-053) |
| — | 2C — Pílulas configuráveis e posição livre | [fase-2c-pilulas-posicao.md](roadmap/fase-2c-pilulas-posicao.md) | Pausada (D-053) |
| 6 | M0 — Mochi: descoberta e licenças | [m0-descoberta.md](roadmap/m0-descoberta.md) | Pendente |
| 7 | M1 — Mochi: fundação | [m1-fundacao.md](roadmap/m1-fundacao.md) | Pendente |
| 8 | M2 — Mochi: controle nativo do Windows | [m2-windows-nativo.md](roadmap/m2-windows-nativo.md) | Pendente |
| 9 | M3 — Mochi: Obsidian | [m3-obsidian.md](roadmap/m3-obsidian.md) | Pendente |
| 10 | M4 — Mochi: voz ligada às ferramentas | [m4-voz.md](roadmap/m4-voz.md) | Pendente |
| 11 | M5 — Mochi: computer use | [m5-computer-use.md](roadmap/m5-computer-use.md) | Pendente |
| 12 | M6 — Mochi: automação web | [m6-web.md](roadmap/m6-web.md) | Pendente |
| 13 | M7 — Mochi: Android | [m7-android.md](roadmap/m7-android.md) | Pendente |
| 14 | M8 — Mochi: rotinas | [m8-rotinas.md](roadmap/m8-rotinas.md) | Pendente |
| 15 | M9 — Mochi: memória avançada, gateway e observabilidade | [m9-memoria-gateway.md](roadmap/m9-memoria-gateway.md) | Pendente |
| 16 | M10 — Mochi: release | [m10-release.md](roadmap/m10-release.md) | Pendente |
| — | 3 — Identidade própria (só com decisão do proprietário) | [fase-3-identidade.md](roadmap/fase-3-identidade.md) | Decidida em 2026-11-13: entra na Fase L, etapa L1 (Lumen) |
| — | Parqueado | [parqueado.md](roadmap/parqueado.md) | Estudo de personagens assumido pela L1.4; L1.4a aprovada; L1.4b em andamento |
| — | Checklist de release (só com pedido explícito) | [release-checklist.md](roadmap/release-checklist.md) | — |

As fases M ("Lumen assistente") só começam depois do Checkpoint L7. A dependência antiga dos Checkpoints 2B.8 e 2C.3 deve ser reavaliada antes da M0, porque as fases 2B e 2C estão pausadas. Dentro das fases M, a ordem é M0 → M10; uma fase não começa antes do fechamento da anterior, salvo onde o arquivo da fase disser o contrário.

## Regras das fases M (assistente Mochi)

Valem para M0–M10, além das restrições do projeto acima.

- **Ferramenta, não shell.** O modelo só chama ferramentas declaradas, cada uma com: id, descrição, schema de entrada, nível de risco, simulação (dry-run), execução, verificação do resultado, timeout, cancelamento e resumo para o registro. Nenhuma ferramenta executa comando de shell ou PowerShell montado a partir do texto do pedido.
- **Negado por padrão.** Ferramenta fora da lista habilitada não executa.
- **Risco e clique.** Baixo (reversível e local) executa direto. Médio (mudança persistente) pede clique na primeira vez, com "sempre permitir esta ferramenta". Alto (apagar, enviar dados, baixar arquivo, credenciais, energia, elevação) pede clique toda vez e nunca é lembrado. Sem clique ou em timeout, a ação não acontece.
- **Conteúdo externo é dado.** Texto de página, arquivo, nota ou mensagem nunca muda permissões nem vira instrução.
- **Ordem de preferência.** API nativa primeiro, acessibilidade (Agent Desktop) depois, visão só como último recurso.
- **Cérebro.** Assinaturas já conectadas por OAuth; onde o provedor não permitir, pela CLI oficial dele. Sem chave de API paga obrigatória e sem modelo local.
- **Registro.** Só local e redigido: ferramenta, hora, risco, resultado. Sem conteúdo de tela, texto privado, token ou caminho pessoal. Nada é enviado; não há telemetria.
- **Pausa rápida.** Um controle corta ferramentas, voz e pedidos do celular sem fechar o aplicativo.
- **Verificar depois de agir.** Toda ferramenta lê o estado depois da ação e relata falha como falha.

## Manter o fork atualizado

Antes de cada subfase de código, partir de árvore limpa, atualizar `upstream` e integrar `upstream/main`. Resolver e registrar conflitos antes da subfase; não misturar a resolução de upstream com a feature do checkpoint.
