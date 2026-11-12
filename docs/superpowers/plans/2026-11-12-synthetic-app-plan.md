# Plano: aplicativo sintético isolado

1. Preservar checkout e usar o pedido explícito do proprietário como autorização para criar esta variante de teste.
2. Reusar `dev/tauri-mock.ts`, a ilha e o card existentes; fornecer somente fixtures próprias e controles de cenário.
3. Criar host Wry/Tao independente, sem IPC, com assets compilados, perfil exclusivo, navegação e conexões bloqueadas fora da própria origem.
4. Bloquear clipboard/dispositivos reais e não carregar a inicialização/backend Rust de produção.
5. Testar fixtures, roteamento sem backend e assets; executar typecheck/build e testes pertinentes. Compilar, abrir e inspecionar a versão sintética.
6. Entregar comando e executável, registrar limitações e manter 2.1a aberta. Não criar commit, tag ou release.

## Resultado verificado em 2026-11-12

- Criado host independente `windows/synthetic/host`, sem backend do Coucou, Tauri ou IPC nativo. Assets incorporados; perfil WebView próprio por execução, confirmado no processo filho.
- Janela `Coucou Synthetic` aberta e inspecionada. Mantém a ilha/card existentes e indica dados sintéticos no rodapé. Projeto Jardim e sessão/pedidos inventados.
- Cliques automatizados em Permitir/Negar registraram somente decisões locais de `synthetic-request-1` e `synthetic-request-2`. Reiniciar zerou decisões, status e localStorage.
- Leitura nativa simulada retornou null; clipboard ficou na memória simulada; fetch externo foi bloqueado por CSP. Testes cobrem rejeição de navegação/arquivos arbitrários, comandos sem backend e consumo único de pedidos sintéticos.
- Typecheck/build sintético, `npm test` (618), verificação de traduções e dois testes Rust do host passaram. Nenhum commit, tag ou release.
- Sem integração com notificações nativas ou serviços reais; 2.1a continua aberta. Revisão independente: NOT_RUN (ferramenta de subagente não disponível); verificação feita na própria sessão, sem afirmar aprovação independente.
