/* ======================================================================
 * ABA 4 (PARTE 1): CALCULADORA FLEX INTELIGENTE
 * ====================================================================== */

function getCarFlexData() {
  const telemetry = computeTelemetry();
  const etStats = telemetry.fuelStats.etanol;
  const gasStats = telemetry.fuelStats.gasolina.cycles > 0
    ? telemetry.fuelStats.gasolina
    : telemetry.fuelStats.aditivada;

  const avgEtanol = etStats.qty > 0 ? etStats.distance / etStats.qty : null;
  const avgGasolina = gasStats.qty > 0 ? gasStats.distance / gasStats.qty : null;

  if (avgEtanol && avgGasolina && avgGasolina > 0) {
    return {
      hasCustomRatio: true,
      avgEtanol,
      avgGasolina,
      customRatio: avgEtanol / avgGasolina
    };
  }
  return {
    hasCustomRatio: false,
    avgEtanol,
    avgGasolina,
    customRatio: 0.70
  };
}

function toggleFlexRatioMode(useCustom) {
  state.useCustomFlexRatio = useCustom;
  saveToStorage();
  evaluateFlexCalculator();
}

function updateTankSizeSlider(val) {
  state.tankCapacity = Number(val) || 50;
  document.getElementById('calcTankSizeLabel').textContent = `${state.tankCapacity} L`;
  saveToStorage();
  evaluateFlexCalculator();
}

function prefillFlexInputsIfEmpty() {
  const etInput = document.getElementById('calcEtanolPrice');
  const gasInput = document.getElementById('calcGasolinaPrice');
  document.getElementById('calcTankSize').value = state.tankCapacity;
  document.getElementById('calcTankSizeLabel').textContent = `${state.tankCapacity} L`;

  if (!etInput.value) {
    const lastEt = [...state.records].reverse().find(r => r.fuelType === 'etanol' && r.unitPrice > 0);
    etInput.value = lastEt ? formatNumber(lastEt.unitPrice, 2) : '3,99';
  }
  if (!gasInput.value) {
    const lastGas = [...state.records].reverse().find(r => (r.fuelType === 'gasolina' || r.fuelType === 'aditivada') && r.unitPrice > 0);
    gasInput.value = lastGas ? formatNumber(lastGas.unitPrice, 2) : '5,89';
  }
}

