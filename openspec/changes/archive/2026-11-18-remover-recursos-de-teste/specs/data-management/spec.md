# Spec Delta: data-management

## Purpose

Define os requisitos de persistência, exportação, restauração e exclusão total dos dados de abastecimento no armazenamento local do navegador.

## ADDED Requirements

### Requirement: Persistência exclusiva de dados reais do usuário
A aplicação DEVE (SHALL) persistir e operar estritamente sobre os registros de abastecimento fornecidos pelo usuário ou importados via backup JSON, sendo proibida a inclusão de geradores automáticos de dados sintéticos ou botões de demonstração em produção.

#### Scenario: Ausência de gatilho para carregar dados fictícios
- **GIVEN** que o usuário está na aba de Backup & Dados
- **WHEN** a interface de gerenciamento de dados é exibida
- **THEN** o sistema não deve exibir nenhum botão ou opção para carregar dados de exemplo

### Requirement: Exclusão completa e segura de dados locais
A aplicação DEVE (SHALL) fornecer mecanismo de exclusão total de registros do armazenamento local mediante confirmação explícita em modal customizado, sem uso de diálogos nativos bloqueantes.

#### Scenario: Usuário confirma exclusão de todos os registros
- **GIVEN** que o usuário possui registros salvos no armazenamento local
- **WHEN** clica em "Apagar Todos os Dados" e confirma a operação no modal
- **THEN** todos os registros de abastecimento são removidos e os contadores da interface retornam a zero
