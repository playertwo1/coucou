> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Checklist de release (executar apenas com pedido explícito)

- [x] CHANGELOG contém seção desta versão e README tem linha na tabela de versões.
- [x] `windows/src/whats-new/whats-new.json` tem 1 item em 14 línguas; `python scripts/test-whats-new.py windows` passa.
- [x] A versão é idêntica em `windows/package.json`, `windows/package-lock.json`, `windows/Cargo.toml`, nas entradas `coucou` e `coucou-hook` de `windows/Cargo.lock` e em `windows/src-tauri/tauri.conf.json` (0.6.5).
- [x] Build/installer não assinado gerado e SHA-256 conferido; não comprar nem exigir certificado. Release `windows-v0.6.5`, setup `baf5092fdfaf1b7034a2a31a4d7184f782dd00b8dfba7aace870a09586ac05e9`, MSI `2f062e8c430e9a63f9882a3d17ce7d0b8eb86b240b7289e21cd2e6cd5c2c61d1`.
- [x] Antes da tag, executar manualmente `Windows` em `windows.yml` no branch de release; baixar os artefatos e examiná-los com Microsoft Defender. Preflight `43346487966`; Defender sem detecções.
- [x] Enviar a tag `windows-vX.Y.Z` ao fork. A tag `windows-v0.6.5` foi enviada; o evento não iniciou um run automaticamente.
- [x] Conferir a execução, a release e os assets em `playertwo1/coucou`; workflow manual no tag `43348587966` concluiu com sucesso e publicou [Windows 0.6.5](https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.5).
- [x] Comparar os SHA-256 dos instaladores publicados com o preflight. Os hashes diferiram; os assets finais foram baixados, conferidos com os digests do GitHub e examinados diretamente pelo Defender sem detecções (evento 1001, exame `{9AD2DD74-E9E4-4DCE-8E77-D2954870AA9F}`).
- Nunca executar esta lista de publicação sem o proprietário pedir release.
