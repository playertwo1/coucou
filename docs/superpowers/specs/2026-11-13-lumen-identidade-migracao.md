# Lumen para Windows — identidade e migração

## Decisão

L1.1 escolheu a opção B: **Bússola de papel**, com índigo, areia e terracota. O Windows passa a se chamar **Lumen** e usa o identificador Tauri `app.segundamente.lumen`. O `applicationId` Android continua `app.segundamente`.

## Resultado esperado

- O app Windows, seus instaladores, ícones, tela inicial, personagem e sons usam a identidade original Lumen/Bússola.
- A interface do Lumen fica em pt-BR; os catálogos herdados continuam intactos para macOS/Linux.
- O instalador MSI pode atualizar a instalação MSI Coucou existente. O NSIS instala Lumen em sua pasta própria, sem executar o desinstalador Coucou.
- Preferências e dados existentes permanecem nos caminhos legados `%APPDATA%\Coucou` e `%LOCALAPPDATA%\Coucou`. A migração não move nem apaga esses diretórios.
- Hooks já configurados continuam encontrando `%LOCALAPPDATA%\Coucou\bin\coucou-hook.exe`. A configuração do agente só pode mudar depois de prévia e clique explícito do usuário.
- A identidade de toast do Windows, `fr.louisraille.coucou`, e o CLSID atual ficam estáveis para preservar a permissão. O nome mostrado passa a Lumen.
- A chave existente no Credential Manager fica em `fr.louisraille.coucou`; nenhum segredo é copiado para arquivo.
- O atualizador novo reconhece os instaladores `Lumen-Windows-*`. Uma versão Coucou antiga não reconhece esses nomes e deve levar o dono à página de releases para instalar a primeira versão Lumen.
- Nenhum artefato da release contém o personagem, ícone ou áudio do Coucou/Mochi.

## Limites

- A primeira instalação NSIS Lumen fica lado a lado com a pasta do antigo Coucou. O teste não chama o desinstalador antigo porque ele apaga arquivos de hook e runtime. O dono pode remover a instalação antiga depois de validar o Lumen; as pastas legadas de dados são preservadas pelo instalador novo.
- Entradas serializadas com nomes antigos, como `mochi_outfit`, permanecem ignoradas/compatíveis; não são removidas automaticamente.
- O teste de upgrade usa exclusivamente runner Windows descartável e conteúdo sintético.
- Nenhuma release é publicada antes dos testes de upgrade, da validação exigida e da inspeção dos artefatos.
