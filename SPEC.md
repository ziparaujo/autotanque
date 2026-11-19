# Especificação Funcional e de Regras de Negócio — AutoTanque (`SPEC.md`)

Este documento descreve a arquitetura, o modelo de dados, os algoritmos de cálculo e todas as regras de negócio e interface vigentes no **AutoTanque**. Ele serve como referência oficial para manutenção e futuras evoluções do sistema.

---

## 1. Visão Geral e Princípios do Produto

- **Propósito**: Controle pessoal de abastecimentos, gastos mensais, consumo real (`km/L` e `km/m³`), custo por quilômetro rodado (`R$/km`) e decisão inteligente entre Etanol e Gasolina na bomba.
- **Mobile-First & Uso com Uma Mão**: Interface vertical centralizada (`max-w-lg`), botões de toque amplos, teclado numérico decimal acionado nativamente (`inputmode="decimal"`) e navegação inferior fixa de 4 abas.
- **Offline-First & Privacidade**: 100% dos dados permanecem salvos localmente no navegador do dispositivo via `localStorage`, sem dependência de servidor ou conta externa.
- **Zero Diálogos Nativos Bloqueantes**: Proibido o uso de `alert()` ou `confirm()` do navegador; todas as interações utilizam modal customizado (`#confirmModal`) e notificações flutuantes (`#toastBox`).
- **Compatibilidade de Execução**: Arquitetura desacoplada em HTML, CSS e módulos JavaScript clássicos (sem bundler obrigatório), funcionando tanto via servidor HTTP/HTTPS (ex.: GitHub Pages) quanto diretamente via protocolo local (`file://`).

---

## 2. Estrutura de Arquivos do Projeto

```text
AutoTanque/
├── index.html              # Estrutura semântica HTML (cabeçalho, 4 abas, barra inferior, modal e toast)
├── SPEC.md                 # Especificação das regras atuais do sistema
├── css/
│   └── styles.css          # Estilos mobile-first, animações de transição e ajustes de inputs
└── js/
    ├── tailwind-config.js  # Configuração de cores (paleta `auto`) e modo escuro do Tailwind CDN
    ├── constants.js        # Chaves do localStorage e catálogo de combustíveis (FUEL_TYPES)
    ├── state.js            # Estado global em memória da sessão
    ├── utils.js            # Conversão numérica PT-BR, formatação de moeda/datas/km e utilitários
    ├── storage.js          # Leitura/gravação no localStorage e alternância de tema claro/escuro
    ├── telemetry.js        # Motor de cálculo de consumo, ciclos de tanque cheio/parcial e métricas
    ├── ui.js               # Navegação entre abas, modal de confirmação, toasts e sincronização geral
    ├── form.js             # Aba 1 (Abastecer): cálculo bidirecional, validações cronológicas e CRUD
    ├── dashboard.js        # Aba 2 (Painel): KPIs, avisos orientativos, gráfico de 6 meses e comparativo
    ├── history.js          # Aba 3 (Histórico): busca textual, filtros por combustível e listagem
    ├── flex.js             # Aba 4 (Calculadora Flex): paridade 70% vs rendimento real do veículo
    ├── backup.js           # Aba 4 (Backup & Dados): exportação CSV/JSON, importação JSON e exclusão total
    └── app.js              # Inicialização da aplicação no carregamento da página
```

---

## 3. Persistência e Modelo de Dados

### 3.1. Chaves no `localStorage`
| Chave | Conteúdo |
| :--- | :--- |
| `autotanque_v1_records` | Array JSON contendo todos os registros de abastecimento. |
| `autotanque_v1_settings` | Objeto JSON contendo preferências persistidas do usuário. |

