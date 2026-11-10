> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Checklist de release (executar apenas com pedido explícito)

- [ ] CHANGELOG contém seção desta versão e README tem linha na tabela de versões.
- [ ] `windows/src/whats-new/whats-new.json` tem 1–4 itens em 14 línguas; `python3 scripts/test-whats-new.py` passa.
- [ ] A versão é idêntica em `windows/package.json`, `windows/package-lock.json`, `windows/src-tauri/Cargo.toml`, nas duas entradas de `windows/src-tauri/Cargo.lock` e em `windows/src-tauri/tauri.conf.json`.
- [ ] Build/installer não assinado gerado e SHA-256 conferido; não comprar nem exigir certificado.
- [ ] Tag `windows-vX.Y.Z` enviada ao fork; tag sozinha não inicia build.
- [ ] Rodar `gh workflow run windows.yml -R playertwo1/coucou --ref windows-vX.Y.Z`; conferir workflow, release e asset antes de declarar publicado.
- Nunca executar esta lista de publicação sem o proprietário pedir release.
