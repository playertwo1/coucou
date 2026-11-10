# Mochi Assistant no roadmap do fork
Status: concluído, confirmado pelo proprietário em 2026-11-09 · Início: 2026-11-09
Objetivo: encaixar o plano "Mochi Windows Assistant" (pacote de planejamento de 2026-11-09) no `docs/ROADMAP-FORK.md`, em fases e subfases curtas.

## Contexto levantado (fatos, não decisões)
- O pacote parte do zero e pede um ADR "fork ou app novo"; o fork já existe na `windows-v0.6.2`.
- Já existem no Coucou: voz (ditado Parakeet, "OK Coucou"), agentes de programação (Fase 2B), Android com pareamento, release.
- Novo de verdade: controle nativo do Windows, computer use, automação web, Obsidian, motor de permissões por risco, rotinas.
- Conflito: o pacote cita "telemetria local opt-in"; o `CLAUDE.md` proíbe telemetria.

## Decisões
### D1 - Onde o assistente é construído
- Pergunta: repositório novo, este fork, ou fork + serviço separado?
- Decisão: dentro deste fork; fases novas no `docs/ROADMAP-FORK.md`, código em `windows/`.
- Por quê: reaproveita ilha, chat, voz, hooks e Android que já existem.
- Descartado: repositório novo (refaz o que já temos); serviço separado (duas peças para instalar).
- Difícil de reverter: não

### D2 - Posição na fila
- Pergunta: onde as fases do Mochi entram em relação às Fases 0, 1, 2, 2B e 2C?
- Decisão: depois de 2B e 2C.
- Por quê: fechar primeiro a paridade entre agentes e as pílulas configuráveis; o assistente começa sobre uma base estável.
- Descartado: logo após a Fase 0 (recomendação inicial); imediatamente; em paralelo.
- Difícil de reverter: não

### D3 - Cérebro do assistente
- Pergunta: quem interpreta o pedido e escolhe a ferramenta?
- Decisão (palavras do proprietário): "assinatura via OAuth; os que não conseguir via OAuth vai via CLI". Sem chave de API paga, sem modelo local.
- Interpretação (minha, a confirmar na descoberta): usar as assinaturas já conectadas por OAuth; onde o provedor não permitir usar o login OAuth direto, o pedido passa pela CLI oficial dele (`cli_relay.rs`). As ferramentas do Mochi ficam expostas como servidor MCP local para qualquer um dos dois caminhos.
- Por quê: sem custo extra por uso; aproveita o login que a Fase 2.11 já mostra em Settings.
- Descartado: chave de API paga; modelo local.
- Difícil de reverter: não

### D4 - Capacidades novas no escopo
- Pergunta: quais capacidades do pacote entram no roadmap agora?
- Decisão: todas as quatro: controle nativo do Windows, Obsidian, computer use (Agent Desktop) e automação web (Agent Browser).
- Por quê: o proprietário quer o assistente completo.
- Descartado: parquear alguma delas.
- Difícil de reverter: não

### D5 - Quando pedir clique
- Pergunta: em qual nível de risco o Mochi pede confirmação?
- Decisão: baixo executa direto; médio pede clique na primeira vez, com "sempre permitir esta ferramenta"; alto pede clique toda vez, sem lembrar.
- Por quê: comandos simples ficam rápidos; o que é destrutivo nunca passa sem clique.
- Descartado: médio e alto sempre; tudo com clique.
- Difícil de reverter: não

### D6 - Acesso ao Obsidian
- Pergunta: plugin Local REST API ou arquivos direto?
- Decisão: ler os `.md` direto na pasta do cofre, só nas subpastas autorizadas; começa somente leitura; gravação com prévia, backup e clique.
- Por quê: sem plugin, sem chave, funciona com o Obsidian fechado.
- Descartado: plugin Local REST API (agora e como etapa futura).
- Difícil de reverter: não

### D7 - Voz
- Pergunta: instalar whisper.cpp, Piper e openWakeWord, ou reusar a voz do Coucou?
- Decisão: reusar ditado Parakeet, resposta falada e "OK Coucou" (`windows/src-tauri/src/voice/`). Item condicional: só comparar com whisper.cpp/Piper se o pt-BR ou a voz atual forem ruins nos testes.
- Por quê: as três peças já existem; trocar seria refazer o que funciona.
- Descartado: trocar pela pilha do pacote.
- Difícil de reverter: não

