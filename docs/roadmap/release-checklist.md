> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Checklist de release (executar apenas com pedido explícito)

- [ ] CHANGELOG contém seção desta versão e README tem linha na tabela de versões.
- [ ] `windows/src/whats-new/whats-new.json` tem 1–4 itens em 14 línguas; `python scripts/test-whats-new.py` passa.
- [ ] A versão é idêntica em `windows/package.json`, `windows/package-lock.json`, `windows/Cargo.toml`, nas entradas `coucou` e `coucou-hook` de `windows/Cargo.lock` e em `windows/src-tauri/tauri.conf.json`.
- [ ] Build/installer não assinado gerado e SHA-256 conferido; não comprar nem exigir certificado.
- [ ] Antes da tag, executar manualmente `Windows` em `windows.yml` no branch de release; baixar os artefatos e examiná-los com Microsoft Defender.
- [ ] Enviar a tag `windows-vX.Y.Z` ao fork; o workflow dispara automaticamente ao receber a tag.
- [ ] Conferir a execução, a release e os assets em `playertwo1/coucou` antes de declarar publicado.
- Nunca executar esta lista de publicação sem o proprietário pedir release.
