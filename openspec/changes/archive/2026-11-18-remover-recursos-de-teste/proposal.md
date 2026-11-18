# Proposta: Remoção de Recursos de Teste e Dados de Exemplo

## Por quê

O AutoTanque está em fase de refinamento para uso em produção real. A presença de recursos como "Testar c/ Exemplo" e "Carregar Dados de Exemplo" polui a interface com ações de demonstração temporárias, induz o usuário a carregar registros fictícios que sobrescrevem seus dados reais e mantém código desnecessário (`buildSampleDataset`) em execução. A remoção consolida uma experiência limpa, focada exclusivamente nos dados reais do motorista.

## O que muda

- **Remoção do botão rápido de teste no cabeçalho**: Eliminação do botão `#quickDemoBtn` ("Testar c/ Exemplo") exibido quando a base de registros está vazia.
- **Remoção do botão de carregar exemplo no aviso do Painel**: Eliminação do botão "Carregar Dados de Exemplo" contido no banner `#dashboardEmptyHint` e ajuste do texto orientativo para focar apenas em iniciar abastecimentos pela aba "Abastecer".
- **Remoção do botão de exemplo nas Ferramentas de Backup/Dados**: Eliminação do botão "Carregar Dados de Exemplo" na Aba 4, mantendo apenas a ação protegida de "Apagar Todos os Dados" e a importação/exportação.
- **Eliminação do gerador de dados sintéticos**: Remoção das funções `buildSampleDataset()` e `askLoadSampleData()` no arquivo `js/backup.js`.
- **Limpeza de sincronização de UI**: Remoção de referências ao `#quickDemoBtn` na função `syncGlobalUI()` em `js/ui.js`.
- **Atualização da Especificação Central (`SPEC.md`)**: Atualização do documento de referência removendo menções a dados de demonstração e ajustando as regras dos estados vazios.

## Capabilities

### New Capabilities
- `data-management`: Especifica o ciclo de vida dos dados do usuário (backup JSON/CSV, restauração e exclusão total), garantindo ausência de mecanismos de injeção de dados fictícios em ambiente de produção.
- `dashboard`: Especifica os estados orientativos e apresentação de métricas do Painel quando há zero registros ou registros insuficientes, sem atalhos para carregamento de demonstrações.

### Modified Capabilities
<!-- Nenhuma capability existente sob openspec/specs/. Todas as capacidades estão sendo formalizadas nesta mudança. -->

## Impacto

- **Código impactado**:
  - `index.html`: Remoção de `#quickDemoBtn`, remoção do botão de exemplo no `#dashboardEmptyHint` e remoção do botão na seção de ferramentas da Aba 4.
  - `js/backup.js`: Exclusão de `buildSampleDataset()` e `askLoadSampleData()`.
  - `js/ui.js`: Remoção de manipulação da visibilidade de `#quickDemoBtn`.
  - `js/dashboard.js`: Ajuste da mensagem em `#dashboardHintBody` para estado com zero registros.
  - `SPEC.md`: Atualização das seções 8.1, 8.2 e 8.4.
- **Armazenamento e Compatibilidade**:
  - Nenhuma alteração nas chaves do `localStorage` (`autotanque_v1_records` e `autotanque_v1_settings`).
  - Sem impacto em quebra de dados reais já existentes.
