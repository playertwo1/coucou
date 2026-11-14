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

## Windows 0.6.17 — chat com internet e localização (publicação local)

- [x] Pedido do proprietário em 2026-11-14 para empacotar e, em seguida, autorização para publicar. Build local (GitHub Actions desabilitado). Os SHA-256 dos instaladores foram conferidos de novo e o Defender reexaminou o MSI e o setup sem ameaças antes da publicação. A tag aponta para o commit empacotado; a `main` recebeu depois um merge com as correções dos personagens (L1.4), ainda fora desta build.
- [x] Validações locais: `python3 scripts/test-whats-new.py windows`, `npx tsc --noEmit`, `npm test` (673/673), `npm run build`, `cargo test --lib` (670 passaram, 8 ignorados) e `npm run pack`.
- [x] Microsoft Defender examinou os quatro arquivos com `MpCmdRun.exe -Scan -ScanType 3 -File <arquivo> -DisableRemediation`: código 0 e `found no threats`.
- [x] SHA-256:
  - MSI `Lumen-Windows-0.6.17.msi`: `CA10E5338648F97663E3DA3C762E53834C1315456CBDF92C9135E47F22DB1ED4`.
  - Setup `Lumen-Windows-0.6.17-setup.exe`: `460611D9E2CF3DC4D123A524C98828C7D57D8377F9387C4C63BE20968684CB94`.
  - App `lumen.exe`: `5DACC5782177D6E0FAFF9AE17623E0A0EDC19560FF628F86F995D83AAFB2E2DF`.
  - Hook `lumen-hook.exe`: `180DDDB1139A02D9D21ED8A36CF7FD6C0A2F5AB34337EF106B4C4FF22DB7ED0E`.
- [ ] Proprietário instalar a 0.6.17 e testar o clima com a conta ChatGPT real e a cidade salva. Continua **NOT_RUN**.

## Windows 0.6.16 — correção do login ChatGPT (publicação local)

- [x] Pedido explícito do proprietário em 2026-11-14. O GitHub Actions está desabilitado no repositório (`HTTP 422: Actions has been disabled`), então a build e a publicação foram locais, como na 0.6.15.
- [x] Causa corrigida: o Credential Manager do Windows recusa valores acima de 2560 bytes e os tokens OAuth passavam disso. `secrets.rs` divide valores longos em partes de 800 caracteres.
- [x] Validações locais: `python scripts/test-whats-new.py windows`, `npx tsc --noEmit`, `npm test` (673/673), `npm run build`, `cargo test --lib` (665 passaram, 8 ignorados) e `npm run pack`.
- [x] Microsoft Defender, assinaturas `1.463.288.0`, examinou individualmente os quatro binários com `MpCmdRun.exe -Scan -ScanType 3 -File <arquivo> -DisableRemediation`: código 0 e `found no threats`.
- [x] SHA-256 dos artefatos publicados:
  - MSI `Lumen-Windows-0.6.16.msi`: `5EB4DF72741D61B74D68612037AE93666ADF32BBCAE89D415848E208222E298C`.
  - Setup `Lumen-Windows-0.6.16-setup.exe`: `FE95D36E1523E2E2F6664650D7A68BEFEA36B32AF020DC6326741CB04F752AA8`.
  - App `lumen.exe`: `E32BF18F43F672710CD5706ACB73815C7C5DB45ACC4000398D239FEC7871834C`.
  - Hook `lumen-hook.exe`: `90E489E359E46C1DC97FD71158843B7BCEE37B73368EC4AA20996DE5802A5B54`.
- [ ] Proprietário validar o login real com ChatGPT (L2.1). Continua **NOT_RUN** até esse teste.

## Windows 0.6.15 — L1.4d-3/d-4 e L2.2 Chat com login ChatGPT (publicação local)

