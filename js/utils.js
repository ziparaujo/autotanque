/* ======================================================================
 * UTILITÁRIOS DE FORMATAÇÃO E CONVERSÃO NUMÉRICA (PT-BR)
 * ====================================================================== */

/**
 * Converte textos digitados no celular ("5,89" ou "5.89" ou "1.250,50") em número float seguro
 */
function parseBrFloat(val) {
  if (val === null || val === undefined) return NaN;
  let str = String(val).trim().replace(/\s/g, '');
  if (!str) return NaN;
  // Se tiver ponto e vírgula (ex: 1.250,50), remove pontos de milhar e troca vírgula por ponto
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : NaN;
}

function formatCurrency(val) {
  if (!Number.isFinite(val)) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(val, decimals = 2) {
  if (!Number.isFinite(val)) return '--';
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatIntKm(val) {
  if (!Number.isFinite(val)) return '0';
  return Math.round(val).toLocaleString('pt-BR');
}

function getTodayISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function formatDateBr(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function generateId() {
  return 'ab_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
