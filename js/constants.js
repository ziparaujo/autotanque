/**
 * Chaves de armazenamento local (localStorage)
 */
const STORAGE_KEY = 'autotanque_v1_records';
const SETTINGS_KEY = 'autotanque_v1_settings';

/**
 * Catálogo de combustíveis suportados
 */
const FUEL_TYPES = {
  gasolina: {
    id: 'gasolina',
    label: 'Gasolina',
    short: 'Gasolina',
    unit: 'L',
    unitName: 'Litros',
    activeClass: 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    barClass: 'bg-amber-500'
  },
  aditivada: {
    id: 'aditivada',
    label: 'Aditivada',
    short: 'Aditivada',
    unit: 'L',
    unitName: 'Litros',
    activeClass: 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    barClass: 'bg-sky-500'
  },
  etanol: {
    id: 'etanol',
    label: 'Etanol',
    short: 'Etanol',
    unit: 'L',
    unitName: 'Litros',
    activeClass: 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    barClass: 'bg-emerald-500'
  },
  gnv: {
    id: 'gnv',
    label: 'GNV (m³)',
    short: 'GNV',
    unit: 'm³',
    unitName: 'Metros Cúbicos (m³)',
    activeClass: 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    barClass: 'bg-purple-500'
  },
  diesel: {
    id: 'diesel',
    label: 'Diesel',
    short: 'Diesel',
    unit: 'L',
    unitName: 'Litros',
    activeClass: 'border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    barClass: 'bg-orange-500'
  }
};
