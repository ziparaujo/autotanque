# ui-layout Specification

## Purpose
Define os requisitos de contenção visual dos campos de formulário dentro de grids responsivos, garantindo que nenhum campo ultrapasse os limites do seu contêiner pai em qualquer breakpoint ou navegador.

## Requirements

### Requirement: Contenção de campos em grid responsiva
Todos os campos de entrada do formulário de abastecimento DEVEM (SHALL) respeitar os limites do seu contêiner pai em qualquer breakpoint de grid responsiva, incluindo campos com renderização nativa do navegador (e.g., `input[type="date"]`).

#### Scenario: Campo de data em grid de duas colunas
- **WHEN** a viewport atinge o breakpoint `sm` (≥640px) e o formulário exibe a grid em duas colunas
- **THEN** o campo de data NÃO ultrapassa horizontalmente os limites da sua célula de grid

#### Scenario: Campo de data em coluna única (mobile)
- **WHEN** a viewport está abaixo do breakpoint `sm` (<640px) e a grid empilha em coluna única
- **THEN** o campo de data ocupa a largura total da coluna sem overflow horizontal na página

#### Scenario: Consistência entre navegadores
- **WHEN** o formulário é aberto em navegadores com date pickers nativos de tamanhos variados (Chrome, Safari, Firefox)
- **THEN** o campo de data permanece contido dentro da célula de grid em todos eles
