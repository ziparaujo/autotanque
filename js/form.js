/* ======================================================================
 * ABA 1: FORMULÁRIO INTELIGENTE DE ABASTECIMENTO
 * ====================================================================== */

function renderFuelSelector() {
  const grid = document.getElementById('fuelTypeGrid');
  const keys = Object.keys(FUEL_TYPES);

  grid.innerHTML = keys.map((key, idx) => {
    const f = FUEL_TYPES[key];
    const isSelected = state.selectedFuel === key;
    const spanClass = idx === keys.length - 1 && keys.length % 3 !== 0 ? 'col-span-1' : '';
    return `
      <button
        type="button"
        onclick="selectFuelType('${key}')"
        class="${spanClass} py-3 px-2 rounded-xl border-2 font-bold text-sm transition active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
          isSelected
            ? f.activeClass
            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-auto-950 text-slate-600 dark:text-slate-400'
        }"
      >
        <span>${f.short}</span>
        <span class="text-[10px] opacity-75 font-medium">${f.unit === 'm³' ? 'em m³' : 'Litros'}</span>
      </button>
    `;
  }).join('');

  // Ajustar rótulos de unidade (Litros vs m³)
  const currentFuel = FUEL_TYPES[state.selectedFuel];
  document.getElementById('labelUnitPrice').textContent = `Preço / ${currentFuel.unit} (R$)`;
  document.getElementById('labelQuantity').textContent = `Quantidade (${currentFuel.unitName})`;
  document.getElementById('unitSuffixBadge').textContent = currentFuel.unit;
  document.getElementById('fullTankTitle').textContent = currentFuel.id === 'gnv' ? 'Cilindro Cheio' : 'Tanque Cheio';
  document.getElementById('fullTankDesc').textContent = currentFuel.id === 'gnv'
    ? 'Permite fechar o ciclo e calcular a média exata de km/m³'
    : 'Permite fechar o ciclo e calcular a média exata de km/L';

  // Se não estiver editando e o campo Preço/L estiver vazio, sugere último preço pago desse combustível
  if (!state.editingId) {
    const priceInput = document.getElementById('inputUnitPrice');
    const lastSameFuel = [...state.records]
      .reverse()
      .find(r => r.fuelType === state.selectedFuel && r.unitPrice > 0);
    if (lastSameFuel && !priceInput.value) {
      priceInput.placeholder = formatNumber(lastSameFuel.unitPrice, 2);
    }
  }
}

function selectFuelType(fuelKey) {
  state.selectedFuel = fuelKey;
  renderFuelSelector();
  saveToStorage();
}

function toggleFullTank(forceValue) {
  state.isFullTank = typeof forceValue === 'boolean' ? forceValue : !state.isFullTank;
  const btn = document.getElementById('fullTankToggleBtn');
  const track = document.getElementById('fullTankSwitchTrack');
  const thumb = document.getElementById('fullTankSwitchThumb');
  const tag = document.getElementById('fullTankTag');
  const title = document.getElementById('fullTankTitle');

  btn.setAttribute('aria-checked', String(state.isFullTank));

  if (state.isFullTank) {
    btn.className = 'w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 text-left transition active:scale-[0.99]';
    track.className = 'w-14 h-8 flex items-center rounded-full p-1 bg-emerald-500 transition-colors shrink-0';
    thumb.className = 'bg-white w-6 h-6 rounded-full shadow-md transform translate-x-6 transition-transform';
    title.className = 'text-sm font-extrabold text-emerald-700 dark:text-emerald-300';
    tag.textContent = 'Ativo';
    tag.className = 'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white';
  } else {
    btn.className = 'w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-auto-950 border-2 border-slate-200 dark:border-slate-800 text-left transition active:scale-[0.99]';
    track.className = 'w-14 h-8 flex items-center rounded-full p-1 bg-slate-300 dark:bg-slate-700 transition-colors shrink-0';
    thumb.className = 'bg-white w-6 h-6 rounded-full shadow-md transform translate-x-0 transition-transform';
    title.className = 'text-sm font-extrabold text-slate-700 dark:text-slate-300';
    tag.textContent = 'Parcial';
    tag.className = 'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
  }
}