### 3.2. Entidade: Registro de Abastecimento (`Record`)
| Campo | Tipo | Obrigatório | Regras / Formato |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sim | Identificador único no padrão `'ab_' + timestamp_base36 + '_' + random_base36(5)`. |
| `createdAt` | `number` | Não* | Timestamp Unix em ms (`Date.now()`) gerado na criação manual (*ausente em registros importados sem o campo). |
| `date` | `string` | Sim | Data local do abastecimento no formato ISO `YYYY-MM-DD`. |
| `odometer` | `number` | Sim | Quilometragem total no painel do veículo (`> 0`). Arredondado para 1 casa decimal ao salvar pelo formulário. |
| `fuelType` | `string` | Sim | Chave pertencente a `FUEL_TYPES`: `'gasolina'`, `'aditivada'` ou `'etanol'`. |
| `totalValue` | `number` | Sim | Valor total pago em Reais (`> 0`), arredondado para 2 casas decimais. |
| `unitPrice` | `number` | Sim | Preço por litro (`> 0`), arredondado para até 3 casas decimais (`0.001`) para suportar bombas com milésimos de real. |
| `quantity` | `number` | Sim | Volume abastecido em Litros (`> 0`), arredondado para 2 casas decimais. |
| `fullTank` | `boolean` | Sim | `true` se o tanque foi completado até o fim; `false` para abastecimento parcial. |
| `notes` | `string` | Não | Nome do posto ou observação livre. Limite de `50` caracteres no formulário (e truncado em `60` caracteres na importação JSON). |

### 3.3. Preferências Persistidas (`Settings`)
- `theme`: `'dark'` (padrão inicial) ou `'light'`, aplicado via classe `.dark` no elemento `<html>`.
- `selectedFuel`: último combustível selecionado pelo usuário (padrão `'gasolina'`).
- `tankCapacity`: capacidade nominal do tanque em litros usada na simulação da Calculadora Flex (inteiro de `35` a `80`, padrão `50`).
- `useCustomFlexRatio`: booleano (padrão `true`) que define se a Calculadora Flex deve priorizar o rendimento real medido do veículo quando disponível, em vez do índice fixo de 70%.

---

## 4. Catálogo de Combustíveis (`FUEL_TYPES`)

| ID | Rótulo | Unidade | Sistema de Medição | Identidade Visual |
| :--- | :--- | :---: | :---: | :--- |
| `gasolina` | Gasolina | `L` (Litros) | Líquido (`liquid`) | Âmbar (`amber-500`) |
| `aditivada` | Aditivada | `L` (Litros) | Líquido (`liquid`) | Azul-celeste (`sky-500`) |
| `etanol` | Etanol | `L` (Litros) | Líquido (`liquid`) | Esmeralda (`emerald-500`) |

---

## 5. Regras de Entrada e Conversão Numérica (`parseBrFloat`)

Para facilitar a digitação rápida em teclados móveis brasileiros e internacionais:
1. Espaços em branco são removidos.
2. **Ponto e vírgula juntos** (ex.: `"1.250,50"`): todos os pontos são removidos como separadores de milhar e a vírgula é convertida em ponto decimal (`1250.5`).
3. **Apenas vírgula** (ex.: `"5,89"`): a vírgula é convertida em ponto decimal (`5.89`).
4. **Apenas ponto ou dígitos puros** (ex.: `"5.89"` ou `"45320"`): interpretado diretamente via `parseFloat` padrão (nota: um valor digitado apenas com ponto como `"45.320"` sem vírgula é interpretado como decimal `45.32`, portanto odômetros inteiros devem ser informados sem separador de milhar, ex.: `45320`).
5. Valores vazios, nulos ou não numéricos retornam `NaN`.

---

## 6. Regras da Aba 1 — Abastecer (Registro e Edição)

### 6.1. Auxiliares Inteligentes de Preenchimento
- **Sugestão de Preço Anterior**: Ao trocar o combustível (fora do modo de edição) estando o campo de preço unitário vazio, o `placeholder` exibe o último preço unitário pago para aquele mesmo combustível.
- **Referência de Odômetro e Atalhos Rápidos**:
  - Exibe o último odômetro registrado e sua data (ignorando o próprio registro caso esteja em modo de edição).
  - Quando há histórico prévio e não está em modo de edição, exibe chips rápidos `+250`, `+350` e `+450` km. Clicar em um chip soma o incremento ao valor atualmente digitado (se este já for `>=` último odômetro) ou ao último odômetro salvo.
- **Autocomplete de Postos**: O campo `Posto / Observação` sugere até os últimos **12** textos únicos não vazios informados anteriormente.
- **Preview de Quilometragem Rodada em Tempo Real (`onOdometerInput`)**:
  - Ao digitar o odômetro ou alterar a data, compara com os demais registros:
  - Se houver registros com `data <= dataSelecionada`: calcula `diff = odometroDigitado - ultimoOdometroAteAData`.
    - Se `diff > 0`: exibe `+{diff} km rodados` em verde.
    - Se `dataSelecionada > dataDoAnterior` e `diff <= 0`: exibe `Abaixo do anterior` em vermelho.
  - Se não houver registros anteriores/iguais, mas houver registros futuros (`data > dataSelecionada`) e o odômetro digitado for menor que o próximo registro: exibe `Registro retroativo válido` em âmbar.