- [x] Pedido explícito do proprietário em 2026-11-14 para publicar `windows-v0.6.15` 100% localmente (`no-github-actions`), sem executar GitHub Actions nem rodar `test-lumen-upgrade.ps1` destrutivo no perfil local.
- [x] Validações locais: `python scripts/test-whats-new.py windows` (`0.6.15: 2 items in 1 languages`), `npm run icons`, `npx tsc --noEmit`, `npm test` (673/673), `cargo test --manifest-path src-tauri/Cargo.toml --lib` (664 passaram, 8 ignorados) e `npm run pack` (`Lumen-Windows-0.6.15.msi` 12,45 MB e `Lumen-Windows-0.6.15-setup.exe` 8,95 MB).
- [x] Microsoft Defender, assinaturas `1.463.288.0` (13/11/2026 15:38:53), examinou individualmente os quatro binários/instaladores locais com `MpCmdRun.exe -Scan -ScanType 3 -File <arquivo> -DisableRemediation`; os quatro retornaram código 0 e `found no threats`.
- [x] SHA-256 dos artefatos locais publicados:
  - MSI `Lumen-Windows-0.6.15.msi`: `BBCEC30907F2E01C1052D240BD8EC71E8D84866666AAF5C3E91194065A7EF7FE`.
  - Setup `Lumen-Windows-0.6.15-setup.exe`: `4BAD63F08E16291F3DFB0229430DA8C3E5CB69A021D7510BFBC7C09FBCBE2E47`.
  - App `lumen.exe`: `D352F490358D3B7CB3A860B2F49D3EE858EACC02789E3310689FD871EF2F7B5E`.
  - Hook `lumen-hook.exe`: `4A172A24F8C782313814907AB437638B9F1FF02D36A90F175A4709D824418F64`.
- [x] Publicação local via `gh release create windows-v0.6.15` e atualização dos assets de `windows-latest` (`Lumen-Windows.msi` e `Lumen-Windows-setup.exe`) apontando para os binários desta build. Release: https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.15.
- [ ] Proprietário validar no uso real: personagens e animações P1/P2 (`L1.4`), cenários da migração (`L1.3`) e login + chat ChatGPT (`L2.1` + `L2.2`). Testes reais seguem **NOT_RUN** até essa verificação.

## Windows 0.6.14 — L2.1 Sign in with ChatGPT

- [x] Autorização recorrente do proprietário para publicar cada etapa depois dos testes sintéticos, registrada em `docs/ROADMAP-FORK.md`.
- [x] Validações locais: `npx tsc --noEmit`, `npm test` (659/659), `npm run build`, `cargo test --manifest-path windows/Cargo.toml -p coucou --lib` (660 passaram, 8 ignorados) e `python scripts/test-whats-new.py windows`.
- [x] Workflow manual `Windows` no branch `codex/l2-chatgpt-oauth`, commit `fb3dabafc8558584c5a2ba55e81077e654e66d0a`: CI `43477378762` concluiu com sucesso. Build, testes, notas, ícones, empacotamento e upgrade sintético MSI/NSIS passaram.
- [x] Microsoft Defender, assinaturas `1.463.281.0` (13/11/2026), examinou individualmente os quatro artefatos baixados com `MpCmdRun.exe -Scan -ScanType 3 -File <arquivo> -DisableRemediation`; os quatro retornaram código 0 e “found no threats”. A verificação personalizada da pasta também concluiu sem detecções (evento 1001, exame `{15EB8CCB-EF55-4D39-8DDF-4032CB8A1B5E}`).
- [x] SHA-256 dos artefatos do preflight:
  - MSI `Lumen-Windows-0.6.14.msi`: `41F3852B4F967C7CE0FA5455EED6D3ACA49A98C449E3F9DC6421A60ADA240CB0`.
  - Setup `Lumen-Windows-0.6.14-setup.exe`: `49556A2C5650CC9C519CCB073AB87B3CE614CBA8BF2686361E37B283D55A165F`.
  - App portátil `lumen.exe`: `326B17A034865EBFEB1D9B178404E487CBEA6EDE1C9B22E8155FF388A1609495`.
  - Hook `lumen-hook.exe`: `49C7725C391D4BAA1B9B36198ADCC043C48A58E5D5BAE33034F352F1C25771C9`.
- [x] Integrado na `main` no commit `3129f5f7036cf46ceffec66dbd0bbc85857f53c5`; tag `windows-v0.6.14` publicada. Workflow da release [`43482202733`](https://github.com/playertwo1/coucou/actions/runs/43482202733) concluiu com sucesso, incluindo testes Node/Rust, empacotamento, upgrade sintético MSI/NSIS, publicação e atualização de `windows-latest`. Release: https://github.com/playertwo1/coucou/releases/tag/windows-v0.6.14.
- [x] Baixados os assets finais; os SHA-256 locais conferem com os digests do GitHub. Os instaladores finais foram examinados individualmente pelo Defender, assinaturas `1.463.281.0` (13/11/2026), sem ameaças detectadas.
  - Setup `Lumen-Windows-0.6.14-setup.exe`: `7C9453C21D7051CEF5E97ED345E6AED2E59F2A1B44A4EA224A1A9B5226027E9E`.
  - MSI `Lumen-Windows-0.6.14.msi`: `E7DC4037F732454D1C1E701BB67BA3445149036A0C57E941990F0746F693238E`.
- [x] `windows-latest` aponta para os mesmos assets finais; os digests publicados são idênticos aos da release `windows-v0.6.14`.
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
