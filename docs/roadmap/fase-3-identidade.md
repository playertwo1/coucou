> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase 3 — Identidade própria, somente se o proprietário decidir

- [x] Releases `windows-vX.Y.Z` do fork, SHA-256 e atualizador apontando para `playertwo1/coucou` já existem.
- [x] Decisão atual: sem certificado pago; instalador não assinado com SHA-256.
- [ ] 3.1 Decidir se Coucou/Mochi/sons devem ganhar nome/personagem/sons próprios; sem decisão, não alterar identidade visual.
- [ ] 3.2 Se aprovado, definir novo `identifier` e plano de migração dos dados/permissões existentes antes de mudar `tauri.conf.json`.
- [ ] 3.3 Testar upgrade da instalação atual, preservação de settings, hooks, permissões e caminho de update antes de publicar.
- Checkpoint 3: não mudar identifier/nome/sons até haver decisão e teste de migração aprovados. Certificado pago continua fora de escopo.
