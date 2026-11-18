/* ======================================================================
 * NAVEGAÇÃO ENTRE ABAS, MODAL, TOASTS E SINCRONIZAÇÃO DE INTERFACE
 * ====================================================================== */

function switchTab(tabName) {
  state.activeTab = tabName;

  ['abastecer', 'painel', 'historico', 'calc'].forEach(t => {
    const sec = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`nav-${t}`);
    if (t === tabName) {
      sec.classList.remove('hidden');
      btn.className = 'nav-btn flex flex-col items-center justify-center py-2 rounded-xl transition text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
    } else {
      sec.classList.add('hidden');
      btn.className = 'nav-btn flex flex-col items-center justify-center py-2 rounded-xl transition text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200';
    }
  });

  refreshAllViews();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ======================================================================
 * MODAL DE CONFIRMAÇÃO E TOASTS (ZERO ALERT / ZERO CONFIRM NATIVO)
 * ====================================================================== */

function openConfirmModal(title, description, actionText, variant, onConfirm) {
  confirmCallback = onConfirm;
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalDesc').textContent = description;

  const actionBtn = document.getElementById('confirmModalActionBtn');
  const iconBox = document.getElementById('confirmIconBox');
  actionBtn.textContent = actionText;

  if (variant === 'danger') {
    actionBtn.className = 'flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold transition';
    iconBox.className = 'w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0';
  } else {
    actionBtn.className = 'flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold transition';
    iconBox.className = 'w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0';
  }

  actionBtn.onclick = () => {
    const cb = confirmCallback;
    closeConfirmModal();
    if (typeof cb === 'function') cb();
  };

  const modal = document.getElementById('confirmModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  confirmCallback = null;
}

function showToast(message, type = 'success') {
  const box = document.getElementById('toastBox');
  const text = document.getElementById('toastText');
  if (toastTimer) clearTimeout(toastTimer);

  text.textContent = message;
  let colorClasses = 'bg-emerald-600 border-emerald-400 text-white';
  if (type === 'error') {
    colorClasses = 'bg-rose-600 border-rose-400 text-white';
  } else if (type === 'info') {
    colorClasses = 'bg-slate-800 border-slate-600 text-white';
  }

  box.className = `pointer-events-auto max-w-sm w-full rounded-2xl px-4 py-3 shadow-2xl border text-sm font-bold flex items-center justify-center text-center transition-all ${colorClasses}`;
  box.classList.remove('hidden');

  toastTimer = setTimeout(() => {
    box.classList.add('hidden');
  }, 3000);
}

/* ======================================================================
 * SINCRONIZAÇÃO GERAL DA INTERFACE
 * ====================================================================== */

function updateStationsAutocomplete() {
  const datalist = document.getElementById('stationsDatalist');
  const uniqueNotes = Array.from(
    new Set(state.records.map(r => (r.notes || '').trim()).filter(Boolean))
  ).slice(-12);
  datalist.innerHTML = uniqueNotes.map(n => `<option value="${escapeHtml(n)}"></option>`).join('');
}

function refreshAllViews() {
  const count = state.records.length;
  const telemetry = computeTelemetry();

  // Subtítulo do cabeçalho
  const subEl = document.getElementById('headerSubtitle');
  if (telemetry.latestRecord) {
    const avgChip = telemetry.avgLiquidKmL
      ? ` • Média ${formatNumber(telemetry.avgLiquidKmL, 1)} km/L`
      : '';
    subEl.textContent = `${formatIntKm(telemetry.latestRecord.odometer)} km${avgChip}`;
  } else {
    subEl.textContent = 'Armazenamento local offline';
  }


  // Contador de armazenamento na aba Backup
  document.getElementById('storageCountBadge').textContent = count === 1 ? '1 registro' : `${count} registros`;

  updateStationsAutocomplete();
  renderFuelSelector();
  updateOdometerReferenceUI();
  renderDashboard();
  renderHistory();
  prefillFlexInputsIfEmpty();
  evaluateFlexCalculator();
}
