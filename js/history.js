/* ======================================================================
 * ABA 3: HISTÓRICO DE ABASTECIMENTOS (FILTRO, EDIÇÃO E EXCLUSÃO)
 * ====================================================================== */

function setHistoryFilter(filterKey) {
  state.historyFilter = filterKey;
  renderHistory();
}

function renderHistory() {
  const chipsContainer = document.getElementById('historyFilterChips');
  const listContainer = document.getElementById('historyListContainer');
  const searchQuery = (document.getElementById('historySearchInput').value || '').trim().toLowerCase();

  const filterOptions = [
    { key: 'todos', label: 'Todos' },
    ...Object.values(FUEL_TYPES).map(f => ({ key: f.id, label: f.short }))
  ];

  chipsContainer.innerHTML = filterOptions.map(opt => {
    const active = state.historyFilter === opt.key;
    return `
      <button
        type="button"
        onclick="setHistoryFilter('${opt.key}')"
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
          active
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-auto-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
        }"
      >
        ${opt.label}
      </button>
    `;
  }).join('');

  const telemetry = computeTelemetry();
  const sortedDesc = [...telemetry.sortedAsc].reverse();

  const filtered = sortedDesc.filter(rec => {
    if (state.historyFilter !== 'todos' && rec.fuelType !== state.historyFilter) return false;
    if (searchQuery) {
      const hay = `${rec.notes || ''} ${formatDateBr(rec.date)} ${FUEL_TYPES[rec.fuelType]?.label || ''} ${rec.odometer}`.toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="bg-white dark:bg-auto-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800 space-y-2">
        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum abastecimento encontrado</p>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          ${state.records.length === 0 ? 'Toque na aba "Abastecer" para fazer seu primeiro lançamento.' : 'Tente limpar os filtros de busca acima.'}
        </p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(rawRec => {
    const rec = telemetry.enrichedMap[rawRec.id];
    const fuel = FUEL_TYPES[rec.fuelType] || FUEL_TYPES.gasolina;

    let statusPill = '';
    if (rec.status === 'closed') {
      const burnedNote = rec.burnedFuelType && rec.burnedFuelType !== rec.fuelType && rec.burnedFuelType !== 'misto'
        ? ` (${FUEL_TYPES[rec.burnedFuelType]?.short || ''})`
        : rec.burnedFuelType === 'misto' ? ' (Tanque misto)' : '';

      statusPill = `
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span class="font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            ${formatNumber(rec.kmPerUnit, 2)} km/${fuel.unit}${burnedNote}
          </span>
          <span class="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-auto-950 px-2.5 py-1 rounded-lg">
            ${formatCurrency(rec.costPerKm)}/km
          </span>
          <span class="text-slate-400 ml-auto text-[11px]">
            Ciclo: +${formatIntKm(rec.cycleDistance)} km
          </span>
        </div>
      `;
    } else if (rec.status === 'partial') {
      statusPill = `
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400">
          <span class="font-semibold">Abastecimento parcial — será somado no próximo tanque cheio</span>
          ${rec.stepDeltaKm ? `<span>+${formatIntKm(rec.stepDeltaKm)} km</span>` : ''}
        </div>
      `;
    } else {
      statusPill = `
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Tanque cheio inicial (referência p/ próximo cálculo)</span>
        </div>
      `;
    }

    return `
      <article class="bg-white dark:bg-auto-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${fuel.badgeClass}">
                ${fuel.label}
              </span>
              <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
                ${formatDateBr(rec.date)}
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                rec.fullTank
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }">
                ${rec.fullTank ? 'Cheio' : 'Parcial'}
              </span>
            </div>
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100">
              ${formatIntKm(rec.odometer)} km
              ${rec.notes ? `<span class="font-normal text-xs text-slate-500 dark:text-slate-400"> • ${escapeHtml(rec.notes)}</span>` : ''}
            </p>
          </div>

          <div class="text-right shrink-0">
            <p class="text-lg font-extrabold tracking-tight">${formatCurrency(rec.totalValue)}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              ${formatNumber(rec.quantity, 2)} ${fuel.unit} × R$ ${formatNumber(rec.unitPrice, 2)}
            </p>
          </div>
        </div>

        ${statusPill}

        <!-- Ações Rápidas (Editar / Excluir) -->
        <div class="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onclick="startEditRecord('${rec.id}')"
            class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
          >
            Editar
          </button>
          <button
            type="button"
            onclick="askDeleteRecord('${rec.id}')"
            class="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-bold text-rose-600 dark:text-rose-400 transition flex items-center gap-1"
          >
            Excluir
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function askDeleteRecord(id) {
  const rec = state.records.find(r => r.id === id);
  if (!rec) return;
  openConfirmModal(
    'Excluir Abastecimento?',
    `Deseja remover o registro de ${formatDateBr(rec.date)} (${formatIntKm(rec.odometer)} km — ${formatCurrency(rec.totalValue)})? Os cálculos de média serão atualizados.`,
    'Excluir',
    'danger',
    () => {
      state.records = state.records.filter(r => r.id !== id);
      if (state.editingId === id) cancelEditMode();
      saveToStorage();
      refreshAllViews();
      showToast('Registro excluído.', 'info');
    }
  );
}
