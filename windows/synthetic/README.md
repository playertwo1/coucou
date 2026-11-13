# Coucou Synthetic

Versão desktop de teste solicitada pelo proprietário, alimentada somente por dados inventados. Reusa o Mochi, a ilha e o card de permissão do frontend atual; não carrega o backend Rust do Coucou instalado.

## Executar

Em `windows/`:

```powershell
npm run synthetic
```

O comando faz typecheck, compila os assets próprios e executa o host com Cargo offline. Não inicia `tauri dev`, hook relay, serviços ou a instalação normal. Após a compilação, também é possível abrir diretamente:

```text
windows/target/synthetic-host/debug/coucou-synthetic.exe
```

Os assets estão incorporados nesse executável. Ele depende do WebView2 já instalado no Windows. O título da janela é **Coucou Synthetic** e a indicação **Somente dados sintéticos** fica sempre visível. Não instala nem atualiza o aplicativo normal.

## Cenários disponíveis

- **Testar permissão:** gera um pedido do projeto inventado Jardim, sessão `synthetic-session`, com IDs `synthetic-request-N`.
- **Testar Git:** mostra um repositório fictício `synthetic/main` com dois arquivos inventados; o botão de diff exibe um exemplo fixo. Nenhum caminho real é lido e o Git não é iniciado.
- **Permitir/Negar no card:** registra a decisão somente em memória e a mostra no rodapé; o texto `echo "synthetic only"` nunca é executado.
- **Mock sintético do toast (testes automatizados):** cobre elegibilidade, botões, abrir/fechar, expiração, duas sessões e invalidação após decisão/reinício. Não exibe um toast do Windows nem chama o backend real.
- **Reiniciar dados de teste:** limpa o armazenamento da própria janela e recarrega os dados iniciais.
- Sensores usam números fixos inventados. Clipboard é simulado em memória. Integrações não configuradas e comandos não simulados retornam `null`, sem backend alternativo.

Essa é uma variante para testes de interface/estado, não uma cópia funcional de todos os serviços. Chat com provedores, serviços de e-mail, captura de tela, arquivos e notificações nativas não estão conectados.

## Isolamento

- Host independente com Wry/Tao, sem `coucou_lib`, plugins Tauri, handlers IPC, servidor de agentes, cofre de credenciais, leitor de sessões ou cliente HTTP do backend.
- Os comandos Tauri da interface são interceptados pelo mock já usado nas prévias. Nenhum comando desconhecido cai no aplicativo instalado.
- Um perfil WebView vazio é criado por execução sob `%USERPROFILE%\.codex\.tmp\coucou-synthetic\<execução>`. Não é usado o perfil do navegador nem o diretório de dados do Coucou. Os arquivos de cache ali pertencem apenas à instância sintética.
- O host atende somente assets compilados numa tabela; nenhuma URL vira caminho de leitura no computador. Navegação externa e novas janelas são recusadas.
- CSP `connect-src 'none'` bloqueia conexões iniciadas pela página; permissões de clipboard/dispositivos são negadas. O clipboard usado pela interface é substituído por memória; arraste de arquivos é bloqueado antes dos handlers do app.
- Não registra atalhos globais, autostart, protocolos de ativação, identidade de notificações, hooks ou configurações de agentes.

## Verificação

```powershell
node --import ./tests/setup.mjs --test tests/synthetic.test.mjs tests/i18n.test.mjs
cargo test --offline --manifest-path synthetic/host/Cargo.toml --target-dir target/synthetic-host
```

Na execução inspecionada em 2026-11-12, o card mostrou somente o projeto e o pedido inventados. Cliques automatizados em Permitir e Negar registraram `synthetic-request-1/allow` e `synthetic-request-2/deny` em memória. Uma chamada simulada de leitura nativa retornou `null`; o clipboard retornou somente a string de teste e uma conexão externa foi bloqueada por CSP. Reiniciar dados de teste zerou decisões, status e localStorage. O processo WebView filho confirmou o uso do perfil exclusivo sob `.codex/.tmp/coucou-synthetic`, sem perfil do app normal. A suíte completa passou com 630 testes; os 10 testes sintéticos passaram, e `npm run synthetic:build` compilou. A cobertura do toast testa somente o modelo em memória; não prova a notificação nativa nem fecha checkpoints do roadmap.