### 6.2. Cálculo Automático Bidirecional na Bomba (`handleSmartCalc`)
O formulário possui 3 grandezas interligadas (`Valor Total`, `Preço Unitário` e `Quantidade`) e mantém um campo âncora (`calcAnchorField`, iniciado em `'total'`):
- **Ao editar `Valor Total`**:
  - Define âncora = `'total'`.
  - Se `total > 0` e `preço > 0` → recalcula `quantidade = total / preço` (2 casas).
  - Senão, se `total > 0`, `quantidade > 0` e `preço` estiver vazio → calcula `preço = total / quantidade` (2 casas).
- **Ao editar `Quantidade`**:
  - Define âncora = `'quantity'`.
  - Se `quantidade > 0` e `preço > 0` → recalcula `total = quantidade * preço` (2 casas).
  - Senão, se `quantidade > 0`, `total > 0` e `preço` estiver vazio → calcula `preço = total / quantidade` (2 casas).
- **Ao editar `Preço Unitário`** (com `preço > 0`):
  - Se âncora for `'total'` e `total > 0` → recalcula `quantidade = total / preço`.
  - Se âncora for `'quantity'` e `quantidade > 0` → recalcula `total = quantidade * preço`.
  - Fallback caso a âncora atual esteja vazia: recalcula `quantidade` se houver `total > 0`, ou recalcula `total` se houver `quantidade > 0`.

### 6.3. Validações Obrigatórias antes de Salvar (`validateRefuelForm`)
1. **Odômetro Positivo**: Deve ser um número finito maior que zero.
2. **Coerência Cronológica (com suporte a lançamentos retroativos)**:
   Considerando todos os registros exceto o que está sendo editado:
   - **Contra datas anteriores (`r.date < dataInformada`)**: o odômetro informado deve ser **estritamente maior (`>`)** que o maior odômetro registrado em datas anteriores.
   - **No mesmo dia (`r.date === dataInformada`)**: caso não seja um lançamento retroativo (`strictlyLater.length === 0`) e não esteja em modo de edição (`!editingId`), o odômetro informado **não pode ser menor (`<`)** que o maior odômetro já lançado na mesma data (permite odômetro igual ou maior no mesmo dia, ex.: dois abastecimentos na mesma data).
   - **Contra datas posteriores (`r.date > dataInformada` — lançamento retroativo)**: o odômetro informado deve ser **estritamente menor (`<`)** que o menor odômetro registrado em datas posteriores.
3. **Valores de Bomba Positivos**: `totalValue`, `unitPrice` e `quantity` devem ser todos números finitos maiores que zero.

### 6.4. Fluxo Pós-Salvamento e Modo de Edição
- **Novo Registro**: Persiste no `localStorage`, limpa os inputs numéricos/notas, redefine data para hoje e `Tanque Cheio = true`. Se o novo registro fechar um ciclo de consumo (`status === 'closed'`), exibe toast destacando a média obtida (`Salvo! Média do ciclo: X,X km/L`); caso contrário, exibe confirmação padrão.
- **Modo Edição**: Acionado pelo histórico; exibe banner âmbar no topo da Aba 1 com botão `Cancelar` e muda o botão principal para `Salvar Alterações`. Ao confirmar, atualiza o registro existente, sai do modo edição e navega automaticamente de volta para a aba `Histórico`.

---

## 7. Motor de Telemetria e Cálculo Real de Consumo (`computeTelemetry`)

### 7.1. Ordenação Base
Todos os cálculos ordenam uma cópia dos registros por:
1. `odometer` crescente (`a.odometer - b.odometer`);
2. Desempate por `date` em ordem lexicográfica/cronológica crescente (`YYYY-MM-DD`).

### 7.2. Fluxo Unificado de Combustível Líquido (`liquid`)
Todos os combustíveis aceitos (`gasolina`, `aditivada`, `etanol`) operam no mesmo fluxo de combustível líquido medido em Litros (`L`).

### 7.3. Máquina de Estados dos Ciclos de Tanque Cheio
Os registros percorrem os seguintes estados no cálculo de telemetria:

1. **`no_anchor` (Sem Referência Inicial)**:
   - Ocorre quando `fullTank === false` e ainda não houve nenhum tanque cheio anterior.
   - Não acumula litros nem gera média de consumo, pois não há nível de tanque conhecido como ponto de partida.
