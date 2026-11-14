# Chat com internet e localização (Lumen Windows)

## Objetivo

O dono perguntou ao chat "amanhã vai chover em São Fidélis, RJ?" e o modelo respondeu que não tem acesso a tempo real nem a sites. O chat deve (1) buscar e ler páginas da internet para responder coisas atuais e (2) saber onde o usuário está, só quando ele informar isso.

## Como funciona hoje

- `claude.rs` (chave de API da Anthropic) já envia a ferramenta de busca do provedor (`web_search_20260209`) e o prompt diz que há busca.
- `chatgpt.rs` (Plano ChatGPT, `/responses`, `store: false`) não envia ferramenta nenhuma e usa `chat::system_prompt(false)`, que manda o modelo dizer que não tem acesso à web.
- `openai_compat.rs` (OpenAI, Google, OpenRouter por chave) e `local_chat.rs` são só conversa.
- O prompt de sistema não traz a data de hoje nem a localização.

## Abordagens consideradas

1. **Busca do próprio provedor (escolhida).** Ligar a ferramenta `web_search` no `/responses` do Plano ChatGPT, como o Claude já faz. A busca e a leitura das páginas acontecem no servidor do provedor que o usuário já conectou: nenhum destino de rede novo, mudança pequena. Limite: só o teste real dirá se o token do plano aceita a ferramenta.
2. **Ferramenta local em Rust.** O Lumen busca e baixa páginas e entrega o texto ao modelo. Serve a todos os provedores, mas exige laço de chamadas de ferramenta em três clientes, um serviço de busca novo, extração de HTML e proteção contra endereços internos, e o PC passa a acessar sites escolhidos pelo modelo. Fica como etapa futura se o teste real mostrar que o plano recusa a busca.
3. **Só clima (Open-Meteo).** Resolve o exemplo, não o pedido ("acessar a internet").

O dono delegou a escolha ("você escolhe o que for melhor"); as decisões abaixo são do agente.

## Contrato

### Internet

- `chatgpt.rs`: o corpo de `/responses` passa a levar `"tools": [{ "type": "web_search" }]` e o prompt vira `chat::system_prompt(true)`.
- Se o provedor responder HTTP 400 antes de qualquer texto com a ferramenta ligada, o Lumen repete o turno **uma vez** sem `tools` e com `system_prompt(false)`. O chat continua funcionando sem web e o modelo avisa que não tem acesso. Nenhum outro status entra nesse caminho (401 segue renovando o token; 404/429 seguem com as mensagens atuais).
- Eventos SSE da busca (`response.web_search_call.*` e itens de saída que não são texto) são ignorados; só `response.output_text.delta` e o texto final contam, como hoje.
- `claude.rs` não muda. OpenAI, Google, OpenRouter por chave e modelos locais ficam sem web nesta etapa.

### Localização

- Campo novo `chatLocation` (texto livre, ex.: `Cidade, UF`) em `settings.json`, vazio por padrão. Não é segredo, então não vai ao cofre; fica só no computador.
- Em **Configurações → Chat**, uma seção nova "Sua localização" (pt-BR, só no Lumen Windows), com um campo de texto, os botões **Salvar** e **Apagar**, e o aviso: "Opcional. Se você preencher, a cidade é enviada ao provedor do chat junto com cada pergunta, para respostas locais como clima e lugares. Apague para parar de enviar."
- Consentimento = o usuário digitar e salvar. Revogação = **Apagar** (grava vazio). Nada é detectado sozinho: sem geolocalização do Windows, sem IP.
- `chat::system_prompt` acrescenta ao prompt de todos os provedores do chat: a data local de hoje (`Today's date: AAAA-MM-DD`, necessária para "amanhã") e, se `chatLocation` não estiver vazio, `The user's location: <texto>`.
- O texto é aparado, perde quebras de linha e é cortado em 120 caracteres antes de ir ao prompt. Nunca aparece em log.

## Fora de escopo

- Geolocalização do Windows (pede permissão do sistema, devolve coordenadas e exigiria um serviço de geocodificação).
- Ferramenta local de busca/leitura de páginas; web para OpenAI, Google, OpenRouter e modelos locais.
- Interruptor para desligar a web (o Claude já busca sem interruptor).
- Mostrar fontes/links de forma especial na interface: o modelo cita no próprio texto.

## Aceite sintético

- O corpo de `/responses` leva `tools` com `web_search`, mantém `store: false` e `stream: true`.
- Com um servidor falso que responde 400 quando há `tools`, o turno é repetido sem `tools` e a resposta chega; a segunda requisição não tem `tools`.
- Um stream com eventos `response.web_search_call.*` entre os deltas produz só o texto.
- O prompt traz a data; traz a localização só quando o campo está preenchido; quebras de linha e excesso são removidos.
- `chatLocation` é lido e gravado em `settings.json` e ausente vira vazio.
- Testes só com dados sintéticos ("Cidade Exemplo, EX").

## Aceite real (NOT_RUN até o dono testar)

- Com o Plano ChatGPT e a cidade salva, perguntar "amanhã vai chover aqui?" e receber previsão atual.
- Apagar a cidade e confirmar que o modelo não sabe mais onde o usuário está.
- Registrar se o plano aceitou `web_search` ou se caiu no caminho sem web.
