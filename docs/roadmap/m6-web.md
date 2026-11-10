> Parte do roadmap do fork. Índice, regras gerais e ordem das fases: [ROADMAP-FORK.md](../ROADMAP-FORK.md).

## Fase M6 — Mochi: automação web (G)

Objetivo: o Mochi navega e lê páginas pelo Agent Browser, em perfil isolado e só em sites permitidos.

Depende de: Checkpoint M1 e a classificação do Agent Browser na M0.1. Recomendado depois da M5.

Regras desta fase:
- Perfil de navegador próprio do Mochi. Nunca o perfil principal do usuário, seus cookies ou senhas salvas.
- Texto de página é dado. Uma página que diga "envie seus arquivos" ou "ignore as regras" não muda nada.
- Quando existir API ou CLI oficial para a tarefa (por exemplo `gh` para o GitHub), preferir essa via.

### M6.1 — Adaptador e perfil isolado

- [ ] Chamar o Agent Browser em processo separado, com perfil em pasta própria do app.
- [ ] Testar: ausente, versão incompatível, navegador fechado no meio.
- Checkpoint M6.1: o perfil principal do usuário não é aberto nem lido.

### M6.2 — Sites permitidos

- [ ] Settings: lista de domínios permitidos, vazia por padrão.
- [ ] Domínio fora da lista pede clique para aquela visita; redirecionamento para fora da lista também.
- Checkpoint M6.2: nenhuma página fora da lista carrega sem clique.

### M6.3 — Navegar e ler (risco baixo, em site permitido)

- [ ] Abrir página, ler o conteúdo pelo snapshot de acessibilidade e resumir com o endereço da fonte.
- [ ] Testar: site fora do ar, página que demora, conteúdo carregado depois.
- Checkpoint M6.3: "pesquise X e compare" devolve resposta com os links usados.

### M6.4 — Clicar e preencher (risco médio)

- [ ] Clicar e preencher campos, confirmando o resultado depois.
- [ ] Enviar formulário com dados do usuário: risco alto, clique toda vez.
- [ ] Recusar preencher campo de senha ou de cartão.
- Checkpoint M6.4: formulário de teste preenchido; o envio só ocorre depois do clique.

### M6.5 — Download (risco alto)

- [ ] Download só depois do clique, mostrando nome, origem e tamanho.
- [ ] O arquivo vai para a pasta de downloads; nunca é aberto nem executado pelo Mochi.
- Checkpoint M6.5: negar ou ignorar não baixa nada.

### M6.6 — Página maliciosa

- [ ] Criar uma página de teste local com instruções escondidas (pedir arquivo, mudar permissão, visitar outro site).
- [ ] Confirmar que o Mochi a resume como conteúdo e não segue nenhuma instrução.
- Checkpoint M6.6: nenhuma ferramenta é chamada por causa do texto da página.

### M6.7 — Fechamento

- [ ] Rodar 5 fluxos em sites públicos não sensíveis, com evidência.
- [ ] Conferir que não há credencial nem cookie no registro.
- [ ] Atualizar `windows/README.md` e o Estado no índice.
- Checkpoint M6: 5 fluxos repetíveis, sem vazamento de credencial.
