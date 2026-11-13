> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M0 — Mochi: descoberta e licenças (P; sem código de produto)

Objetivo: trocar suposições por fatos antes de construir. Nada do app muda nesta fase. Provas de conceito ficam fora de `windows/src` e `windows/src-tauri/src` e não são publicadas.

Depende de: Checkpoint 2B.8 e Checkpoint 2C.3.

Resultado de cada subfase: registrar em `docs/superpowers/specs/AAAA-MM-DD-mochi-m0-<tema>.md`, sem segredos, prompts ou caminhos pessoais.

### M0.1 — Licenças e manutenção

- [ ] Para `vercel-labs/agent-desktop` e `vercel-labs/agent-browser`: ler a licença no repositório oficial, data da última release, suporte a Windows e forma de instalação.
- [ ] Classificar cada um: reuso direto, adaptador (processo separado), só inspiração ou rejeitar.
- [ ] Decidir se cada um é instalado à parte pelo usuário ou embutido no instalador; registrar o motivo.
- [ ] Repositórios de referência do pacote (Greninja, CatchAI, MoHan, Calabrass, PowerToys): só leitura para ideias. Antes de copiar qualquer trecho, registrar a licença dele.
- [ ] `understudy-ai/understudy` (MIT, conferido em 2026-11-11): só inspiração. É Node/TypeScript com helper Swift e a GUI só funciona no macOS; nenhum código serve ao app Tauri/Rust. As ideias aproveitadas estão marcadas "(Understudy)" em M1, M5 e M8; as rejeitadas, com motivo, em [parqueado.md](parqueado.md).
- [ ] (QwenPaw) `agentscope-ai/QwenPaw` (Apache 2.0, conferido em 2026-11-13; ver [pesquisa](../research/qwenpaw.md)): classificar o helper de computer use em Rust/Tauri (`console/src-tauri/src/computer_use_server/`, UI Automation, captura WGC, entrada e aprovação por *named pipe*) como alternativa ao Agent Desktop. O núcleo Python fica rejeitado.
- Checkpoint M0.1: tabela com licença, última release, classificação e forma de instalação para os dois repositórios-base e para o helper do QwenPaw.

### M0.2 — Cérebro por provedor

- [ ] Para Claude, ChatGPT/Codex e Gemini: verificar nos termos e na documentação oficial se o login OAuth da assinatura pode ser usado direto pelo Coucou ou só pela CLI oficial.
- [ ] Para cada CLI: confirmar se aceita um servidor MCP local, como ele é registrado e em qual arquivo de configuração.
- [ ] Ler `windows/src-tauri/src/cli_relay.rs` e `chat.rs`; anotar o que já existe para enviar pedido e receber resposta.
- [ ] Não gravar em nenhuma configuração de agente nesta subfase.
- Checkpoint M0.2: tabela por provedor com "OAuth direto: sim/não/proibido", "MCP local: sim/não" e a fonte consultada. Onde for proibido, o caminho é a CLI.

### M0.3 — Prova: volume

- [ ] Em um projeto de teste à parte, ler o volume master pela API de áudio do Windows.
- [ ] Alterar para um valor de teste, ler de novo e restaurar o valor original.
- [ ] Repetir 10 vezes; registrar falhas.
- Checkpoint M0.3: 10 de 10 com o valor original restaurado, sem `powershell` nem programa externo.

### M0.4 — Prova: desktop

- [ ] Com o Agent Desktop, listar as janelas abertas e localizar um controle no Bloco de Notas (app de teste).
- [ ] Repetir 10 vezes; medir tempo e falhas. Não clicar nem digitar em app real.
- Checkpoint M0.4: taxa de sucesso e tempo medidos; comportamento com janela minimizada anotado.

### M0.5 — Prova: web

- [ ] Com o Agent Browser, abrir `https://example.com` em perfil isolado e ler o título.
- [ ] Repetir 10 vezes; confirmar que o perfil principal do navegador do usuário não foi tocado.
- Checkpoint M0.5: taxa de sucesso medida; local do perfil isolado anotado.

### M0.6 — Mapa do que já existe

- [ ] Localizar no código Windows: cartão Permitir/Negar da ilha, envio de chat, voz (`voice/`), ligação com o celular (`phone_link/`), cofre de segredos (`secrets.rs`) e sessão de mídia.
- [ ] Para cada um, anotar o arquivo de entrada e se pode ser reutilizado sem mudar o visual.
- Checkpoint M0.6: tabela "função → arquivo → reutilizável sim/não" pronta para a M1.

### M0.7 — Fechamento

- [ ] Juntar as tabelas de M0.1 a M0.6 em um relatório curto.
- [ ] Listar bloqueios e perguntas que impedem a M1; cada uma com responsável.
- [ ] Atualizar o Estado da M0 no índice.
- Checkpoint M0: três provas reproduzíveis, nenhuma credencial no repositório, nenhuma configuração de agente alterada, e a decisão OAuth/CLI registrada por provedor.
