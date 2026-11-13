# Plano — identidade Lumen e migração

1. Atualizar o branding apenas no alvo Windows: overlay Tauri, nome do executável, recursos, MSI/NSIS, nomes de pacotes e workflow de release. Fixar o UpgradeCode MSI atual.
2. Preservar em código os diretórios de preferências/dados, o executável e marcador dos hooks, o AUMID/CLSID dos avisos e o serviço do Credential Manager. Renomear o texto exibido e o atalho sem alterar os IDs de compatibilidade. Manter a gravação dos hooks dependente de prévia e confirmação.
3. Atualizar o reconhecimento de instalação, nomes de artefatos e página de transição no atualizador. Acrescentar testes unitários para instalação Lumen, fallback de release antiga e recusa de artefatos que não sejam Lumen.
4. Substituir o desenho do Mochi por um desenho original da Bússola usado na ilha, janela de mesa, pílulas, resumo e miniaturas. Remover a saudação/roupas antigas que só exibem o personagem; manter os campos antigos do JSON de settings sem apagá-los.
5. Remover o empacotamento dos WAVs compartilhados. Sintetizar a paleta B com Web Audio e manter a substituição opcional por sons que o próprio usuário colocou na pasta local.
6. Restringir a interface Windows a pt-BR sem editar os catálogos gerados do upstream; atualizar textos novos de Lumen em `extra.json` e as notas da versão.
7. Adicionar um teste PowerShell e workflow de CI que instalam a release 0.6.11 e a build Lumen em perfis/instalações descartáveis, verificando MSI upgrade, NSIS lado a lado, settings, hook, AUMID e nomes do atualizador. O teste não usa o perfil real do dono.
8. Atualizar `docs/roadmap/fase-l-lumen.md`, `docs/STATE-FORK.md`, `docs/ROADMAP-FORK.md` e `LICENSE-ASSETS.md` com decisão, compatibilidade, resultados e limitações.
9. Executar `npx tsc --noEmit`, `npm test`, `npm run build`, `cargo test --lib`, `cargo test` do hook, o teste sintético de upgrade no Windows e o validador de What's new. Conferir que o `dist` não contém Mochi/Coucou nem arquivos de som compartilhados.
10. Se tudo passar, criar o commit pt-BR, integrar na `main`, enviar só para `origin`, executar o preflight de release e inspecionar os artefatos antes de publicar a versão Windows Lumen. Não enviar nada para `upstream`.
