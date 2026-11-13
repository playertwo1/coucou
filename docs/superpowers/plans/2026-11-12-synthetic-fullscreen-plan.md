# Plano da 2.2 sintética

1. Trabalhar na worktree isolada existente `C:\Users\notefael\projetos\coucou-permission-toast-2-1a`, branch `codex/windows-permission-notifications-eval`; a cópia principal do usuário fica intacta. O estado estava limpo; após `git fetch upstream`, `upstream/main` está contida (43 commits locais à frente, zero atrás) e `git merge upstream/main` confirmou `Already up to date`, sem conflito.
2. Manter a integração upstream separada da implementação 2.2. Não apagar, mover ou limpar a cópia principal nem outros worktrees.
3. Implementar a classificação geométrica Windows e o controle da janela nativa da ilha; manter a lógica independente de fixtures para testes, sem escrever configurações ou responder pedidos automaticamente.
4. Ligar a visibilidade ao ciclo de pedidos existente: a janela mostra enquanto permissão/pergunta aguarda decisão e some novamente quando o pedido termina sob tela cheia.
5. Testar transições, retângulos, monitor da ilha, pedido pendente e preservação das configurações; manter o controle sintético para inspecionar a interface.
6. Rodar verificações Windows e sintéticas, registrar evidências e publicar a versão de avaliação pelo fork. Teste de jogos/vídeos, Alt+Tab e hardware continua reservado ao proprietário.
