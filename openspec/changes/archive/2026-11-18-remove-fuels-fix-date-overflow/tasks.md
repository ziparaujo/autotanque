# Tasks

## 1. Remover combustíveis GNV e diesel do catálogo

- [x] 1.1 Em `js/constants.js`, remover as entradas `gnv` (linhas 41–49) e `diesel` (linhas 51–60) do objeto `FUEL_TYPES`. Verificar: `Object.keys(FUEL_TYPES)` retorna exatamente `['gasolina', 'aditivada', 'etanol']` no console do navegador e a interface renderiza apenas os 3 botões de combustível.

## 2. Simplificar o motor de telemetria

- [x] 2.1 Em `js/telemetry.js`, remover a chave `gnv` do objeto `trackers` (linhas 29–34), os acumuladores `totalGnvCycleDist`, `totalGnvCycleQty`, `totalGnvCycleCost` (linhas 46–48), a lógica de roteamento `streamKey` que bifurca por `rec.fuelType === 'gnv'` (linha 54) — fazer todos os registros usarem `trackers.liquid` —, o bloco de acumulação GNV (linhas 112–115), o cálculo `avgGnvKmM3` (linha 147), as variáveis combinadas `combinedCycleDist`/`combinedCycleCost` (linhas 149–150), e o retorno de `avgGnvKmM3` (linha 160). Ajustar `avgCostPerKm` para usar diretamente `totalLiquidCycleDist`/`totalLiquidCycleCost`. Verificar: `computeTelemetry()` retorna objeto sem a propriedade `avgGnvKmM3` e os cálculos de `avgLiquidKmL` e `avgCostPerKm` funcionam corretamente com registros apenas de gasolina/aditivada/etanol.

## 3. Atualizar formulário e dashboard

- [x] 3.1 Em `js/form.js`, remover os condicionais de GNV nas linhas 34–37: `fullTankTitle` deve ser sempre `'Tanque Cheio'` e `fullTankDesc` deve sempre usar `'km/L'`. Verificar: selecionar qualquer combustível e confirmar que o label mostra "Tanque Cheio" e "km/L".
- [x] 3.2 Em `js/dashboard.js`, remover a lógica condicional de `avgGnvKmM3` (linhas 42–47): `avgConsSubEl` deve mostrar apenas o texto de ciclos fechados quando `avgLiquidKmL` existir, e o branch `else if (telemetry.avgGnvKmM3)` deve ser removido. Verificar: o dashboard exibe corretamente "X.X km/L" sem referência a GNV.

## 4. Corrigir overflow do campo de data

- [x] 4.1 Em `index.html`, adicionar as classes `overflow-hidden min-w-0` ao `<div>` wrapper do campo de data (linha 235, o `<div>` pai imediato do `<label>` "Data do Abastecimento" e do `<input type="date">`). Verificar: redimensionar o navegador para o breakpoint `sm` (≥640px) e confirmar que o campo de data não ultrapassa a célula de grid; em mobile (<640px), o campo ocupa a largura total sem overflow horizontal.

## 5. Atualizar documentação de regras de negócio

- [x] 5.1 Em `SPEC.md`, atualizar a lista de tipos de combustível aceitos (seção 4 — catálogo) removendo GNV e diesel, mantendo apenas gasolina, aditivada e etanol. Remover as regras de adaptação dinâmica do GNV (seções sobre m³, gasoso, etc.). Atualizar a seção de streams de telemetria (seção 7.2) removendo a stream `gnv` — toda telemetria opera em stream única `liquid`. Remover referências a `avgGnvKmM3` das seções de métricas (7.5) e dashboard (8.2). Verificar: `SPEC.md` não contém mais referências a `gnv` nem `diesel` como tipos aceitos (buscar por essas strings no arquivo).

## Workflow follow-up

- Arquivar a change após revisão com `openspec archive --change "remove-fuels-fix-date-overflow"`.