/**
 * Cálculo automático bidirecional entre Valor Total, Preço/L e Quantidade
 */
function handleSmartCalc(changedField) {
  const totalEl = document.getElementById('inputTotal');
  const priceEl = document.getElementById('inputUnitPrice');
  const qtyEl = document.getElementById('inputQuantity');
  document.getElementById('valuesError').classList.add('hidden');

  const totalVal = parseBrFloat(totalEl.value);
  const priceVal = parseBrFloat(priceEl.value);
  const qtyVal = parseBrFloat(qtyEl.value);

  if (changedField === 'total') {
    state.calcAnchorField = 'total';
    if (totalVal > 0 && priceVal > 0) {
      qtyEl.value = formatNumber(totalVal / priceVal, 2);
    } else if (totalVal > 0 && qtyVal > 0 && !priceEl.value.trim()) {
      priceEl.value = formatNumber(totalVal / qtyVal, 2);
    }
  } else if (changedField === 'quantity') {
    state.calcAnchorField = 'quantity';
    if (qtyVal > 0 && priceVal > 0) {
      totalEl.value = formatNumber(qtyVal * priceVal, 2);
    } else if (qtyVal > 0 && totalVal > 0 && !priceEl.value.trim()) {
      priceEl.value = formatNumber(totalVal / qtyVal, 2);
    }
  } else if (changedField === 'unitPrice') {
    if (priceVal > 0) {
      if (state.calcAnchorField === 'total' && totalVal > 0) {
        qtyEl.value = formatNumber(totalVal / priceVal, 2);
      } else if (state.calcAnchorField === 'quantity' && qtyVal > 0) {
        totalEl.value = formatNumber(qtyVal * priceVal, 2);
      } else if (totalVal > 0) {
        qtyEl.value = formatNumber(totalVal / priceVal, 2);
      } else if (qtyVal > 0) {
        totalEl.value = formatNumber(qtyVal * priceVal, 2);
      }
    }
  }
}

function updateOdometerReferenceUI() {
  const telemetry = computeTelemetry();
  const hintEl = document.getElementById('lastOdometerHint');
  const chipsEl = document.getElementById('quickKmChips');

  // Excluir o próprio registro se estivermos editando
  const others = telemetry.sortedAsc.filter(r => r.id !== state.editingId);
  const latest = others.length > 0 ? others[others.length - 1] : null;

  if (latest) {
    hintEl.innerHTML = `Último: <strong class="text-slate-800 dark:text-slate-200">${formatIntKm(latest.odometer)} km</strong> (${formatDateBr(latest.date)})`;
    if (!state.editingId) {
      chipsEl.classList.remove('hidden');
    } else {
      chipsEl.classList.add('hidden');
    }
  } else {
    hintEl.textContent = '1º registro de odômetro do veículo';
    chipsEl.classList.add('hidden');
  }
  onOdometerInput();
}

function addQuickKm(delta) {
  const telemetry = computeTelemetry();
  const latest = telemetry.latestRecord;
  if (!latest) return;
  const inputEl = document.getElementById('inputOdometer');
  const currentTyped = parseBrFloat(inputEl.value);
  const base = Number.isFinite(currentTyped) && currentTyped >= latest.odometer ? currentTyped : latest.odometer;
  inputEl.value = Math.round(base + delta);
  onOdometerInput();
}

