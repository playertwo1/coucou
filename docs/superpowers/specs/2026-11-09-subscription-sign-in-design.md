# Login das assinaturas e modo de autenticação do Gemini — desenho

Roadmap: Fase 2.11 (`docs/ROADMAP-FORK.md`). Só Windows/Linux (`windows/`).

## Objetivo

Em Settings → "Your AI subscriptions", para cada CLI instalada (Claude, Codex, Gemini/Antigravity, Copilot):

- mostrar se ela está conectada (`Connected · <conta/modo>` ou `Not connected`);
- botão **Connect**, que abre um terminal na pasta pessoal com o comando de login da própria CLI (`cli.sign_in()`, string fixa e nunca texto do usuário);
- só no Google: botão **Use API key** / **Use Google OAuth**, que troca `security.auth.selectedType` em `~/.gemini/settings.json`.

## Regras

- O estado de login é **somente leitura**: lê `~/.claude.json`, `~/.codex/auth.json` e `~/.gemini/settings.json` + `google_accounts.json`. Nunca mostra nem registra tokens; mostra só o e-mail ou o nome do modo.
- A troca de modo do Gemini usa `config_file` (o mesmo caminho dos hooks): prévia com diff, backup datado, fingerprint e gravação só depois do clique em "Back up and write". JSON inválido ou `security`/`auth` de tipo inesperado → erro, e o arquivo fica intacto.
- `google_accounts.json` não é alterado: se não houver conta OAuth ativa, o usuário usa **Connect**.
- Linhas novas na tela existente de Settings, sem mudar o visual das linhas atuais. Aprovado pelo proprietário em 2026-11-09.

## Aceite

- Testes Rust: preservação das outras chaves, backup com os bytes originais, fingerprint vencido recusado, JSON inválido/tipo inesperado recusado sem gravar.
- Manual: Connect abre o terminal certo para cada CLI instalada; a troca de modo do Gemini mostra o diff, Cancel não grava nada, confirmar grava e cria o backup; o estado exibido bate com a CLI (`gemini` pede ou não a chave).

## Rollback

Restaurar `~/.gemini/settings.json.bak-<data>`; o código é revertido com um único commit.
