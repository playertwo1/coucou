# Protótipo L1.4b — Codex sprite × Canvas

Abra `index.html` no navegador.

Escolha um estado, 22 ou 96 px e alterne “Ocultar ilha”. As duas amostras compartilham os controles. O PNG foi recortado da prancha transparente aprovada; o Canvas usa formas simples descritas no README da família.

Os estados lógicos `searching`, `ratelimit` e `dizzy` têm fallback visual para Pensando, Dormindo e Pergunta. A página não é carregada pelo Lumen e não contém integração Tauri.

Veja [`comparacao.md`](comparacao.md) para medidas e limites. Em 2026-11-13, o proprietário escolheu Canvas com base na revisão técnica. A L1.4d implementa essa decisão por etapas; este protótipo não representa aceite do app em uso real.

## L1.4d-1 — conferência dos personagens

Na pasta `windows`, inicie o servidor de desenvolvimento com `npx vite` e abra `http://127.0.0.1:1420/design/personagens/prototipo/l14d1-conferencia.html`. A página não faz parte das entradas de build ou da release.

A matriz mostra os sete personagens × 11 estados, em 22 e 96 px, com backing store em DPR 1, 1,5 ou 2. Só o Codex tem Canvas nesta subetapa; os outros seis mostram as pranchas PNG aprovadas e indicam o Canvas como pendente de d2. Estados sem prancha aprovada ficam identificados. A página não reproduz animações nem constitui aceite do uso real.