function onOdometerInput() {
  const odoEl = document.getElementById('inputOdometer');
  const dateEl = document.getElementById('inputDate');
  const deltaBadge = document.getElementById('liveDeltaKm');
  const errEl = document.getElementById('odometerError');

  errEl.classList.add('hidden');
  deltaBadge.textContent = '';

  const typedOdo = parseBrFloat(odoEl.value);
  if (!Number.isFinite(typedOdo) || typedOdo <= 0) return;

  const selectedDate = dateEl.value || getTodayISO();
  const others = state.records
    .filter(r => r.id !== state.editingId)
    .sort((a, b) => a.odometer - b.odometer);

  if (others.length === 0) return;

  // Encontrar registros anteriores por data para validar coerência cronológica
  const earlierOrSameDate = others.filter(r => r.date <= selectedDate);
  const laterDate = others.filter(r => r.date > selectedDate);

  if (earlierOrSameDate.length > 0) {
    const refPrev = earlierOrSameDate[earlierOrSameDate.length - 1];
    const diff = typedOdo - refPrev.odometer;
    if (diff > 0) {
      deltaBadge.textContent = `+${formatIntKm(diff)} km rodados`;
      deltaBadge.className = 'text-xs font-bold text-emerald-600 dark:text-emerald-400';
    } else if (selectedDate > refPrev.date && diff <= 0) {
      deltaBadge.textContent = 'Abaixo do anterior';
      deltaBadge.className = 'text-xs font-bold text-rose-500';
    }
  } else if (laterDate.length > 0) {
    // Registro retroativo anterior a todos os existentes
    const firstNext = laterDate[0];
    if (typedOdo < firstNext.odometer) {
      deltaBadge.textContent = 'Registro retroativo válido';
      deltaBadge.className = 'text-xs font-bold text-amber-500';
    }
  }
}

function validateRefuelForm() {
  const odoVal = parseBrFloat(document.getElementById('inputOdometer').value);
  const totalVal = parseBrFloat(document.getElementById('inputTotal').value);
  const priceVal = parseBrFloat(document.getElementById('inputUnitPrice').value);
  const qtyVal = parseBrFloat(document.getElementById('inputQuantity').value);
  const dateVal = document.getElementById('inputDate').value || getTodayISO();

  const odoErr = document.getElementById('odometerError');
  const valErr = document.getElementById('valuesError');
  odoErr.classList.add('hidden');
  valErr.classList.add('hidden');

  if (!Number.isFinite(odoVal) || odoVal <= 0) {
    odoErr.textContent = 'Informe o odômetro atual do veículo em quilômetros.';
    odoErr.classList.remove('hidden');
    return null;
  }

  // Validação cronológica inteligente (permite retroativo se a data for anterior!)
  const others = state.records.filter(r => r.id !== state.editingId);
  const strictlyEarlier = others.filter(r => r.date < dateVal);
  const strictlyLater = others.filter(r => r.date > dateVal);

  if (strictlyEarlier.length > 0) {
    const maxEarlierOdo = Math.max(...strictlyEarlier.map(r => r.odometer));
    if (odoVal <= maxEarlierOdo) {
      odoErr.textContent = `Para a data ${formatDateBr(dateVal)}, o odômetro deve ser maior que ${formatIntKm(maxEarlierOdo)} km (ou ajuste a data para lançamento retroativo).`;
      odoErr.classList.remove('hidden');
      return null;
    }
  }

  // Se for na mesma data do último registro e não for retroativo, evita digitação menor por engano
  const sameDayRecords = others.filter(r => r.date === dateVal);
  if (sameDayRecords.length > 0 && strictlyLater.length === 0 && !state.editingId) {
    const maxSameDay = Math.max(...sameDayRecords.map(r => r.odometer));
    if (odoVal < maxSameDay) {
      odoErr.textContent = `Já existe um registro hoje com ${formatIntKm(maxSameDay)} km. Confira o odômetro ou a data.`;
      odoErr.classList.remove('hidden');
      return null;
    }
  }

  if (strictlyLater.length > 0) {
    const minLaterOdo = Math.min(...strictlyLater.map(r => r.odometer));
    if (odoVal >= minLaterOdo) {
      odoErr.textContent = `Para registro retroativo em ${formatDateBr(dateVal)}, o odômetro precisa ser menor que ${formatIntKm(minLaterOdo)} km.`;
      odoErr.classList.remove('hidden');
      return null;
    }
  }

  if (!Number.isFinite(totalVal) || totalVal <= 0 || !Number.isFinite(priceVal) || priceVal <= 0 || !Number.isFinite(qtyVal) || qtyVal <= 0) {
    valErr.textContent = 'Preencha o Valor Pago e o Preço/Litro (ou Quantidade) com valores maiores que zero.';
    valErr.classList.remove('hidden');
    return null;
  }

  return {
    odometer: Math.round(odoVal * 10) / 10,
    totalValue: Math.round(totalVal * 100) / 100,
    unitPrice: Math.round(priceVal * 1000) / 1000,
    quantity: Math.round(qtyVal * 100) / 100,
    date: dateVal,
    notes: document.getElementById('inputNotes').value.trim(),
    fuelType: state.selectedFuel,
    fullTank: state.isFullTank
  };
}

