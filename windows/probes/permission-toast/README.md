# Prova 2.1a: toast nativo, sem permissões reais

Executável de viabilidade para Windows, separado do workspace e do aplicativo. Não usa o relay, não executa comandos de agentes e não toma decisões reais. Não é backend de produção.

Na raiz do repositório:

```powershell
cargo test --offline --manifest-path windows/probes/permission-toast/Cargo.toml --target-dir windows/target/toast-probe
cargo run --offline --manifest-path windows/probes/permission-toast/Cargo.toml --target-dir windows/target/toast-probe -- pt-BR
```

O argumento opcional é uma língua do catálogo; o padrão é `pt-BR`. Os textos vêm de `src/i18n/extra.json` e do catálogo compartilhado. O lockfile fixa as dependências da prova; o manifesto do aplicativo fica intacto.

Durante até 90 segundos, um clique humano em Permitir/Negar deve imprimir `activated=allow`/`activated=deny`; clicar no corpo deve imprimir `activated=open`. Isso só relata a ação sintética. O callback rejeita argumentos de outra execução ou ações desconhecidas. O desaparecimento do banner por tempo não é decisão: ainda se espera o clique pela Central de Notificações até o prazo acabar.

A prova cria a identidade própria `fr.louisraille.coucou.probe` em `HKCU\Software\Classes\AppUserModelId`, o atalho `Coucou Notification Probe.lnk` na pasta Programs do Menu Iniciar e a classe própria `HKCU\Software\Classes\CLSID\{60CB7695-093B-4AC0-B16A-49AF91AB02BB}` com `LocalServer32`. Recusa sobrescrever registros e atalho existentes. A identidade aponta para o ativador COM; o atalho contém a mesma CLSID. Ao terminar normalmente ou retornar erro, remove o toast do histórico, revoga a classe em execução, remove primeiro a subchave do servidor e depois a classe, além do atalho e da identidade; os resultados aparecem no terminal. Ativação recebida por um processo novo após a perda da associação em memória é recusada sem criar toast. Não interrompa à força durante a espera: encerramento forçado não executa os destructors, e uma próxima execução recusará os registros restantes. Não há varredura ou remoção automática de registros preexistentes.

`Show` retornar sucesso **não prova** banner visível nem clique recebido. A prova consulta `SHQueryUserNotificationState` sem alterar configurações e interrompe se `Setting` falhar; não continua para `Show` com uma identidade não reconhecida. Não altera Não perturbe nem configurações de notificações.

## Evidência em 2026-11-12

Windows 11 Pro, build 26300; `windows` 0.61.3. Dois testes passaram. Na execução final com identidade e atalho próprios, `Setting` retornou `0x80070490`; `Show` retornou sucesso. Foi recebido `Dismissed(TimedOut)`; em 90 segundos nenhum `Activated` chegou. O resultado foi timeout sem decisão. `Hide` e remoção do histórico retornaram sucesso. Atalho e chave de identidade estavam ausentes na verificação externa depois da saída.

O proprietário confirmou depois: **a notificação não apareceu**. Portanto, a entrega visual falhou apesar do retorno de `Show`. Callbacks dos botões/corpo, `Failed`, expiração pelo Windows, necessidade de ativador COM e instalação/desinstalação NSIS/MSI continuam sem prova. Não interpretar o prazo local de espera como prova de expiração do Windows. Não avançar para 2.1b enquanto essas condições da 2.1a não forem resolvidas.

No reteste, `SHQueryUserNotificationState` retornou `QUNS_ACCEPTS_NOTIFICATIONS` (5), `Setting` retornou `Enabled` (0), e `Show` retornou sucesso. O proprietário novamente confirmou que nada apareceu. Os eventos 2416/2418/3052/3153 do log PushNotification-Platform registraram recepção/encaminhamento da própria identidade à sessão 1, sem comprovar apresentação visual. Caminho do Menu Iniciar e sessão interativa estavam corretos. A causa permanece aberta; não atribuir o problema apenas ao erro inicial de identidade. O processo terminou com código 1 sem mensagens de limpeza e sem evento Application Error correspondente; a razão desse encerramento não foi identificada. O atalho foi removido somente após conferir seu destino, e a chave somente após conferir DisplayName e ausência de subchaves. Ambos estavam ausentes na verificação; a remoção do toast próprio pelo histórico também retornou sucesso. A espera local sem callback agora resulta em erro, em vez de saída zero.

Referências: [identidade via atalho](https://learn.microsoft.com/en-us/windows/win32/shell/enable-desktop-toast-with-appusermodelid), [Activated em processo em execução](https://learn.microsoft.com/en-us/uwp/api/windows.ui.notifications.toastnotification.activated), [ativação COM desktop](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/win32_tile_badge_notif/respond-to-toast-activations).

Na retentativa com o Coucou instalado aberto, o proprietário confirmou que viu o toast e clicou em Permitir, mas a execução ainda terminou sem callback. Isso prova a exibição, não a entrega do clique. A assinatura genérica de `Activated` foi substituída pelo ativador COM Win32 acima. Três testes passaram: associação de ação, escaping/XML e entrega pelo objeto COM com rejeição de identidade ou pedido de outra execução. O último é teste direto da interface COM; não simula um clique do Windows nem prova a ativação pela Shell.

A execução seguinte com COM registrado também terminou por timeout, sem callback recebido. A remoção do toast, a revogação COM e a exclusão das chaves próprias/atalho retornaram sucesso. A confirmação humana dessa execução ainda está pendente; o clique relatado anteriormente pertence à tentativa anterior. Nenhuma integração com permissões reais está liberada.

## Reteste sintético em 2026-11-12 — resultado inconclusivo

No Windows 11 Pro build 26300, `cargo test --offline` passou nos quatro testes da prova. A execução ao vivo reportou `SHQueryUserNotificationState=5`, `notification_setting=0` e `show_returned_ok=true`, mas terminou com `outcome=Err(Timeout)` após 90 s. O Agent Desktop não conseguiu abrir a Central de Notificações nem trazer Coucou ao primeiro plano; nenhum botão foi clicado. Portanto, esta execução não confirma visibilidade nem callback da Shell. A limpeza reportou sucesso; a verificação posterior encontrou o processo, AUMID, CLSID e atalho ausentes. 2.1a permanece aberta.