### D8 - O que o celular pode mandar fazer
- Pergunta: o Android dispara ferramentas do Mochi? Com qual limite?
- Decisão: o celular aprova tudo; o clique no celular vale como confirmação também para ações de risco médio e alto.
- Por quê: praticidade longe do PC.
- Descartado: só risco baixo pelo celular (recomendação inicial); celular só acompanha; acesso pela internet.
- Risco aceito: um celular perdido ou desbloqueado pode aprovar ações destrutivas. Ver D9 para a proteção.
- Difícil de reverter: não

### D9 - Proteção da aprovação pelo celular
- Pergunta: que proteção tem o clique do celular em ações de risco alto?
- Decisão: risco baixo e médio só com o toque; risco alto exige digital ou rosto no Android antes de enviar a aprovação. Só rede local, só celular pareado e revogável no PC.
- Por quê: limita o dano de um celular desbloqueado na mão de outra pessoa.
- Descartado: biometria também no médio; só o toque.
- Difícil de reverter: não

### D10 - Extras do pacote
- Pergunta: quais extras da última fase entram agora?
- Decisão: entram Rotinas, Memória avançada (Mem0/Graphiti) e Gateway/observabilidade (LiteLLM/Langfuse). Conectores externos (n8n, PowerToys, LocalSend, KDE Connect) ficam parqueados.
- Por quê: decisão do proprietário; a recomendação era só Rotinas.
- Descartado: parquear memória avançada e gateway/observabilidade.
- Observação (minha): com o cérebro por assinatura (D3), LiteLLM tem pouco a rotear, e Langfuse precisa respeitar "sem telemetria" (só local). Cada um começa por uma subfase de avaliação antes de instalar.
- Difícil de reverter: não

### D11 - Formato do roadmap
- Pergunta: arquivo único ou dividido?
- Decisão: `docs/ROADMAP-FORK.md` vira índice curto (regras, ordem, estado de cada fase); cada fase vai para um arquivo em `docs/roadmap/`. As fases atuais (0, 1, 2, 2B, 2C, 3) são movidas sem mudar o conteúdo.
- Por quê: a IA abre o índice e só o arquivo da fase em que trabalha.
- Descartado: arquivos só para o Mochi; tudo no arquivo único.
- Difícil de reverter: não

### D12 - Ordem das fases do Mochi
- Pergunta: em que ordem as fases novas são executadas?
- Decisão: M0 Descoberta e licenças → M1 Fundação (ferramentas, permissões por risco, registro local) → M2 Windows nativo → M3 Obsidian → M4 Voz ligada às ferramentas → M5 Computer use → M6 Web → M7 Android → M8 Rotinas → M9 Memória avançada e gateway/observabilidade → M10 Release.
- Por quê: do mais simples e seguro para o mais arriscado.
- Descartado: computer use e web antes; Android mais cedo.
- Difícil de reverter: não

## Aplicado por regra do projeto (não foi pergunta)
- Sem telemetria: a "telemetria local opt-in" do pacote não entra. Fica só um registro local e redigido das ações do Mochi, sem envio.
- Segredos no cofre de credenciais do sistema; nada de shell livre exposto à IA; conteúdo de páginas, arquivos e notas tratado como dado, nunca como instrução.
- Nenhuma tela ou pílula existente muda de visual; frases novas nas 13 línguas.
- O ADR-001 do pacote ("fork ou app novo") fica resolvido por D1.

## Em aberto
- Onde Agent Desktop e Agent Browser entram: instalados à parte e chamados como processo, ou embutidos. Decidir na M0, depois de conferir licença e manutenção de cada um.
- Onde guardar o registro local e as permissões "sempre permitir" (arquivo de settings atual ou SQLite). Decidir na M1.
- Quais subpastas do NexusVault o Mochi pode ler e onde fica a inbox. O proprietário escolhe na M3, depois do inventário somente leitura.
- Por provedor (Claude, ChatGPT, Gemini): o login OAuth pode ser usado direto pelo Coucou, ou só pela CLI oficial? Verificar termos e viabilidade na fase de descoberta antes de escrever código.
## Próximos passos
1. Proprietário confirma este entendimento.
2. Mover as fases atuais para `docs/roadmap/` sem mudar o conteúdo e transformar `docs/ROADMAP-FORK.md` em índice.
3. Escrever um arquivo por fase M0–M10, cada um com subfases curtas, checkpoint e dependências.
4. Mover os conectores externos para "Parqueado".