function evaluateFlexCalculator() {
  const flexInfo = getCarFlexData();
  const bannerEl = document.getElementById('flexSmartBanner');
  const badgeEl = document.getElementById('flexRatioModeBadge');
  const resultEl = document.getElementById('flexResultCard');

  const activeRatio = (flexInfo.hasCustomRatio && state.useCustomFlexRatio)
    ? flexInfo.customRatio
    : 0.70;

  if (flexInfo.hasCustomRatio) {
    const pctStr = formatNumber(flexInfo.customRatio * 100, 1) + '%';
    badgeEl.textContent = state.useCustomFlexRatio ? `Seu Carro (${pctStr})` : 'Padrão 70%';

    bannerEl.innerHTML = `
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p class="font-bold text-emerald-600 dark:text-emerald-400">Histórico real do seu carro ativo!</p>
          <p class="text-slate-600 dark:text-slate-400 mt-0.5">
            Etanol: <strong>${formatNumber(flexInfo.avgEtanol, 1)} km/L</strong> vs Gasolina: <strong>${formatNumber(flexInfo.avgGasolina, 1)} km/L</strong> (rendimento real de <strong>${pctStr}</strong>)
          </p>
        </div>
        <div class="flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
          <button type="button" onclick="toggleFlexRatioMode(true)" class="px-2.5 py-1 rounded-md transition ${state.useCustomFlexRatio ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400'}">Meu Carro</button>
          <button type="button" onclick="toggleFlexRatioMode(false)" class="px-2.5 py-1 rounded-md transition ${!state.useCustomFlexRatio ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400'}">70%</button>
        </div>
      </div>
    `;
  } else {
    badgeEl.textContent = 'Referência 70%';
    bannerEl.innerHTML = `
      <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
        Usando a referência clássica de <strong>70%</strong>. Assim que você tiver médias fechadas de <strong>Etanol</strong> e <strong>Gasolina</strong> no histórico, esta calculadora se ajustará automaticamente ao motor do seu carro!
      </p>
    `;
  }

  const pEtanol = parseBrFloat(document.getElementById('calcEtanolPrice').value);
  const pGasolina = parseBrFloat(document.getElementById('calcGasolinaPrice').value);

  if (!Number.isFinite(pEtanol) || pEtanol <= 0 || !Number.isFinite(pGasolina) || pGasolina <= 0) {
    resultEl.innerHTML = `<p class="text-xs text-center text-slate-500 py-2">Digite os preços atuais do Etanol e da Gasolina na bomba acima.</p>`;
    return;
  }

  const currentPriceRatio = pEtanol / pGasolina;
  const maxWorthEtanolPrice = pGasolina * activeRatio;
  const etanolWins = currentPriceRatio <= activeRatio;

  // Simulação financeira para a autonomia equivalente a 1 tanque de Gasolina
  // Ex: se o carro tem tanque de 50L de gasolina, para rodar a mesma distância no etanol precisará de (50 / activeRatio) litros de etanol.
  const tankLiters = state.tankCapacity;
  const costFullGas = tankLiters * pGasolina;
  const eqCostEtanolForSameRange = (tankLiters / activeRatio) * pEtanol;
  const savingsForSameRange = Math.abs(costFullGas - eqCostEtanolForSameRange);

  // Se tivermos km/L reais, mostramos também R$/km exato estimado!
  let costKmComparisonHtml = '';
  if (flexInfo.hasCustomRatio && state.useCustomFlexRatio) {
    const cKmEt = pEtanol / flexInfo.avgEtanol;
    const cKmGas = pGasolina / flexInfo.avgGasolina;
    costKmComparisonHtml = `
      <div class="grid grid-cols-2 gap-2 pt-2 text-xs">
        <div class="p-2.5 rounded-xl bg-white dark:bg-auto-900 border border-slate-200 dark:border-slate-800">
          <span class="text-slate-500 block text-[11px]">Custo no Etanol</span>
          <strong class="text-sm text-emerald-600 dark:text-emerald-400">${formatCurrency(cKmEt)} / km</strong>
        </div>
        <div class="p-2.5 rounded-xl bg-white dark:bg-auto-900 border border-slate-200 dark:border-slate-800">
          <span class="text-slate-500 block text-[11px]">Custo na Gasolina</span>
          <strong class="text-sm text-amber-600 dark:text-amber-400">${formatCurrency(cKmGas)} / km</strong>
        </div>
      </div>
    `;
  }

  if (etanolWins) {
    resultEl.className = 'rounded-2xl p-4 bg-emerald-500/10 border-2 border-emerald-500/40 space-y-2.5';
    resultEl.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Melhor Escolha Agora</span>
        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white">Relação: ${formatNumber(currentPriceRatio * 100, 1)}%</span>
      </div>
      <p class="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">Abasteça com ETANOL</p>
      <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        O Etanol compensa até <strong>R$ ${formatNumber(maxWorthEtanolPrice, 2)}/L</strong>. Você economiza cerca de <strong>${formatCurrency(savingsForSameRange)}</strong> para rodar a autonomia equivalente a um tanque de ${tankLiters}L.
      </p>
      ${costKmComparisonHtml}
    `;
  } else {
    resultEl.className = 'rounded-2xl p-4 bg-amber-500/10 border-2 border-amber-500/40 space-y-2.5';
    resultEl.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Melhor Escolha Agora</span>
        <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950">Relação: ${formatNumber(currentPriceRatio * 100, 1)}%</span>
      </div>
      <p class="text-2xl font-extrabold text-amber-700 dark:text-amber-300">Abasteça com GASOLINA</p>
      <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
        Para o Etanol valer a pena hoje, precisaria custar no máximo <strong>R$ ${formatNumber(maxWorthEtanolPrice, 2)}/L</strong>. Com Gasolina você economiza cerca de <strong>${formatCurrency(savingsForSameRange)}</strong> por tanque (${tankLiters}L).
      </p>
      ${costKmComparisonHtml}
    `;
  }
}