2. **`anchor` (Tanque Cheio Inicial / Referência)**:
   - Primeiro registro com `fullTank === true`.
   - Define `lastFullRecord = rec` e zera os acumuladores (`accQty = 0`, `accCost = 0`, `partialFuels = Set()`).
3. **`partial` (Abastecimento Parcial Intermediário)**:
   - Registro com `fullTank === false` após já existir um `lastFullRecord`.
   - Soma `rec.quantity` em `accQty`, soma `rec.totalValue` em `accCost` e adiciona `rec.fuelType` ao conjunto `partialFuels`.
   - A média permanece pendente até o próximo tanque cheio.
4. **`closed` (Ciclo Fechado de Consumo)**:
   - Registro com `fullTank === true` após existir um `lastFullRecord`.
   - Soma `rec.quantity` em `accQty` e `rec.totalValue` em `accCost`.
   - Calcula a distância do ciclo: `dist = rec.odometer - lastFullRecord.odometer`.
   - Se `dist > 0` e `accQty > 0`:
     - **Consumo Real do Ciclo**: `kmPerUnit = dist / accQty`
     - **Custo Real por Km do Ciclo**: `costPerKm = accCost / dist`
   - Ao final, o registro atual passa a ser o novo `lastFullRecord` e os acumuladores são reiniciados para o próximo ciclo.

### 7.4. Regra Física de Atribuição do Combustível Consumido (`burnedFuelType`)
Quando o motorista completa o tanque na bomba hoje, o volume que entra repõe o combustível que estava no tanque **desde o tanque cheio anterior**. Portanto:
- `baseFuel` é definido como `lastFullRecord.fuelType` (o combustível presente no início do ciclo).
- Se houve algum abastecimento parcial intermediário com combustível diferente de `baseFuel`, o ciclo recebe `burnedFuelType = 'misto'`. Ciclos mistos entram na média global líquida (`avgLiquidKmL`) e no custo global por km (`avgCostPerKm`), mas **não** são somados nas estatísticas individuais por combustível (`fuelStats`), evitando contaminar a eficiência pura de Etanol ou Gasolina.
- Se não houve mistura (`partialFuels` vazio ou contendo apenas `baseFuel`), toda a distância, volume, custo e contagem de ciclo são creditados em `fuelStats[baseFuel]`.

### 7.5. Indicadores Globais Consolidados
- **Total Investido (`totalInvested`)**: Soma de `totalValue` de **todos** os registros cadastrados (incluindo âncoras e parciais).
- **Total Rodado (`totalDriven`)**: `max(0, maiorOdometro - menorOdometro)` quando há pelo menos 2 registros; `0` caso contrário.
- **Consumo Médio Líquido (`avgLiquidKmL`)**: `somaDistanciasCiclosLiquidos / somaLitrosCiclosLiquidos` (ponderado pela distância/volume real, não média aritmética simples de médias).
- **Custo Médio por Km (`avgCostPerKm`)**: `custoCiclosLiquidos / distanciaCiclosLiquidos`.

---

## 8. Regras de Exibição por Aba

### 8.1. Cabeçalho Global
- Subtítulo dinâmico:
  - Com registros: exibe `{ultimoOdometro} km` seguido de `• Média {avgLiquidKmL} km/L` (se já houver ciclo líquido fechado).
  - Sem registros: exibe `"Armazenamento local offline"`.

### 8.2. Aba 2 — Painel (Dashboard)
- **Avisos de Estado Inicial**:
  - `0 registros`: convida a registrar o primeiro abastecimento na aba "Abastecer" para acompanhar médias e relatórios.
  - `>= 1 registro` e `0 ciclos fechados`: informa que falta apenas o próximo Tanque Cheio para liberar cálculos de `km/L` e `R$/km`.
- **Cards de KPI**:
  1. **Gasto no Mês**: soma de `totalValue` dos registros cuja `date` pertence ao mês corrente (`YYYY-MM`) + quantidade de abastecimentos no mês.
  2. **Consumo Geral**: exibe `avgLiquidKmL` como principal (com total de ciclos fechados no subtítulo); caso contrário `--`.
  3. **Custo por Km**: exibe `avgCostPerKm` e o custo equivalente para rodar `100 km` (`avgCostPerKm * 100`).
  4. **Total Rodado**: exibe `totalDriven` e `totalInvested`.
