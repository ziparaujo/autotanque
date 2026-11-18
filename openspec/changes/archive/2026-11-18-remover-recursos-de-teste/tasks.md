# Tarefas de Implementação: Remoção de Recursos de Teste

## 1. Limpeza de Funções e Referências em JavaScript

- [x] 1.1 Remover as funções `buildSampleDataset()` e `askLoadSampleData()` de `js/backup.js`, verificando que o arquivo não possui mais referências a dados de exemplo e a sintaxe JS permanece válida sem erros.
- [x] 1.2 Remover a manipulação de `#quickDemoBtn` em `syncGlobalUI()` dentro de `js/ui.js`, verificando que `syncGlobalUI()` executa sem lançar exceções de referência nula no console quando `count === 0`.
- [x] 1.3 Atualizar o texto de `#dashboardHintBody` em `js/dashboard.js` quando `state.records.length === 0`, verificando que a mensagem incentiva o registro manual na aba Abastecer sem mencionar dados de demonstração.

## 2. Remoção de Elementos de Interface no HTML

- [x] 2.1 Remover o elemento `<button id="quickDemoBtn">` do cabeçalho em `index.html`, verificando que o cabeçalho mantém apenas o logo, títulos e o alternador de tema claro/escuro.
- [x] 2.2 Remover o botão "Carregar Dados de Exemplo" de dentro do contêiner `#dashboardEmptyHint` em `index.html`, verificando que o banner mantém apenas o ícone e textos instrutivos.
- [x] 2.3 Remover o botão "Carregar Dados de Exemplo" na Aba 4 (Backup & Configurações) em `index.html` e ajustar o botão "Apagar Todos os Dados" para ocupar a largura total do container (`w-full`), verificando o alinhamento visual no layout mobile-first.

## 3. Atualização da Especificação e Validação do Sistema

- [x] 3.1 Atualizar `SPEC.md` nas seções 8.1, 8.2 e 8.4 removendo regras e menções aos dados de exemplo (`buildSampleDataset`), verificando coerência total entre a especificação central e a implementação.
- [x] 3.2 Verificar o carregamento do aplicativo sem erros de console com base limpa (`localStorage` vazio) e validar a conformidade da mudança com `openspec validate remover-recursos-de-teste --strict`.
