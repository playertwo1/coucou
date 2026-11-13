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

## Windows 0.6.14 — L2.1 Sign in with ChatGPT

- [x] Autorização recorrente do proprietário para publicar cada etapa depois dos testes sintéticos, registrada em `docs/ROADMAP-FORK.md`.
- [x] Validações locais: `npx tsc --noEmit`, `npm test` (659/659), `npm run build`, `cargo test --manifest-path windows/Cargo.toml -p coucou --lib` (660 passaram, 8 ignorados) e `python scripts/test-whats-new.py windows`.
- [ ] Workflow manual `Windows` no branch `codex/l2-chatgpt-oauth`; baixar e examinar com Microsoft Defender os artefatos de preflight.
- [ ] Integrar na `main`, publicar tag `windows-v0.6.14`, conferir o workflow e os assets finais no fork; comparar hashes do GitHub e examinar os instaladores finais com Defender.
- [ ] Proprietário validar login, consentimento, persistência, duas contas, troca e saída. Login real permanece **NOT_RUN** até esse teste.

## Windows 0.6.13 — Lumen

- [x] Pedido de publicação autorizado pelo proprietário; identidade Bússola de papel escolhida.
- [x] Validações locais: `npx tsc --noEmit`, `npm test` (659/659), `npm run build`, `cargo test --lib` (650 passaram, 8 ignorados) e `python scripts/test-whats-new.py`.
- [x] Preflight CI `43424866776` no commit `252639a1efcb670fc16d2b6f5f267688887b430b`: build/empacotamento, testes do app e Rust, notas de release, ícones e upgrades sintéticos MSI/NSIS passaram.
- [x] Microsoft Defender com assinaturas `1.463.281.0` examinou os artefatos baixados do preflight; nenhum arquivo foi detectado (evento 1001, 2026-11-13).
- [x] SHA-256 dos artefatos do preflight:
  - MSI `Lumen-Windows-0.6.13.msi`: `A73368E15A3A2DA184C933F8939D48BB43946307C5BA387EFBA28D3E43C77674`.
  - Setup `Lumen-Windows-0.6.13-setup.exe`: `E98CC0713117828F1E14E9F7A70EE4E26326C9CD61FD7C1BDA4549B4172A5F3A`.
  - App portátil `lumen.exe`: `36F318E2EA17528E9C749E1710E38D7B0B9A007EB9F021D5C9729433CE3818CC`.
  - Hook `lumen-hook.exe`: `3295B2EC302610524E58C3BB32AA84FC8D5CAAA4DD05DCEEABB3764EEA5CBF82`.
- [x] Commit `c3b2af2` enviado a `main`; tag `windows-v0.6.13` publicada. CI de release `43428181413` concluiu com sucesso: https://github.com/playertwo1/coucou/actions/runs/43428181413. Release: https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.13.
- [x] Assets finais baixados; SHA-256 local confere com os digests do GitHub. Os hashes diferem do preflight, então os instaladores finais foram examinados separadamente pelo Defender; nenhuma ameaça detectada (assinaturas `1.463.281.0`, evento 1001, 2026-11-13).
  - Setup `Lumen-Windows-0.6.13-setup.exe`: `FC60E4148044527FC78A4977EDA9B06636591D5C00CBD3D9BC2DF41C55F9D6B9`.
  - MSI `Lumen-Windows-0.6.13.msi`: `856D5CE0C08E51D236233803DF8C01766C6358B61178CBF977A371691E23EEB6`.
- [x] Release móvel `windows-latest` atualizada e verificada: contém somente `Lumen-Windows-setup.exe` e `Lumen-Windows.msi`; os dois assets antigos `Coucou-Windows-*` foram removidos dessa tag móvel. A release histórica `windows-v0.6.11` permanece disponível.
- [x] `README.md` e `windows/README.md` apontam os downloads, atualizações e nomes dos instaladores para Lumen. A tabela herdada de interações no guia Windows está identificada como não validada no app instalado.
- [x] Os instaladores não têm assinatura Authenticode (`NotSigned`); o fluxo não exige certificado e o Windows pode mostrar um aviso do SmartScreen.
- [ ] Proprietário instalará e avaliará no uso real; L1 permanece em avaliação até esse retorno.
