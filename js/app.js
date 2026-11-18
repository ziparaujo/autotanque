/* ======================================================================
 * INICIALIZAÇÃO DO APLICATIVO
 * ====================================================================== */

function initApp() {
  loadFromStorage();
  document.getElementById('inputDate').value = getTodayISO();
  toggleFullTank(true);
  switchTab('abastecer');
}

window.addEventListener('DOMContentLoaded', initApp);
