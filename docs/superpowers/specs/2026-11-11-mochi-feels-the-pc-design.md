# Mochi sente o PC — desenho

Roadmap: Fase 1.7 (`docs/roadmap/fase-1-recursos-mac.md`). Aplicativo Windows em `windows/`.

**Status:** aprovada pelo proprietário em 2026-11-11, com temperatura pelo HWiNFO (item 2 revisto).

## Objetivo

Portar do Mac (`MachineVitals.swift`, `VitalsHoverLine.swift`, `WorkStreak.swift`, `CoucouKit/MochiMood.swift`) as reações do Mochi ao estado do computador e às horas seguidas com os agentes.

## Descoberta

- Mac: lê CPU a cada 3 s, pressão de memória, bateria e estado térmico do sistema, e os dois processos que mais gastam CPU. Só lê com o Mochi na tela (ilha visível ou Mochi no desktop). Opção "Mochi reage ao seu Mac" em Configurações → Geral, ligada por padrão.
- Mac: o `WorkStreak` guarda só os horários dos eventos dos agentes, em memória. Depois de 2 h sem pausa de 20 min (sem agentes ou sem teclado/mouse), Mochi fica com sono; depois de 3 h, com muito sono.
- Windows: nada disso existe. O motor (`src/mochi/engine.ts`) tem gotas de suor só para o limite de uso e não tem os humores do `MochiMood.swift` (suor e pânico, rubor, inchaço, olhos pesados e sono).
- Traduções: as chaves `vitals.*` já existem no Mac (título, opção, explicação, "quente", "morno", memória curta/cheia, bateria).
- A busca das Configurações já tem `general.vitals` (`hub/search.ts:109`) apontando para uma opção que não existe no Windows.

## Comportamento proposto

1. **Leitura (Rust, só Windows):** CPU total por `GetSystemTimes`; memória por `GlobalMemoryStatusEx` (carga ≥ 90 % = curta, ≥ 97 % = cheia; o Windows não tem a pressão de memória do macOS); bateria por `GetSystemPowerStatus` (nada num desktop sem bateria); os dois processos que mais gastaram CPU desde a leitura anterior, por instantâneo de processos e `GetProcessTimes`, lidos só quando a CPU já está alta, como no Mac; ociosidade por `GetLastInputInfo`. Não há laço no Rust: a página da ilha chama o comando `vitals_read` a cada 3 s **só com o Mochi na tela**. Com a ilha escondida e o Mochi em casa, nenhuma leitura (0 % de CPU).
2. **Temperatura pelo HWiNFO** (decisão do proprietário): o Windows não dá temperatura sem privilégio de administrador; o HWiNFO, aberto pelo usuário, a publica, e o Coucou só lê, sem privilégio extra. Primeiro o Gadget (`HKCU\Software\HWiNFO64\VSB`, sensores marcados com "Report value in Gadget"; segundo usuários do Rainmeter, sem o limite de 12 h da versão gratuita). Se não houver, a memória compartilhada (`Global\HWiNFO_SENS_SM2`; na versão gratuita o HWiNFO a desliga a cada 12 h). Leitor próprio, escrito a partir dos deslocamentos do formato, sem código de terceiros. Escolhe a temperatura da CPU (rótulo com "CPU", preferindo o pacote/Tctl/Tdie; °F convertido). ≥ 80 °C → morno (0,4), ≥ 90 °C → quente (0,8), ≥ 95 °C → 1. Sem HWiNFO aberto, sem rubor e a linha nunca diz "quente".
3. **Humores (TypeScript, motor):** portar o `MochiMood.swift` como está: CPU ≥ 80 % em duas leituras seguidas → suor e pulos de pânico, mais fortes perto de 90 %; memória curta/cheia → inchado; bateria abaixo de 20 % fora da tomada → olhos pesados e bocejos; abaixo de 10 % → dormindo com z's. Ligar na tomada enquanto ele está cansado → sorriso e som "pop". Vale para o Mochi da ilha e o do desktop.
4. **Horas com os agentes:** porta direta do `WorkStreak` (2 h → sono; 3 h → muito sono; pausa de 20 min zera). Só horários em memória.
5. **Linha sob a ilha:** com o ponteiro sobre o Mochi e algum humor ativo, uma linha curta com até duas partes: "CPU 94 % · node, Chrome", "Memória curta", "Bateria 14 %". Mesmo estilo do Mac; nenhuma tela existente muda.
6. **Configurações → Geral:** a opção "Mochi reage ao seu PC", ligada por padrão como no Mac, com a explicação traduzida. Desligada: humor calmo, nenhuma leitura. A entrada da busca passa a apontar para ela.
7. **Linux:** sem leitura nesta versão; a opção não aparece (`shortcut:` no código).

## Divisão (uma subfase por vez, cada uma com seus testes)

- **1.7a — Leitura:** módulo Rust com as fórmulas puras testadas (delta de CPU, limiares de memória e bateria, ranking dos processos) e o laço que só roda com o Mochi na tela.
- **1.7b — Humores no motor:** porta do `MochiMood` com testes do alvo e da suavização; teste manual visual.
- **1.7c — Linha e opção:** linha sob a ilha, opção nas Configurações, traduções do Mac nas 14 línguas, busca.
- **1.7d — Horas com os agentes:** `WorkStreak` alimentado pelos eventos dos hooks, com testes de pausa e limiares.

## Aceite

- Ilha escondida e Mochi em casa: nenhuma leitura (verificável pelo log e pelo Gerenciador de Tarefas).
- Carga real de CPU (ex.: compilação) faz o Mochi suar em até ~6 s e parar depois; a linha cita os processos certos.
- Notebook fora da tomada abaixo de 20 %: cansado; ligar na tomada: sorriso.
- Opção desligada: Mochi calmo, nada lido.
- Nada sai da máquina; nada é gravado em disco.

## Fora do escopo

- Temperatura sem o HWiNFO. Instalar ou configurar o HWiNFO pelo Coucou. Linux. Gráficos ou histórico de uso. Encerrar ou alterar processos.

## Risco e rollback

Ler processos de outros apps é só leitura de tempos de CPU e nomes de executáveis, só na memória. O rollback é reverter o código; a opção nova é um booleano nas configurações, ignorado pela versão anterior.