- **Gráfico de Evolução Mensal (Últimos 6 Meses)**:
  - Constrói janela fixa dos últimos 6 meses calendário até a data atual.
  - A **Média Mensal** exibida no selo considera apenas os meses com gasto `> 0` dentro desses 6 meses.
  - Altura das barras proporcional ao mês de maior gasto da janela (mínimo visual de `10%` para meses `> 0` e `4%` para meses zerados). O mês atual recebe destaque em verde esmeralda.
- **Desempenho por Combustível**:
  - Exibe apenas combustíveis que tenham `totalSpentRaw > 0` ou `cycles > 0`.
  - Mostra ciclos fechados, média `km/unidade` (ou `"Aguardando ciclo cheio"`) e `R$/km` (ou gasto bruto acumulado).

### 8.3. Aba 3 — Histórico
- Lista registros em **ordem decrescente** (do maior odômetro/mais recente ao mais antigo).
- Permite combinar filtro por chip de combustível (`Todos` ou combustível específico) com busca textual livre (insensível a maiúsculas/minúsculas sobre posto/observação, data `DD/MM/AAAA`, nome do combustível e odômetro).
- Nos cards de ciclos fechados (`closed`), caso o combustível efetivamente consumido no trecho (`burnedFuelType`) seja diferente do combustível recém-colocado na bomba (ex.: rodou com Gasolina e encheu com Etanol) ou seja `'misto'`, exibe anotação explícita ao lado da média, como `(Gasolina)` ou `(Tanque misto)`.

### 8.4. Aba 4 — Calculadora Flex & Backup
- **Paridade Inteligente da Calculadora Flex**:
  - Busca média real fechada de `etanol` e de `gasolina` (usando `aditivada` como fallback caso `gasolina` comum não tenha ciclos fechados).
  - Se ambas existirem (`hasCustomRatio === true`), calcula `customRatio = avgEtanol / avgGasolina` e habilita seletor entre **Meu Carro** e **70%**. Caso contrário, opera com a referência padrão de `0.70` (70%).
  - Pré-preenche os inputs de preço (se vazios) com o último valor pago de Etanol (ou `3,99`) e de Gasolina/Aditivada (ou `5,89`).
  - **Critério de Recomendação**:
    - `relacaoAtual = precoEtanol / precoGasolina`
    - Se `relacaoAtual <= indiceAtivo` → recomenda **ETANOL**; senão → recomenda **GASOLINA**.
    - Preço teto do Etanol: `precoMaximoEtanol = precoGasolina * indiceAtivo`.
  - **Cálculo de Economia por Autonomia Equivalente**:
    - Para uma capacidade de tanque `T` litros (`35 L` a `80 L`):
    - Custo de 1 tanque de Gasolina: `C_gas = T * precoGasolina`
    - Custo em Etanol para percorrer a **mesma distância** de 1 tanque de Gasolina: `C_et_eq = (T / indiceAtivo) * precoEtanol`
    - Economia estimada no ciclo: `|C_gas - C_et_eq|`.
  - Se estiver usando o histórico real do veículo (`Meu Carro`), exibe adicionalmente os cartões de custo exato por km (`preco / mediaKmL`) para ambos os combustíveis.

- **Exportação, Importação e Exclusão de Dados**:
  - **CSV (`exportCSV`)**: Gera `autotanque_planilha_YYYY-MM-DD.csv` em UTF-8 com BOM (`\uFEFF`), colunas separadas por `;`, números decimais com vírgula (preço unitário com 3 casas, demais com 2 casas) e observações escapadas entre aspas duplas.
  - **Backup JSON (`exportJSON`)**: Gera `autotanque_backup_YYYY-MM-DD.json` com metadados (`app: "AutoTanque"`, `version: 1`, `exportedAt`, `settings` e `records`).
  - **Restauração JSON (`handleImportJSON`)**: Aceita array direto ou objeto com chave `records`. Filtra registros que contenham `odometer`, `totalValue` e `quantity` numéricos válidos, reconstrói `unitPrice` se ausente (`totalValue / quantity`), aplica defaults seguros e solicita confirmação antes de sobrescrever a base local.
  - **Exclusão Total (`askClearAllData`)**: Solicita confirmação explícita no modal customizado (`#confirmModal`) e remove todos os registros salvos em `autotanque_v1_records`, reinicializando todas as visualizações para o estado vazio.
