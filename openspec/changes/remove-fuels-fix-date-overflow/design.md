# Design

## Context

Ver [proposal.md](proposal.md) para motivação. O projeto é um SPA vanilla JS + Tailwind CSS servido como HTML estático (sem bundler). Os combustíveis são definidos em `js/constants.js` como objeto `FUEL_TYPES`, consumido por `js/form.js` (renderização do seletor e labels dinâmicos), `js/telemetry.js` (motor de cálculo com streams `liquid`/`gnv`), `js/dashboard.js` (exibição condicional de KPIs) e `js/history.js` (filtros). O campo de data está em `index.html` linha 234–245 dentro de uma grid Tailwind `grid-cols-1 sm:grid-cols-2`.

## Goals / Non-Goals

**Goals:**
- Remover GNV e diesel do catálogo de combustíveis
- Simplificar a telemetria eliminando a stream dupla `liquid`/`gnv`
- Corrigir o overflow do `input[type="date"]` na grid de duas colunas

**Non-Goals:**
- Criar camadas de compatibilidade ou fallbacks para registros legados (garantido pelo usuário que não existem registros com GNV ou diesel)
- Alterar a estrutura de chaves do localStorage (`autotanque_v1_records`, `autotanque_v1_settings`)
- Reescrever o motor de telemetria — apenas remover a bifurcação GNV

## Decisions

### D1: Remover entradas do catálogo vs. marcar como deprecated

**Decisão**: Remover as entradas `gnv` e `diesel` de `FUEL_TYPES` em `js/constants.js`.

**Alternativa considerada**: Manter as entradas com flag `deprecated: true` e ocultar no seletor. Rejeitada porque adiciona complexidade desnecessária ao catálogo para tipos que não serão reabilitados e não há registros antigos com esses combustíveis.

**Consequência**: O seletor passará de 5 para 3 itens. A grid `grid-cols-3` existente no formulário já acomoda 3 itens em uma linha.

### D2: Simplificação da telemetria

**Decisão**: Eliminar a bifurcação `streamKey` em `js/telemetry.js`. O objeto `trackers` passa a ter apenas a chave `liquid`. Remover acumuladores `totalGnvCycle*`, cálculo `avgGnvKmM3` e retorno desse campo. Toda a telemetria opera de forma unificada e direta.

### D3: Correção do overflow do campo de data

**Decisão**: Adicionar a classe `overflow-hidden` no `<div>` wrapper do campo de data (linha 235 de `index.html`) e `min-w-0` para sobrescrever o `min-width: auto` padrão de itens de grid/flex.

**Alternativa considerada**: Adicionar CSS customizado em `css/styles.css`. Rejeitada porque o projeto usa Tailwind utility classes; manter consistência com o padrão existente.

**Resultado**: O date picker nativo será contido dentro da célula de grid independentemente do tamanho intrínseco renderizado pelo navegador.

## Risks / Trade-offs

| Risco | Mitigação |
|-------|-----------|
| O `overflow-hidden` pode cortar o picker dropdown em alguns navegadores | Pickers nativos usam overlay do browser (fora do fluxo DOM), não são afetados por `overflow-hidden` no contêiner |
