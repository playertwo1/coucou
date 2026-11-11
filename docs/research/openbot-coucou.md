# O que aproveitar do OpenBot no Coucou

**Leitura feita em:** 2026-11-10  
**Repositório consultado:** [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot)

## Resumo

OpenBot é um workspace para agentes que executa ferramentas, navegadores e arquivos em computadores isolados, com políticas e auditoria no servidor. Coucou é principalmente um companheiro para sessões de agentes que já rodam no computador do usuário, com hooks, notificações e aprovações encaminhadas ao processo que está aguardando.

O melhor candidato a reaproveitamento é **AG-UI como opção de integração de agentes remotos**. O desenho do gateway de ações do OpenBot é uma boa referência caso Coucou passe a executar ferramentas remotas. Incorporar o OpenBot inteiro adicionaria serviços e dependências que não correspondem ao modelo atual do produto.

## O que pode valer a pena

| Área | Aproveitamento possível | Encaixe e custo no Coucou |
|---|---|---|
| **AG-UI / agentes externos** | Um adaptador poderia converter eventos AG-UI em sessões, passos e estados que Coucou já exibe. Isso abriria caminho para agentes servidos por frameworks diferentes, sem criar um parser por framework. OpenBot aceita endpoints AG-UI próprios e oferece um exemplo de integração com LangGraph. | **Melhor oportunidade, se houver demanda por agentes remotos.** Hoje Coucou recebe eventos por hooks e integrações locais. AG-UI é uma interface agente-servidor; por si só não fornece a Coucou uma assinatura de eventos das conversas do OpenBot. Uma integração real exigiria entender a API autenticada de conversas do OpenBot ou manter um pequeno adaptador que publique os eventos no formato interno do Coucou. Essa conclusão é uma inferência da arquitetura documentada. |
| **Barreira de ação e auditoria** | O `ComputerGateway` resolve alvos a partir de snapshots controlados pelo servidor, avalia políticas antes de agir, registra a decisão e só então encaminha a ação. A política prioriza negações e falha fechada. | **Referência para execução futura**, não algo para duplicar no acompanhamento atual. Os hooks do Coucou já deixam a decisão junto ao processo agente que está aguardando; duplicar autorização no cliente e no OpenBot criaria dois decisores. Se Coucou executar ações remotas, a autorização e a auditoria precisam morar no serviço que controla essa execução. |
| **Aprovações e entrega para a pessoa** | OpenBot documenta “permitir uma vez”, “permitir nesta conversa”, “permitir sempre”, negação e transferência de controle humano. Também separa pedidos de segredo do texto da conversa. | São padrões úteis para avaliar futuras aprovações remotas. Coucou já tem fila de aprovações e perguntas, e encaminha decisões do telefone ao host. Aproveitar a taxonomia faz sentido apenas quando Coucou for responsável por executar a ação; para uma sessão OpenBot, a política do OpenBot deve continuar sendo a autoridade. |
| **Computador isolado por agente** | Contêineres separados por pessoa ou agente guardam navegador, perfil e workspace próprios; o servidor usa tokens com escopo para chegar ao computador correto. | **Baixa prioridade para o produto atual.** Isso resolve o problema de hospedagem/execução de OpenBot e exigiria adicionar uma camada de serviço, contêineres e gestão de estado ao Coucou. É desproporcional para exibir e controlar sessões que já existem localmente. |

## Comparação com a implementação atual

- [`HookServer.swift`](../../NotchBuddy/Sources/App/HookServer.swift#L541) recebe eventos locais num socket Unix. Um pedido `PermissionRequest` mantém a conexão do hook aberta até a decisão, e a fila coordena vários pedidos. Isso é diferente do fluxo AG-UI usado pelo backend do OpenBot.
- [`AndroidLinkService.swift`](../../NotchBuddy/Sources/App/AndroidLink/AndroidLinkService.swift#L221) já publica sessões e pedidos pendentes do host para Android; o caminho de aprovação regressa ao hook no computador.
- [`normalize.rs`](../../windows/hook/src/normalize.rs) normaliza eventos de hooks no Windows. O trabalho de paridade em [`fase-2b-paridade-agentes.md`](../roadmap/fase-2b-paridade-agentes.md) está a validar adaptadores e capacidades por agente. AG-UI seria uma via adicional para agentes remotos e não substitui essas integrações locais.

## Recomendação

1. **Não incorporar o workspace OpenBot nem copiar seus serviços como dependências do Coucou.** Continuar a usar os hooks e adaptadores locais para os agentes que rodam no computador.
2. **Guardar AG-UI como uma integração separada a experimentar** caso a prioridade passe a incluir agentes hospedados ou frameworks sem hooks locais. O primeiro protótipo deve ser somente de leitura e mapear início/fim de execução, mensagens, chamadas de ferramenta e estado para a sessão Coucou existente.
3. **Se Coucou vier a executar ferramentas de agentes remotos**, desenhar uma única barreira no servidor: validar alvos e identidade, decidir política, registrar cada decisão e falha, e usar isolamento com credenciais de escopo limitado. A interface de aprovação sozinha não é uma barreira de segurança.

## Licença e dependências

O repositório OpenBot declara licença MIT, compatível com reutilização de código mediante preservação dos avisos de copyright e licença. Porém, o próprio README e a documentação de configuração tratam CopilotKit Intelligence como licenciado separadamente. Portanto, não se deve inferir que o runtime completo, serviços de memória ou a implantação em equipe são cobertos pela licença MIT do template.

## Fontes primárias

- [README do OpenBot — arquitetura, AG-UI, agentes externos e licença](https://github.com/CopilotKit/OpenBot/blob/main/README.md)
- [Arquitetura e fluxo de execução](https://github.com/CopilotKit/OpenBot/blob/main/docs/architecture.md)
- [ComputerGateway: autorização, resolução de alvos e auditoria](https://github.com/CopilotKit/OpenBot/blob/main/server/src/computer/gateway.ts)
- [Política de ações](https://github.com/CopilotKit/OpenBot/blob/main/server/src/computer/policy.ts)
- [Modelo de aprovações](https://github.com/CopilotKit/OpenBot/blob/main/docs/approvals.md)
- [Exemplo de agente LangGraph via AG-UI](https://github.com/CopilotKit/OpenBot/blob/main/agent-langgraph-agui/src/main.py)
- [Licença MIT do template](https://github.com/CopilotKit/OpenBot/blob/main/LICENSE)
- [Configuração e dependência de CopilotKit Intelligence](https://github.com/CopilotKit/OpenBot/blob/main/docs/configuration.md)
