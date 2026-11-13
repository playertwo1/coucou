# O que aproveitar do QwenPaw no Lumen e na Segunda Mente

**Leitura feita em:** 2026-11-13
**Repositório consultado:** [agentscope-ai/QwenPaw](https://github.com/agentscope-ai/QwenPaw), commit `f47dd19` (2026-11-13), versão 2.3.0
**Licença:** Apache 2.0. Compatível com o fork MIT: um trecho copiado mantém o aviso de copyright e a licença, e o arquivo marca o que mudou.

## Resumo

QwenPaw é um assistente pessoal com núcleo em Python, console web, app desktop Tauri (beta), TUI e mais de 15 canais de mensagem. Não tem app de celular: chega ao telefone pelos canais (Telegram, WeChat etc.).

O reaproveitamento útil é pontual: o helper de computer use em Rust/Tauri para Windows, os avisos do Windows com ação, as regras de segurança de ferramentas e algumas ideias de memória, personas e proatividade. O núcleo Python não serve ao Lumen.

## O que vale aproveitar

| Área | Onde está | Uso no nosso projeto | Etapa |
|---|---|---|---|
| Estados do pet por evento | `plugins/bundle/qwenpaw-pet/qwenpaw_pet_desktop/sprites.py` (`EVENT_TO_STATE`) | Lista de conferência dos estados dos personagens por agente: recebido, trabalhando, aguardando aprovação, concluído, erro, cancelado. O atlas de sprites (8×9 quadros por pet) é uma das duas opções avaliadas na L1.4. | L1.4 |
| Login ChatGPT por OAuth | `src/qwenpaw/providers/oauth/chatgpt.py` | Conferência do fluxo PKCE com callback em `127.0.0.1`. A fonte da L2 continua sendo a Segunda Mente. Não copiar a gravação do token cifrado em disco (o Lumen usa o Credential Manager). O fluxo deles usa `api.openai.com` com registro dinâmico de cliente; não está confirmado que dispense chave paga. | L2 |
| Personas em arquivos | `website/public/docs/persona.en.md` | Separar identidade e estilo (SOUL), perfil do usuário (PROFILE) e regras (AGENTS) ajuda a definir o formato das personas trocadas no sync. | L3, L6.4 |
| Aviso do Windows com ação | `console/src-tauri/src/notification_delivery/windows.rs` (237 linhas, Rust) | Toast com AUMID e ativação COM que abre o alvo certo; referência para Adiar, Concluir e Abrir. | L4.4 |
| Memória que evolui | `website/public/docs/memory-evolving-and-proactive.en.md` | Cada conclusão durável é um nó atualizado por uma de quatro ações: criar, corroborar, refinar ou corrigir. Evita acumular notas repetidas na "memória resumida". | L6.4, M9 |
| Heartbeat e proativo | `website/public/docs/heartbeat.en.md` | Perguntas fixas rodadas por intervalo, com janela de horário ativo. Esqueleto para o modo "mais ativo" (F14 da Segunda Mente) e para agendamento de rotinas. | M8, F14 |
| Regras de ferramenta e política | `src/qwenpaw/security/tool_guard/` (regras YAML de comandos perigosos, guardião de arquivos), `src/qwenpaw/governance/` | Referência para o registro de ferramentas e o motor de permissões. **Não copiar** o padrão deles: configuração inválida vira `AUTO` (falha aberta). O nosso falha fechado. | M1.1, M1.2 |
| Computer use nativo no Windows | `console/src-tauri/src/computer_use_server/` e `bin/qwenpaw-computer-use-helper.rs` (~2.800 linhas Rust: UI Automation, captura WGC, entrada, janelas, aprovação) | Mesma stack do Lumen. Helper em processo separado que recebe do app uma permissão curta por *named pipe* e pede aprovação no meio da chamada. Candidato a reuso direto ou adaptação, em alternativa ao Agent Desktop. | M0.1, M2.4, M5 |

## O que não vale a pena

| Item | Motivo |
|---|---|
| Núcleo Python e backend embutido no app | O próprio README cita 10 a 60 s na primeira abertura. Traria um segundo runtime e conflita com 0 % de CPU com a ilha escondida. |
| Modelos locais (QwenPaw-Flash, Ollama, LM Studio) | Regras M: sem modelo local. |
| Telemetria | Aceita automaticamente com `qwenpaw init --defaults`. O fork não tem telemetria. |
| Canais de mensagem (DingTalk, WeChat, QQ, Lark, Discord…) | Outro público; o celular já tem a Segunda Mente e o relay. |
| Túnel Cloudflare (`src/qwenpaw/tunnel/`) | Expõe o console na internet. O relay sem estado é mais seguro. |
| E-mail IMAP/SMTP (`packages/qwenpawmail-mcp`) | Exige senha de app e tem ferramentas de envio; a L5 usa MailCraft e proíbe enviar. |
| Kanban de agentes, Hub, marketplace, Creator, Data, checkpoints de código, multiusuário | Fora do escopo. O modelo de tarefas vem da F11-01 da Segunda Mente. |
| Janela do pet em Qt | Processo Python/Qt à parte. Se a L1.4 escolher sprites, eles são desenhados pela própria ilha do Lumen. |

## Limites desta leitura

Clone raso no Windows; alguns arquivos com caminhos incompatíveis não foram baixados. A interface web (`console/src`) e os canais foram vistos por amostragem. Nenhum código do QwenPaw foi executado.
