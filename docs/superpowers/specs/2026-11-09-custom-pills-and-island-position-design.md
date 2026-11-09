# Pílulas configuráveis e posição livre da ilha — desenho

## Intenção

Permitir que o usuário escolha quais pílulas do Coucou aparecem e tire a ilha do centro quando ela cobrir algo importante. O foco deste desenho é o aplicativo Windows do fork.

## Como funciona hoje

- `windows/src/core/pills.ts` já cataloga Codex e Antigravity; `windows/src/settings/main.ts` já oferece seleção de pílulas e integrações, com quatro vagas além da pílula principal.
- Os padrões em `windows/src/core/state.ts` e `windows/src-tauri/src/settings.rs` selecionam Resend, n8n, Vercel e GitHub. Grok Bot ainda não está no catálogo Coucou.
- A Fase 2B do roadmap registra que o Orca instala um hook para Grok. O formato exato do evento deve ser confirmado antes de fixar a ligação.
- A posição usa `islandCorner`: centro superior e quatro cantos. `windows/src-tauri/src/island.rs` calcula uma posição fixa; mover o Mochi na área de trabalho não move a ilha.

## Abordagens consideradas

1. **Manter os locais atuais e adicionar arraste horizontal no topo — escolhida.** Reaproveita os seletores e dados de posição existentes, preserva os quatro cantos e adiciona uma posição superior personalizada. É a menor mudança que atende ao pedido sem retirar opções atuais.
2. **Substituir os locais fixos por posição livre.** Reduz os controles, mas remove os quatro cantos e muda o comportamento existente sem necessidade.

Para as pílulas, reutilizar `activeIntegrations`, `mainPill` e as seções atuais de configurações, sem criar uma segunda lista nem remover serviços do produto.

## Objetivos

- Manter Claude Code como pílula principal.
- Selecionar por padrão Codex, Antigravity, Grok Bot e GitHub nas quatro vagas existentes.
- Deixar Resend, n8n e Vercel desligados por padrão, mas ainda disponíveis para seleção posterior; desligá-los não apaga credenciais.
- Fazer uma pílula de agente habilitada permanecer visível em estado ocioso, como as pílulas declaradas atuais.
- Representar Grok Bot com o ID Coucou estável `agent_grok` e receber seus eventos pela integração de agente. A hipótese é usar o hook do Orca já citado no roadmap, sem criar integração de chat/API xAI.
- Permitir arrastar a ilha horizontalmente enquanto ela está no topo, mantendo-a dentro dos limites do monitor selecionado e salvando a posição para a próxima abertura.
- Preservar as posições atuais; `islandCorner = "topCustom"` identifica o modo livre e `islandTopX` guarda a posição normalizada de 0 a 1. Selecionar “centro superior” volta ao centro.

## Limites e cuidados

- Manter o limite atual de quatro pílulas secundárias e os IDs já publicados.
- Aplicar apenas ao Windows neste plano; não alterar macOS, Android ou os recursos das integrações de serviço.
- Só iniciar o arraste a partir de área sem controle interativo, após ultrapassar o limiar de movimento; cliques em botões continuam clicando.
- A posição livre altera apenas X. A altura e o recuo superior continuam sendo calculados pelo monitor; os modos de canto continuam intactos.
- Guardar `islandTopX` como posição horizontal normalizada entre 0 e 1 para que mudanças de resolução e escala não coloquem a ilha fora da tela. Limitar o valor ao aplicar a geometria.
- Migrar a lista antiga somente quando ela for exatamente igual ao padrão enviado anteriormente (`Resend`, `n8n`, `Vercel`, `GitHub`); preservar qualquer lista diferente. Uma pessoa que escolheu deliberadamente exatamente o padrão antigo também receberá o novo padrão.
- Confirmar o evento e o nome que o hook do Orca usa para Grok antes de implementar; a pílula não deve aparecer conectada se não houver um caminho de eventos funcional.

## Fora do escopo

- Remover código de Resend, n8n ou Vercel, limpar chaves salvas ou alterar suas integrações.
- Criar uma integração de chat/API da xAI.
- Arraste vertical livre, mudança de monitor por arraste ou redesign geral da ilha.

## Decisões que ficam para quem implementar

- Escolher a região vazia mais adequada da barra superior como área de arraste, após conferir os controles atuais; não adicionar um modo de reposicionamento separado.
- Confirmar no hook do Orca se os eventos de Grok já usam o formato genérico do Coucou ou precisam de uma tradução pequena, preservando o fluxo de segurança do relay.
- Acrescentar verificações de catálogo/configuração e geometria junto aos testes existentes, além de conferir visualmente o arraste no Windows.
