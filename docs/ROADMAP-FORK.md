# Roadmap do fork Windows Coucou — playertwo1/coucou

Atualizado em 2026-11-12. Fonte canônica de estado: este índice e os arquivos de fase em `docs/roadmap/`.

## Estado e regras de leitura

- Decisão do proprietário (2026-11-12): executar testes sintéticos em todas as etapas; ao concluir cada etapa, criar uma nova versão e publicá-la no GitHub para que o proprietário atualize e valide no uso real. Registrar separadamente o resultado sintético e o aceite real; simulação nunca fecha um checkpoint de runtime. Preservar os requisitos Git e as alterações locais.
- O fork tem a versão `windows-v0.6.3` publicada; o atualizador consulta as releases de `playertwo1/coucou`.
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
5. Ao concluir uma etapa sintética, registrar versão, ambiente, cenários, resultados e limitações sem segredos, prompts ou caminhos pessoais; fazer um commit e publicar uma nova versão no GitHub, conforme a decisão do proprietário.
6. Manter em aberto a validação real até o proprietário atualizar e testar o aplicativo; não fechar checkpoint nativo por simulação.

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

| Ordem | Fase | Arquivo | Estado |
|---:|---|---|---|
| 1 | 0 — Validar o que já existe | [fase-0-validacao.md](roadmap/fase-0-validacao.md) | Em andamento |
| 2 | 1 — Recursos do Mac ainda não escolhidos | [fase-1-recursos-mac.md](roadmap/fase-1-recursos-mac.md) | Em andamento (1.2 concluída; 1.1 aguarda teste manual; 1.3 e 1.4 descartadas) |
| 3 | 2 — Melhorias próprias do Windows | [fase-2-melhorias-windows.md](roadmap/fase-2-melhorias-windows.md) | Em andamento (2.11) |
| 4 | 2B — Paridade entre agentes e ambientes | [fase-2b-paridade-agentes.md](roadmap/fase-2b-paridade-agentes.md) | Pendente |
| 5 | 2C — Pílulas configuráveis e posição livre | [fase-2c-pilulas-posicao.md](roadmap/fase-2c-pilulas-posicao.md) | Pendente |
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
| — | 3 — Identidade própria (só com decisão do proprietário) | [fase-3-identidade.md](roadmap/fase-3-identidade.md) | Aguardando decisão |
| — | Parqueado | [parqueado.md](roadmap/parqueado.md) | Não iniciar |
| — | Checklist de release (só com pedido explícito) | [release-checklist.md](roadmap/release-checklist.md) | — |

As fases M só começam com o Checkpoint 2B.8 e o Checkpoint 2C.3 fechados. Dentro das fases M, a ordem é M0 → M10; uma fase não começa antes do fechamento da anterior, salvo onde o arquivo da fase disser o contrário.

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
