# Roadmap do fork (playertwo1/coucou) — Windows

Ponto de partida: `main` com a 0.6 do upstream (merge #1075). Muito do que era "só Mac"
**já existe no Windows** nessa versão: ditado Flow (segurar tecla + Parakeet), Notetaker
(WASAPI loopback), « OK Coucou », Spotify, uso do plano Claude/Codex, "Abrir terminal",
Outlook clássico, resumo semanal, sons próprios. Esses itens só precisam ser **testados**.

Esforço: P = dias · M = 1–2 semanas · G = mais que isso.

## Fase 0 — Validar o que já veio na 0.6
- [ ] Ditado Flow: baixar o Parakeet, segurar a tecla, colar em VS Code, navegador, Windows Terminal
- [ ] Notetaker: gravar uma chamada (Meet/Teams/Discord) e conferir transcrição + resumo
- [ ] « OK Coucou » com a chave da Anthropic
- [ ] Hook do Claude Code: aprovar/negar pela ilha, "Abrir terminal" no Windows Terminal
- [ ] Spotify, uso do plano, resumo semanal
- [ ] Reiniciar o Windows e ver se abre sozinho (autostart)

## Fase 1 — Trazer o que ainda falta do Mac
| Item | Onde está no Mac | Esforço |
|---|---|---|
| Coucoudoro (pomodoro do Mochi) | `NotchBuddy/Sources/App/CoucoudoroController.swift` — no Windows só existem as strings | M |
| Ilha num canto da tela (em vez do topo central) | Settings → Display → Position | M |
| Arrastar o Mochi sobre uma janela para anexá-la como contexto do chat | "drag onto any window" | M |
| Botão de ditado no chat e na "Nova sessão" (o Flow já existe, falta o botão) | mic do chat | P |
| Atalho global para "Nova sessão do Claude Code" | Shortcuts | P |
| Enviar arquivo solto na ilha por e-mail via Outlook clássico (`mail/` já fala com Outlook) | Mail.app | M |
| Portfólio de cripto (carteiras + exchanges, só leitura) | Portfolio pill | G |
| Cal.com em calendário em vez de lista | Cal.com card | P |

Fora: Apple Music (não existe no Windows).

**Escolhidos para começar (decisão do dono):**
- [ ] Coucoudoro (item 1 da tabela)
- [ ] Botão de ditado no chat e na "Nova sessão" (item 6)
- [ ] Ilha num canto da tela (item 8)
- [ ] Assinatura e atualização próprias do fork (item 9): decidir entre certificado pago (remove o aviso do SmartScreen) ou manter a verificação por SHA-256 e o atualizador do `playertwo1/coucou`
- [ ] Trocar Spotify por **YouTube Music** (integração nova, no lugar do Spotify, que fica fora). Reaproveitar a leitura de sessão de mídia do Windows; muda a detecção do app e o comando de abrir.

Nota: o Spotify da Fase 0 continua sendo testado, porque é o que existe hoje.

**Ideias novas aprovadas (Fase 1B):**
- [ ] Notetaker em modo "anotar ideia": atalho global grava a sua voz sem chamada, transcreve com o Parakeet e salva a nota com data e hora (P)
- [ ] Modo reunião da ilha: o Mochi mostra que está gravando e as notificações menores se calam enquanto o Notetaker grava (P)
- [ ] Histórico pesquisável de transcrições, por palavra ou por pessoa (M)
- [ ] Coucoudoro ligado às sessões do Claude Code: tempo de foco por projeto e total do dia (M, depende do Coucoudoro)
- [ ] Ditar uma linha ao fim de cada ciclo do Coucoudoro e guardá-la no histórico do dia (P, depende do Coucoudoro)
- [ ] Playlist de foco no Coucoudoro com YouTube Music: abre ou pausa a música junto com o ciclo (P, depende do YouTube Music)

## Fase 2 — Ideias novas (força do Windows)
1. **Notificações nativas do Windows com Permitir/Negar** — quando a ilha está escondida ou há app em tela cheia; o clique continua explícito. (M)
2. **Modo jogo / tela cheia** — o Mochi some quando um jogo ou vídeo está em tela cheia e só reaparece para pedidos de permissão. (P)
3. **Custo e tokens por sessão** — ler os `.jsonl` locais do Claude Code (`~/.claude/projects`) e mostrar gasto do dia/semana por projeto, sem rede. (M)
4. **Pílula do Git** — branch, mudanças não commitadas e ahead/behind do projeto da sessão ativa; clique abre o diff. (P)
5. **Focar a aba exata do Windows Terminal** — hoje vai para a janela; ir para a aba/painel da sessão. (M)
6. **Histórico e busca de sessões** — linha do tempo das sessões passadas com o que cada uma fez, buscável. (M)
7. **Lançador rápido** — atalho global → digita (ou dita) o pedido → escolhe projeto → abre o Claude Code. Junta itens da Fase 1. (P)
8. **Vigia de testes/builds** — o Mochi reage quando `npm test`, `cargo build` ou o CI terminam (verde/vermelho). (M)
9. **Sugestões de regras de permissão** — "você aprovou `npm test` 12 vezes: quer adicionar em `settings.json`?" (mostra o diff, grava só com confirmação). (M)
10. **Vários monitores** — escolher o monitor da ilha ou seguir o mouse, como no Mac. (P, verificar se já existe)

## Fase 3 — Identidade própria (só se for distribuir)
- Novo nome, personagem e sons (o código é MIT; nome Coucou, Mochi e sons são © Louis Raillé)
- Novo `identifier` no `tauri.conf.json` (hoje `fr.louisraille.coucou`) para não colidir com o Coucou oficial
- Releases próprias no GitHub (`windows-vX.Y.Z`) para o atualizador do fork funcionar
- Assinatura de código (certificado) para não aparecer o aviso do SmartScreen

## Parqueado — para revisitar depois
- **Segunda Mente no Windows (Flutter desktop, opção 2).** Projeto grande: os plugins de celular (ML Kit, workmanager, health, pedometer, quick_actions, share_handler, agent_background_android) precisam de substituto ou saem no Windows. Exige revisar o D-042 em `segundamente/docs/DECISIONS.md`. Escopo ainda não escolhido: captura e relatório (recomendado), paridade total ou só leitura.
- **Ponte Notetaker → Segunda Mente via Google Drive.** O Notetaker salva a transcrição em `C:\Users\notefael\Google Drive` no formato `[HH:MM:SS] Nome: fala` (já aceito pelo importador do Segunda Mente) e o celular importa pelo "Importar transcrição". Em aberto: salvar sempre ao fim da gravação ou perguntar a cada vez. O texto vai para um serviço de terceiros, então precisa de aviso e opt-in.

## Como manter o fork em dia
`git fetch upstream && git merge upstream/main` — fazer antes de começar cada item.
