# L2.1 — Entrar com ChatGPT no Lumen

## Objetivo

Permitir que a pessoa conecte uma ou mais contas ChatGPT ao Lumen e mantenha as credenciais no cofre do sistema. Esta etapa prepara a autenticação; o uso dessas credenciais pelo chat e as chamadas de inferência ficam na L2.2.

## Contrato

- Usar o fluxo oficial Sign in with ChatGPT para clientes locais de código aberto, conforme a documentação vigente. Não copiar o `client_id` nem o código do serviço OAuth privado da Segunda Mente; consultar esse serviço apenas como referência histórica.
- Abrir o navegador padrão e receber o retorno em `http://127.0.0.1:<porta>/auth/callback`. A porta pode variar; esquema, host e caminho ficam fixos. O mesmo URI exato é usado na autorização e na troca do código.
- Cada tentativa usa valores novos para `state`, `nonce` e PKCE. Validar `state`, o `client_id` emitido, assinatura do ID token via JWKS oficial, emissor, público, expiração, `nonce` e escopos concedidos antes de gravar a conexão.
- Primeiro cadastro usa `dynamic_agent_client` e o nome real `Lumen`; o `client_id` emitido é salvo e reutilizado para a conta correspondente. O host recebe um ID opaco estável por instalação.
- Exigir o escopo `chatgpt.tokens.use.direct` para considerar a conta apta a usar o plano ChatGPT. A credencial não é chave paga da API; limites e créditos continuam sendo os da conta ChatGPT.
- Cada registro de conta fica separado pelo `client_id` emitido e identidade OIDC validada. A pessoa pode adicionar contas, selecionar uma conta ativa, reautorizar e sair. Não misturar nem sobrescrever credenciais de outra conta.
- Access token, refresh token e ID token ficam em entradas separadas do Credential Manager/Secret Service, nunca em disco, webview, argumentos de processo, URL de log ou telemetria. Metadados, índice de contas e host ID também ficam no armazenamento interno Rust-only; o front-end recebe apenas resumos de conta e estado.
- Atualização do token usa o endpoint e o fluxo documentados, serializada por conta; a rotação do refresh token substitui o conjunto somente após resposta válida. Sair tenta revogar o refresh token e apaga os tokens locais; o registro não secreto pode permanecer para reautenticação.
- O provedor atual `openai` com chave de API permanece intacto e separado. A nova conta ChatGPT não se torna automaticamente o provedor escolhido para o chat nesta etapa.
- Frases novas da interface ficam em pt-BR. O botão usa uma tradução natural de “Continue with ChatGPT”, sem adicionar logo ou alterar telas existentes fora da seção de provedores de chat.

## Fora de escopo

- Enviar mensagens ao modelo, descobrir modelos ou fazer streaming de respostas; isso é L2.2.
- Importar tokens do Codex CLI ou da Segunda Mente.
- Armazenar conteúdo de conversas, coletar telemetria ou enviar dados sem ação explícita.

## Aceite sintético

- Callback válido conclui; state incorreto, callback em rota errada, erro OAuth, cancelamento e timeout não trocam nem sobrescrevem tokens.
- Assinatura inválida ou incompatível, emissor, público, nonce ou expiração incorretos são rejeitados.
- Cadastro inicial exige o ID de cliente emitido; reautorização rejeita um ID diferente do registro selecionado.
- Escopos sem `chatgpt.tokens.use.direct` deixam a conexão indisponível para uso do plano.
- Contas sintéticas distintas permanecem isoladas. Status e comandos da webview nunca devolvem tokens, códigos OAuth ou segredos.
- Rotação de refresh token atualiza as credenciais como um conjunto; revogação falha não impede a limpeza local e é informada como não confirmada.
- O provedor OpenAI por chave de API continua funcional sem alteração dos seus dados.

## Aceite real

Depois da publicação para avaliação, testar login em navegador real, consentimento/negação, persistência após reiniciar, reautorização, duas contas, troca de conta e saída. O aceite real continua separado do resultado sintético.

## Referências oficiais

- [Registro e login para clientes de código aberto](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Contas, sessões e proteção de credenciais](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
- [Diretrizes de interface para uso do plano ChatGPT](https://developers.openai.com/siwc/ui-ux-guidelines)
- [Modelos e inferência](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Termos de Sign in with ChatGPT](https://openai.com/policies/sign-in-with-chatgpt-terms/)
