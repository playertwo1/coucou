# Coucou com dados exclusivamente sintéticos

Pedido explícito do proprietário nesta conversa: criar e continuar com uma versão do app que não toque em dados reais. Essa instrução substitui o teste com a instalação real aberta; a exceção de checkout sujo cobre esta preparação isolada. Preservar alterações locais, sem commit ou instalação sobre o Coucou real.

## Contrato

- Executável `coucou-synthetic`, separado do backend de produção. Reusar Wry/Tao já existentes no grafo de dependências, o mock das prévias e os cards da interface atual. Não chamar a inicialização Rust do Coucou nem registrar seus plugins, hooks ou IPC.
- Empacotar somente os assets construídos para a versão sintética. O host entrega arquivos de uma tabela compilada, sem resolver caminhos pedidos pela WebView no filesystem.
- Perfil WebView novo por execução em diretório exclusivo de teste. Não carregar perfil, configurações, histórico, credenciais, sessões ou provedores reais; sem singleton que se conecte à instalação existente.
- Nenhum canal IPC nativo, shell, listener de agentes, CLI, cofre de credenciais ou serviço externo. Navegação limitada aos assets da versão sintética; CSP bloqueia conexões externas. Não instalar nem alterar configuração de agente.
- Clipboard simulado em memória e permissões de dispositivos bloqueadas. Arraste de arquivo não ingere arquivo; `postMessage` não tem handler nativo.
- Fixtures inventadas para projeto, sessão, pedidos, sensores e respostas. Ações desconhecidas não alcançam backend: retornam ausência de resposta simulada.
- Controles de cenário fora do card existente, com indicação permanente de dados sintéticos. Frases novas no catálogo extra nas 13 línguas. Não renomear IDs de pílulas nem redesenhar cards existentes.

## Entrega e aceite

Comando próprio de build/execução e um executável desktop que mostra o Mochi e o card real de permissão alimentado por fixtures. Gerar pedido, permitir/negar e reiniciar os dados afeta somente a memória de teste. Testar o isolamento por comandos proibidos/sem backend e por conteúdo do host; inspecionar a janela renderizada. Nenhum checkpoint funcional do roadmap fica concluído por uma simulação. Notificação nativa ponta a ponta continua pendente até ser ligada explicitamente a este ambiente sintético.