function handleSaveRefuel(event) {
  event.preventDefault();
  const validData = validateRefuelForm();
  if (!validData) return;

  if (state.editingId) {
    const idx = state.records.findIndex(r => r.id === state.editingId);
    if (idx !== -1) {
      state.records[idx] = { ...state.records[idx], ...validData };
    }
    cancelEditMode(false);
    saveToStorage();
    refreshAllViews();
    showToast('Abastecimento atualizado com sucesso!', 'success');
    switchTab('historico');
  } else {
    const newRecord = {
      id: generateId(),
      createdAt: Date.now(),
      ...validData
    };
    state.records.push(newRecord);
    saveToStorage();
    resetRefuelForm();
    refreshAllViews();

    // Mostrar feedback inteligente se fechou ciclo de consumo!
    const telemetry = computeTelemetry();
    const savedEnriched = telemetry.enrichedMap[newRecord.id];
    if (savedEnriched && savedEnriched.status === 'closed') {
      const u = FUEL_TYPES[newRecord.fuelType].unit;
      showToast(`Salvo! Média do ciclo: ${formatNumber(savedEnriched.kmPerUnit, 1)} km/${u}`, 'success');
    } else {
      showToast('Abastecimento registrado no aparelho!', 'success');
    }
  }
}

function resetRefuelForm() {
  document.getElementById('inputOdometer').value = '';
  document.getElementById('inputTotal').value = '';
  document.getElementById('inputUnitPrice').value = '';
  document.getElementById('inputQuantity').value = '';
  document.getElementById('inputNotes').value = '';
  document.getElementById('inputDate').value = getTodayISO();
  document.getElementById('odometerError').classList.add('hidden');
  document.getElementById('valuesError').classList.add('hidden');
  toggleFullTank(true);
  renderFuelSelector();
  updateOdometerReferenceUI();
}

function startEditRecord(id) {
  const rec = state.records.find(r => r.id === id);
  if (!rec) return;

  state.editingId = rec.id;
  state.selectedFuel = rec.fuelType;

  document.getElementById('editModeBanner').classList.remove('hidden');
  document.getElementById('submitRefuelText').textContent = 'Salvar Alterações';

  renderFuelSelector();
  toggleFullTank(Boolean(rec.fullTank));

  document.getElementById('inputOdometer').value = rec.odometer;
  document.getElementById('inputTotal').value = formatNumber(rec.totalValue, 2);
  document.getElementById('inputUnitPrice').value = formatNumber(rec.unitPrice, 2);
  document.getElementById('inputQuantity').value = formatNumber(rec.quantity, 2);
  document.getElementById('inputDate').value = rec.date;
  document.getElementById('inputNotes').value = rec.notes || '';

  switchTab('abastecer');
  updateOdometerReferenceUI();
}

function cancelEditMode(resetFields = true) {
  state.editingId = null;
  document.getElementById('editModeBanner').classList.add('hidden');
  document.getElementById('submitRefuelText').textContent = 'Registrar Abastecimento';
  if (resetFields) {
    resetRefuelForm();
  }
}
