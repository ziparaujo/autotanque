# Design Técnico: Remoção de Recursos de Teste e Dados de Exemplo

## Contexto

Conforme detalhado no [proposal.md](proposal.md), o aplicativo AutoTanque possui botões e funções legadas para geração e carga de dados sintéticos de teste (`buildSampleDataset` e `askLoadSampleData` em `js/backup.js`). Esses elementos estão distribuídos em três pontos de interface no `index.html` (cabeçalho, banner de estado vazio do painel e seção de ferramentas da Aba 4) e têm lógica de visibilidade acoplada em `js/ui.js` e mensagens dinâmicas em `js/dashboard.js`.

## Objetivos / Não-Objetivos

**Objetivos:**
- Eliminar completamente o gerador de dados sintéticos e suas funções auxiliares do código fonte (`js/backup.js`).
- Remover todos os elementos visuais de dados de demonstração no `index.html`.
- Eliminar referências e manipulações DOM de botões de teste em `js/ui.js` e `js/dashboard.js`, prevenindo erros de execução.
- Readequar o layout da seção de ferramentas da Aba 4 para que o botão "Apagar Todos os Dados" permaneça harmônico (ocupando largura total).
- Atualizar a especificação central `SPEC.md` refletindo o comportamento oficial de produção.

**Não-Objetivos:**
- Não alterar as funções reais de persistência, exportação CSV/JSON, importação JSON ou limpeza de dados.
- Não modificar regras de telemetria, cálculo de consumo ou paridade flex.
- Não alterar o schema de dados persistidos no `localStorage`.

## Decisões Técnicas

1. **Remoção física de código morto vs. Ocultação via CSS/Flag**
   - *Decisão*: Excluir fisicamente `buildSampleDataset()` e `askLoadSampleData()`, além dos elementos HTML correspondentes.
   - *Alternativa considerada*: Esconder com classes CSS `hidden`.
   - *Justificativa*: Manter código morto de dados fictícios em produção aumenta a superfície de manutenção e risco de acionamento acidental pelo usuário via console ou falha de layout.

2. **Readequação do layout do botão "Apagar Todos os Dados" na Aba 4**
   - *Decisão*: O container do botão deixará de ser um grid/flex duplo (`flex flex-col sm:flex-row gap-2.5`) e passará a exibir o botão "Apagar Todos os Dados" com largura total (`w-full`), mantendo o destaque de segurança em tom avermelhado.
   - *Alternativa considerada*: Deixar o botão ocupando metade do espaço vazio.
   - *Justificativa*: Garante consistência visual no design mobile-first.

3. **Ajuste de mensagem orientativa no Painel (`js/dashboard.js`)**
   - *Decisão*: Simplificar a mensagem de `dashboardHintBody` para quando `state.records.length === 0`: "Registre seus abastecimentos na aba <strong>Abastecer</strong> para acompanhar o consumo (km/L) e relatórios em tempo real."
   - *Justificativa*: Remove a menção ao carregamento de dataset de teste mantendo a clareza didática.

## Riscos / Trade-offs

- **[Risco] Quebra de execução por referência a `quickDemoBtn` nulo**
  - *Mitigação*: Remover em `js/ui.js` o bloco `const demoBtn = document.getElementById('quickDemoBtn');` e sua checagem condicional em `syncGlobalUI()`.
- **[Risco] Insegurança do usuário ao abrir o app vazio pela primeira vez**
  - *Mitigação*: O banner orientativo no Painel (`dashboardEmptyHint`) e o formulário padrão na Aba 1 já guiam o usuário intuitivamente para cadastrar o primeiro abastecimento.
