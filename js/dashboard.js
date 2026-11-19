/* ======================================================================
 * ABA 2: PAINEL (DASHBOARD, GRÁFICO MENSAL E DESEMPENHO POR COMBUSTÍVEL)
 * ====================================================================== */

function renderDashboard() {
  const telemetry = computeTelemetry();
  const nowIsoMonth = getTodayISO().slice(0, 7); // YYYY-MM

  // Aviso orientativo quando há menos de 2 tanques cheios
  const closedCount = Object.values(telemetry.enrichedMap).filter(r => r.status === 'closed').length;
  const hintBox = document.getElementById('dashboardEmptyHint');
  if (state.records.length === 0) {
    hintBox.classList.remove('hidden');
    document.getElementById('dashboardHintTitle').textContent = 'Seu painel está pronto!';
    document.getElementById('dashboardHintBody').innerHTML =
      'Registre seus abastecimentos na aba <strong>Abastecer</strong> para acompanhar o consumo (km/L) e relatórios em tempo real.';
  } else if (closedCount === 0) {
    hintBox.classList.remove('hidden');
    document.getElementById('dashboardHintTitle').textContent = 'Falta apenas o próximo Tanque Cheio!';
    document.getElementById('dashboardHintBody').innerHTML =
      'Você já tem o 1º registro base salvo. No próximo abastecimento com <strong>Tanque Cheio</strong>, o consumo real (km/L) e o custo por km aparecerão automaticamente.';
  } else {
    hintBox.classList.add('hidden');
  }

  // 1. Gasto no mês atual
  const monthSpend = state.records
    .filter(r => (r.date || '').startsWith(nowIsoMonth))
    .reduce((acc, r) => acc + r.totalValue, 0);

  const monthCount = state.records.filter(r => (r.date || '').startsWith(nowIsoMonth)).length;
  document.getElementById('kpiMonthSpend').textContent = formatCurrency(monthSpend);
  document.getElementById('kpiMonthSub').textContent = monthCount === 1
    ? '1 abastecimento neste mês'
    : `${monthCount} abastecimentos neste mês`;

  // 2. Consumo Médio Geral
  const avgConsEl = document.getElementById('kpiAvgConsumption');
  const avgConsSubEl = document.getElementById('kpiAvgConsumptionSub');
  if (telemetry.avgLiquidKmL) {
    avgConsEl.textContent = `${formatNumber(telemetry.avgLiquidKmL, 1)} km/L`;
    avgConsSubEl.textContent = `Em ${closedCount} ${closedCount === 1 ? 'ciclo fechado' : 'ciclos fechados'}`;
  } else {
    avgConsEl.textContent = '--';
    avgConsSubEl.textContent = 'Aguardando 2º tanque cheio';
  }

  // 3. Custo Médio por Km
  const costKmEl = document.getElementById('kpiCostPerKm');
  const costKmSubEl = document.getElementById('kpiCostPerKmSub');
  if (telemetry.avgCostPerKm) {
    costKmEl.textContent = `${formatCurrency(telemetry.avgCostPerKm)}/km`;
    costKmSubEl.textContent = `A cada 100 km: ${formatCurrency(telemetry.avgCostPerKm * 100)}`;
  } else {
    costKmEl.textContent = '--';
    costKmSubEl.textContent = 'Aguardando ciclo fechado';
  }

  // 4. Total Rodado e Investido
  document.getElementById('kpiTotalDriven').textContent = `${formatIntKm(telemetry.totalDriven)} km`;
  document.getElementById('kpiTotalInvested').textContent = `Total pago: ${formatCurrency(telemetry.totalInvested)}`;

  // Renderizar Gráfico de Barras dos Últimos 6 Meses
  renderMonthlyChart(nowIsoMonth);

  // Renderizar Comparativo por Tipo de Combustível
  renderFuelBreakdown(telemetry);
}

