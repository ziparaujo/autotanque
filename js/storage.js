/* ======================================================================
 * PERSISTÊNCIA LOCAL (LOCALSTORAGE) E TEMA
 * ====================================================================== */

function loadFromStorage() {
  try {
    const rawRecords = localStorage.getItem(STORAGE_KEY);
    if (rawRecords) {
      const parsed = JSON.parse(rawRecords);
      if (Array.isArray(parsed)) {
        state.records = parsed;
      }
    }
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      const s = JSON.parse(rawSettings);
      if (s.theme) state.theme = s.theme;
      if (s.selectedFuel && FUEL_TYPES[s.selectedFuel]) state.selectedFuel = s.selectedFuel;
      if (s.tankCapacity) state.tankCapacity = Number(s.tankCapacity) || 50;
      if (typeof s.useCustomFlexRatio === 'boolean') state.useCustomFlexRatio = s.useCustomFlexRatio;
    }
  } catch (err) {
    console.error('Erro ao carregar localStorage:', err);
  }
  applyTheme();
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      theme: state.theme,
      selectedFuel: state.selectedFuel,
      tankCapacity: state.tankCapacity,
      useCustomFlexRatio: state.useCustomFlexRatio
    }));
  } catch (err) {
    showToast('Erro ao salvar no aparelho (memória cheia).', 'error');
  }
}

function applyTheme() {
  const htmlEl = document.documentElement;
  if (state.theme === 'dark') {
    htmlEl.classList.add('dark');
  } else {
    htmlEl.classList.remove('dark');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveToStorage();
}
