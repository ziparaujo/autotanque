# Proposal

## Why

O AutoTanque oferece cinco tipos de combustível (gasolina, aditivada, etanol, GNV, diesel). GNV e diesel não são relevantes para o público-alvo e adicionam complexidade — especialmente o GNV, que introduz uma stream de telemetria separada (`gnv` vs `liquid`) com unidade distinta (m³ vs L), lógica de dashboard condicional e labels dinâmicos no formulário. Removê-los simplifica significativamente o código e a interface.

Além disso, o campo de data (`input[type="date"]`) ultrapassa os limites do seu contêiner pai quando a grid está em `sm:grid-cols-2`, pois o tamanho intrínseco do date picker nativo de alguns navegadores excede o espaço disponível (~218px por coluna) e não há contenção de overflow nos pais.

## What Changes

- **BREAKING** — Remover os tipos de combustível `gnv` e `diesel` do catálogo (`js/constants.js`), do motor de telemetria (`js/telemetry.js`), do formulário (`js/form.js`), do dashboard (`js/dashboard.js`) e de `SPEC.md`. Nenhum registro existente usa esses tipos. Com a remoção do GNV, a stream dupla (`liquid`/`gnv`) é eliminada — toda a telemetria passa a usar uma única stream.
- Corrigir o overflow do campo de data: garantir que o `input[type="date"]` não ultrapasse o contêiner pai na grid `sm:grid-cols-2`, adicionando contenção adequada (e.g., `overflow-hidden`, `min-w-0`) aos elementos da grid.

## Capabilities

### New Capabilities

- `ui-layout`: Define os requisitos de contenção visual e responsividade dos campos de formulário para evitar overflow.

### Modified Capabilities

_Nenhuma capacidade existente (`dashboard`, `data-management`) tem seus requisitos spec-level alterados por esta mudança._

> **Nota sobre combustíveis**: As regras de tipos de combustível, catálogo e streams de telemetria estão definidas em `SPEC.md` e implementadas em `js/constants.js`, `js/telemetry.js`, `js/form.js` e `js/dashboard.js`, mas não possuem uma spec OpenSpec dedicada. A remoção de GNV/diesel será tratada via tarefas de implementação e atualização de `SPEC.md`.

## Impact

- **`js/constants.js`** — Remoção das entradas `gnv` e `diesel` de `FUEL_TYPES` (linhas 41–60). Grid de seleção passa de 5 para 3 itens.
- **`js/telemetry.js`** — Eliminação da stream `gnv`: remover inicialização do tracker GNV (linhas 29–34), acumuladores `totalGnvCycle*` (linhas 46–48), roteamento `streamKey` (linha 54), acumulação GNV (linhas 113–115), cálculo `avgGnvKmM3` (linha 147), métricas combinadas liquid+gnv (linhas 149–150) e retorno de `avgGnvKmM3` (linha 160).
- **`js/form.js`** — Remover condicionais que alteram labels para GNV ("Cilindro Cheio", "km/m³") nas linhas 34–37.
- **`js/dashboard.js`** — Remover exibição condicional de `avgGnvKmM3` como subtitle/main KPI (linhas 42–47).
- **`SPEC.md`** — Atualizar catálogo de combustíveis (seção 4), streams de telemetria (seção 7.2), métricas (seção 7.5) e regras de dashboard (seção 8.2).
- **`index.html`** — Grid de combustíveis (renderizada dinamicamente via JS) ajusta-se automaticamente.
- **`css/styles.css` / `index.html`** — Adicionar contenção de overflow para o campo de data na grid responsiva.
