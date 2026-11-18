/* ======================================================================
 * ABA 4 (PARTE 2): EXPORTAÇÃO E IMPORTAÇÃO DE DADOS (CSV / JSON)
 * ====================================================================== */

function triggerFileDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCSV() {
  if (state.records.length === 0) {
    showToast('Não há registros para exportar ainda.', 'error');
    return;
  }

  const telemetry = computeTelemetry();
  const headers = [
    'Data',
    'Odometro_km',
    'Combustivel',
    'Tanque_Cheio',
    'Quantidade',
    'Unidade',
    'Preco_Unitario_RS',
    'Valor_Total_RS',
    'Consumo_Ciclo',
    'Custo_por_Km_RS',
    'Posto_Observacao'
  ];

  const rows = telemetry.sortedAsc.map(raw => {
    const r = telemetry.enrichedMap[raw.id];
    const f = FUEL_TYPES[r.fuelType] || FUEL_TYPES.gasolina;
    const dec = n => (Number.isFinite(n) ? String(n.toFixed(2)).replace('.', ',') : '');
    const safeNote = `"${String(r.notes || '').replace(/"/g, '""')}"`;

    return [
      formatDateBr(r.date),
      String(r.odometer).replace('.', ','),
      f.label,
      r.fullTank ? 'Sim' : 'Nao',
      dec(r.quantity),
      f.unit,
      String(r.unitPrice.toFixed(3)).replace('.', ','),
      dec(r.totalValue),
      r.kmPerUnit ? dec(r.kmPerUnit) : '',
      r.costPerKm ? dec(r.costPerKm) : '',
      safeNote
    ].join(';');
  });

  // UTF-8 com BOM (\uFEFF) e ponto-e-vírgula para abrir direto no Excel em Português!
  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const fileDate = getTodayISO();
  triggerFileDownload(`autotanque_planilha_${fileDate}.csv`, csvContent, 'text/csv;charset=utf-8;');
  showToast('Planilha CSV gerada com sucesso!', 'success');
}

function exportJSON() {
  if (state.records.length === 0) {
    showToast('Não há registros para exportar ainda.', 'error');
    return;
  }
  const payload = {
    app: 'AutoTanque',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      tankCapacity: state.tankCapacity,
      selectedFuel: state.selectedFuel
    },
    records: state.records
  };
  const fileDate = getTodayISO();
  triggerFileDownload(`autotanque_backup_${fileDate}.json`, JSON.stringify(payload, null, 2), 'application/json');
  showToast('Backup JSON baixado!', 'success');
}

function handleImportJSON(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = '';
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const importedRecords = Array.isArray(parsed) ? parsed : parsed.records;

      if (!Array.isArray(importedRecords) || importedRecords.length === 0) {
        showToast('Arquivo JSON inválido ou sem abastecimentos.', 'error');
        return;
      }

      // Validar campos essenciais de cada registro
      const sanitized = importedRecords
        .filter(r => Number.isFinite(Number(r.odometer)) && Number.isFinite(Number(r.totalValue)) && Number.isFinite(Number(r.quantity)))
        .map(r => ({
          id: r.id || generateId(),
          date: r.date || getTodayISO(),
          odometer: Number(r.odometer),
          fuelType: FUEL_TYPES[r.fuelType] ? r.fuelType : 'gasolina',
          totalValue: Number(r.totalValue),
          unitPrice: Number(r.unitPrice) || Number((r.totalValue / r.quantity).toFixed(3)),
          quantity: Number(r.quantity),
          fullTank: typeof r.fullTank === 'boolean' ? r.fullTank : true,
          notes: r.notes ? String(r.notes).slice(0, 60) : ''
        }));

      if (sanitized.length === 0) {
        showToast('Nenhum registro válido encontrado no arquivo.', 'error');
        return;
      }

      openConfirmModal(
        'Restaurar Backup JSON?',
        `Foram encontrados ${sanitized.length} abastecimentos no arquivo. Deseja substituir os dados atuais por este backup?`,
        'Restaurar Dados',
        'primary',
        () => {
          state.records = sanitized;
          if (parsed.settings && parsed.settings.tankCapacity) {
            state.tankCapacity = Number(parsed.settings.tankCapacity) || 50;
          }
          saveToStorage();
          refreshAllViews();
          showToast(`${sanitized.length} registros importados com sucesso!`, 'success');
        }
      );
    } catch (err) {
      showToast('Erro ao ler o arquivo JSON.', 'error');
    }
  };
  reader.readAsText(file);
}


function askClearAllData() {
  if (state.records.length === 0) {
    showToast('O histórico já está vazio.', 'info');
    return;
  }
  openConfirmModal(
    'Apagar Todos os Dados?',
    `Todos os ${state.records.length} abastecimentos salvos neste navegador serão apagados permanentemente. Recomendamos baixar um Backup antes.`,
    'Sim, Apagar Tudo',
    'danger',
    () => {
      state.records = [];
      cancelEditMode();
      saveToStorage();
      refreshAllViews();
      showToast('Todos os dados foram removidos do aparelho.', 'info');
    }
  );
}
