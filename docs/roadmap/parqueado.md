> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Parqueado — não iniciar sem escolher escopo

### Segunda Mente no Windows

- [ ] Escolher um escopo: captura+relatório, somente leitura ou paridade total.
- [ ] Ler D-042 em `segundamente/docs/DECISIONS.md` e listar plugins Flutter sem suporte Windows.
- [ ] Criar spec que define o que funciona sem esses plugins e quais dados ficam locais.
- Checkpoint: sem escopo e decisão aprovados, não criar target Windows nem substituir plugins.

### Ponte Notetaker → Segunda Mente via Google Drive

- [ ] Decidir salvar automaticamente ao parar a gravação ou perguntar a cada chamada.
- [ ] Definir aviso, opt-in, formato, diretório e comportamento sem Drive instalado/conectado.
- [ ] Testar que nada é enviado sem opt-in e que reimportar não duplica a transcrição.
- Checkpoint: integração externa só começa após escolha do fluxo e aprovação da spec.

### Conectores externos do pacote Mochi

- [ ] n8n, PowerToys, LocalSend e KDE Connect: só voltam com um caso de uso real descrito pelo proprietário.
- [ ] Antes de qualquer integração, rever a licença e o custo de manter o conector.
- Checkpoint: sem caso de uso aprovado, não instalar nem integrar.

### Fora de escopo do Mochi por decisão (2026-11-09)

- Plugin Obsidian Local REST API: o cofre é lido direto pelos arquivos.
- Chave de API paga obrigatória e modelo local como cérebro.
- Acesso do celular pela internet (fora da rede local).
- Agendamento de rotinas por horário.
