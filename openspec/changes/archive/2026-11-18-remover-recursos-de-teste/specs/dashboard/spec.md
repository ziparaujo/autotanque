# Spec Delta: dashboard

## Purpose

Define os requisitos de apresentação de métricas de telemetria, indicadores-chave de desempenho (KPIs) e mensagens orientativas de estado vazio do Painel.

## ADDED Requirements

### Requirement: Orientação para início de registros no painel
Quando a aplicação estiver sem nenhum abastecimento registrado, o Painel DEVE (SHALL) exibir orientações claras instruindo o usuário a registrar seu primeiro abastecimento na aba principal, sem exibir atalhos para dados de demonstração.

#### Scenario: Visualização do Painel com base vazia
- **GIVEN** que o usuário não possui abastecimentos cadastrados
- **WHEN** o usuário acessa ou visualiza a aba Painel
- **THEN** o sistema exibe mensagem incentivando o registro manual de abastecimentos e não exibe nenhum botão de carregar exemplos

### Requirement: Cabeçalho global limpo em estado inicial
Quando não houver registros salvos, o cabeçalho global da aplicação DEVE (SHALL) informar o estado do armazenamento local sem apresentar botões promocionais ou de teste rápido.

#### Scenario: Visualização do cabeçalho sem abastecimentos
- **GIVEN** que não há registros cadastrados na aplicação
- **WHEN** qualquer aba é visualizada
- **THEN** o subtítulo do cabeçalho exibe a indicação de armazenamento local offline e nenhum botão de teste com exemplo é exibido