function renderMonthlyChart(nowIsoMonth) {
  const container = document.getElementById('monthlyChartContainer');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Gerar últimos 6 meses até o mês mais recente (ou hoje)
  const baseDate = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    const total = state.records
      .filter(r => (r.date || '').startsWith(key))
      .reduce((acc, r) => acc + r.totalValue, 0);
    months.push({ key, label, total });
  }

  const maxVal = Math.max(...months.map(m => m.total), 1);
  const nonZeroMonths = months.filter(m => m.total > 0);
  const avgMonthly = nonZeroMonths.length > 0
    ? nonZeroMonths.reduce((a, m) => a + m.total, 0) / nonZeroMonths.length
    : 0;

  document.getElementById('monthlyAvgBadge').textContent = `Média: ${formatCurrency(avgMonthly)}`;

  container.innerHTML = months.map(m => {
    const heightPct = m.total > 0 ? Math.max(10, Math.round((m.total / maxVal) * 100)) : 4;
    const isCurrent = m.key === nowIsoMonth;
    const barColor = m.total === 0
      ? 'bg-slate-200 dark:bg-slate-800'
      : isCurrent
        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/20'
        : 'bg-slate-400/70 dark:bg-slate-700';

    const topLabel = m.total > 0 ? `R$${Math.round(m.total)}` : '';

    return `
      <div class="flex-1 flex flex-col items-center h-full justify-end group">
        <span class="text-[10px] font-bold ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'} mb-1">
          ${topLabel}
        </span>
        <div class="w-full max-w-[38px] bg-slate-100 dark:bg-auto-950 rounded-t-xl h-28 flex items-end overflow-hidden p-0.5">
          <div style="height: ${heightPct}%" class="w-full rounded-t-lg transition-all duration-300 ${barColor}"></div>
        </div>
        <span class="text-[10px] font-semibold mt-1.5 ${isCurrent ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'}">
          ${m.label}
        </span>
      </div>
    `;
  }).join('');
}

function renderFuelBreakdown(telemetry) {
  const listEl = document.getElementById('fuelBreakdownList');
  const entries = Object.keys(FUEL_TYPES).map(key => {
    const st = telemetry.fuelStats[key];
    const avgKmUnit = st.qty > 0 ? st.distance / st.qty : null;
    const costKm = st.distance > 0 ? st.cost / st.distance : null;
    const totalSpentRaw = state.records
      .filter(r => r.fuelType === key)
      .reduce((acc, r) => acc + r.totalValue, 0);
    return {
      fuel: FUEL_TYPES[key],
      cycles: st.cycles,
      avgKmUnit,
      costKm,
      totalSpentRaw
    };
  }).filter(item => item.totalSpentRaw > 0 || item.cycles > 0);

  if (entries.length === 0) {
    listEl.innerHTML = `
      <div class="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
        Nenhum dado suficiente ainda para comparar combustíveis.
      </div>
    `;
    return;
  }

  const maxAvg = Math.max(...entries.map(e => e.avgKmUnit || 0), 1);

  listEl.innerHTML = entries.map(item => {
    const pct = item.avgKmUnit ? Math.max(15, Math.round((item.avgKmUnit / maxAvg) * 100)) : 8;
    const avgText = item.avgKmUnit
      ? `${formatNumber(item.avgKmUnit, 2)} km/${item.fuel.unit}`
      : 'Aguardando ciclo cheio';
    const costText = item.costKm
      ? `${formatCurrency(item.costKm)}/km`
      : `Gasto: ${formatCurrency(item.totalSpentRaw)}`;

    return `
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-auto-950 border border-slate-200/70 dark:border-slate-800/80 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${item.fuel.badgeClass}">
              ${item.fuel.label}
            </span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400">
              ${item.cycles} ${item.cycles === 1 ? 'ciclo' : 'ciclos'}
            </span>
          </div>
          <div class="text-right">
            <span class="text-sm font-extrabold">${avgText}</span>
            <span class="block text-[11px] text-slate-500 dark:text-slate-400">${costText}</span>
          </div>
        </div>
        <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div style="width: ${pct}%" class="h-full rounded-full ${item.fuel.barClass}"></div>
        </div>
      </div>
    `;
  }).join('');
}
