# Plano da Fase 2.1 — notificações de permissão

Status: mini-spec aprovada pelo proprietário em 2026-11-12; exceção pontual ao checkout limpo autorizada nesta conversa para a prova sintética 2.1a, preservando alterações locais e sem commit. A exceção não libera a integração 2.1b.

Spec: `docs/superpowers/specs/2026-11-12-native-permission-notifications-design.md`.

## Execução em 2026-11-12

- Exceção ao checkout limpo confirmada pelo proprietário; trabalho anterior preservado, sem commit.
- Prova separada em `windows/probes/permission-toast`: compilada e executada sem permissões reais. Dois testes Rust passaram; `npm test` (614), build e verificação de traduções passaram.
- Windows aceitou `Show`, mas nenhum `Activated` chegou antes do limite local de 90 s. `Setting` retornou `0x80070490`. `Dismissed(TimedOut)` não foi tratado como decisão. Chave/atalho próprios ausentes após a limpeza.
- Pendente: confirmação visual e callback por clique humano, registro/ativação adequados, evento de falha e expiração nativa, NSIS/MSI. A prova não valida instalação. Não avançar para a integração.
- O proprietário confirmou que a notificação não apareceu. Entrega visual: FAIL. Caminho do Menu Iniciar e sessão interativa conferidos; ainda não há causa conclusiva. Antes de repetir com clique humano, resolver a falha de `Setting` e verificar a ativação desktop necessária.
- Reteste: Windows aceitando notificações (estado 5), identidade habilitada (`Setting=0`), mas novamente nada apareceu segundo o proprietário. Eventos da plataforma registraram encaminhamento à sessão 1. O erro inicial de `Setting` não explica sozinho a falha. Processo saiu com código 1 sem registrar limpeza; razão desconhecida, sem evento Application Error correspondente. Artefatos próprios removidos com conferência de destino/identidade. Investigar apresentação pela Shell e ciclo de vida antes de novas solicitações de clique; 2.1a continua aberta.

## Próximos passos

Retentativa solicitada pelo proprietário em 2026-11-12, com o Coucou instalado aberto: estado de notificações 5, `Setting=0`, `Show` com sucesso e `Dismissed(TimedOut)`. Nenhum callback de clique em 90 s; a prova encerrou com erro de timeout, sem decisão, e registrou sucesso na remoção de toast, atalho e identidade. Confirmação visual dessa tentativa ainda não recebida. O app instalado não foi fechado nem modificado; a prova continuou separada dele. 2.1a permanece aberta.

Retorno posterior do proprietário: o toast dessa retentativa apareceu e ele clicou em Permitir. Exibição e clique humano confirmados; recepção pelo processo não comprovada, pois a execução terminou por timeout sem callback. A prova passou a registrar ativador COM Win32 temporário próprio, incluindo `CustomActivator`, CLSID no atalho e classe/servidor COM. Não há nova dependência na aplicação; a prova declara diretamente `windows-core`, já transitiva no seu lockfile, para implementar as interfaces. Três testes Rust passaram, incluindo entrega pelo objeto COM e rejeição de identidade/pedido inválidos. Repetição ponta a ponta com clique humano ainda em validação.

A repetição com COM registrado terminou por timeout sem callback. `Show` foi aceito, estado 5 e `Setting=0`. Houve sucesso na remoção do toast, revogação da classe e exclusão das duas chaves COM, do atalho e da identidade. A confirmação humana dessa nova execução ainda não foi recebida; não correlacionar automaticamente o clique relatado na execução anterior com esta. A exibição anterior está provada; a ativação pela Shell ainda não. Não avançar para 2.1b.

O proprietário confirmou depois que também viu e clicou em Permitir na execução com COM. A recepção nativa continuou ausente. Um teste adicional de registro COM e `CoCreateInstance` entregou a ação sintética localmente; quatro testes Rust da prova passaram, sem provar o clique da Shell. Em seguida, o proprietário pediu uma versão inteira do app sem dados reais. A continuação foi direcionada ao ambiente `windows/synthetic`, conforme spec/plano `2026-11-12-synthetic-app-*`; próximos testes devem usar exclusivamente esse ambiente, sem a instalação normal ou contas reais. A notificação nativa continua pendente.

1. Revisar/aprovar a interação proposta, inclusive revisão no card quando um resumo seguro não identificar a operação por inteiro e a pendência de tela cheia até a 2.2. Preservar o trabalho local da captura; não limpar, mover ou commitar sem pedido. Antes de qualquer código, confirmar checkout limpo e upstream contido.
2. Executar apenas 2.1a: prova nativa com dados sintéticos, sem conectar `pipe::answer`. Verificar entrega, clique, falha, fechamento e expiração; confirmar registro e remoção de identidade no desenvolvimento, NSIS e MSI. Registrar o backend escolhido e dependências necessárias. Não publicar instalador/release como efeito desse teste.
3. Mapear todos os chamadores de `pipe::answer`, `recap::record_decision`, `approvalDecision`, `beginApproval`, `endApproval`, remoção por fim de turno e desconexão. Definir como uma decisão nativa de item enfileirado remove somente esse item. Preservar consumidores do Phone Link e demais agentes.
4. Adicionar testes proporcionais no módulo nativo/pipe e em `windows/tests/hooks.test.mjs`: associação válida, ID inválido, dois pedidos, duplicação, corrida com o card, expiração, reinício, fila cheia, perguntas e retomada do terminal. Somente fixtures sintéticas, sem decisões reais ou configuração de agentes.
5. Integrar o backend de 2.1a ao pedido aceito em `hooks.ts` via `bridge.ts`/`lib.rs`, preservando `ACK_TIMEOUT=800 ms` e `DECISION_TIMEOUT=108 s`. Capturar a visibilidade antes de abrir o card. Vincular callback à operação de consumo única e publicar fechamento do pedido à ilha.
6. Acrescentar textos em `extra.json` nas 13 línguas e executar testes Rust, TypeScript, build e verificação de traduções descritos na spec. Nenhuma mudança visual no card ou IDs de pílulas.
7. Validar manualmente os cenários com clique humano e registrar versão/ambiente/resultado. Notificações podem ser suprimidas pelo Windows; isso não é permissão nem motivo para alterar suas configurações. Deixar o cenário de tela cheia aberto até 2.2. Só fechar checkpoint com a evidência completa; sem commit, tag ou release sem pedido.
