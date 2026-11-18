/**
 * Estado em memória do aplicativo
 */
let state = {
  records: [],
  activeTab: 'abastecer',
  selectedFuel: 'gasolina',
  isFullTank: true,
  editingId: null,
  historyFilter: 'todos',
  calcAnchorField: 'total', // Controla cálculo bidirecional amigável ('total' ou 'quantity')
  useCustomFlexRatio: true,
  tankCapacity: 50,
  theme: 'dark'
};

let confirmCallback = null;
let toastTimer = null;
