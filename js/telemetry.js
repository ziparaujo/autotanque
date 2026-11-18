/* ======================================================================
 * MOTOR DE CÁLCULO REAL DE CONSUMO (KM/L, KM/M³ E R$/KM)
 * ====================================================================== */

/**
 * Ordena registros por odômetro crescente (desempate por data) e calcula:
 * - Distância percorrida desde o último abastecimento
 * - Ciclos fechados entre abastecimentos com "Tanque Cheio", somando
 *   automaticamente os litros e valores de abastecimentos parciais intermediários!
 * - Separa ciclos de tanque líquido (L) dos ciclos de cilindro GNV (m³) para
 *   não misturar unidades diferentes no mesmo veículo.
 */
function computeTelemetry() {
  const sorted = [...state.records].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    return (a.date || '').localeCompare(b.date || '');
  });

  const enrichedMap = {};

  // Estado acumulador separado por sistema de alimentação: 'liquid' (L) vs 'gnv' (m³)
  const trackers = {
    liquid: {
      lastFullRecord: null,
      accQty: 0,
      accCost: 0,
      partialFuels: new Set()
    },
    gnv: {
      lastFullRecord: null,
      accQty: 0,
      accCost: 0,
      partialFuels: new Set()
    }
  };

  const fuelStats = {};
  Object.keys(FUEL_TYPES).forEach(k => {
    fuelStats[k] = { distance: 0, qty: 0, cost: 0, cycles: 0 };
  });

  let totalLiquidCycleDist = 0;
  let totalLiquidCycleQty = 0;
  let totalLiquidCycleCost = 0;

  let totalGnvCycleDist = 0;
  let totalGnvCycleQty = 0;
  let totalGnvCycleCost = 0;

  sorted.forEach((rec, index) => {
    const prevOverall = index > 0 ? sorted[index - 1] : null;
    const stepDeltaKm = prevOverall ? Math.max(0, rec.odometer - prevOverall.odometer) : null;

    const streamKey = rec.fuelType === 'gnv' ? 'gnv' : 'liquid';
    const tr = trackers[streamKey];

    let cycleInfo = {
      status: 'anchor', // 'no_anchor' | 'anchor' | 'partial' | 'closed'
      cycleDistance: null,
      cycleQty: null,
      cycleCost: null,
      kmPerUnit: null,
      costPerKm: null,
      burnedFuelType: null
    };

    if (!tr.lastFullRecord) {
      // Antes do primeiro tanque cheio desse sistema
      if (rec.fullTank) {
        tr.lastFullRecord = rec;
        tr.accQty = 0;
        tr.accCost = 0;
        tr.partialFuels.clear();
        cycleInfo.status = 'anchor';
      } else {
        cycleInfo.status = 'no_anchor';
      }
    } else {
      // Já temos um tanque cheio anterior servindo de referência!
      tr.accQty += rec.quantity;
      tr.accCost += rec.totalValue;

      if (!rec.fullTank) {
        tr.partialFuels.add(rec.fuelType);
        cycleInfo.status = 'partial';
      } else {
        const dist = rec.odometer - tr.lastFullRecord.odometer;
        if (dist > 0 && tr.accQty > 0) {
          const kmPerUnit = dist / tr.accQty;
          const costPerKm = tr.accCost / dist;

          // O combustível efetivamente consumido no trecho saiu do tanque cheio anterior
          // (+ eventuais parciais intermediários). Se houve mistura líquida no meio, marcamos 'misto'.
          const baseFuel = tr.lastFullRecord.fuelType;
          const hadDifferentPartial = Array.from(tr.partialFuels).some(f => f !== baseFuel);
          const attributedFuel = hadDifferentPartial ? 'misto' : baseFuel;

          cycleInfo = {
            status: 'closed',
            cycleDistance: dist,
            cycleQty: tr.accQty,
            cycleCost: tr.accCost,
            kmPerUnit,
            costPerKm,
            burnedFuelType: attributedFuel
          };

          if (streamKey === 'liquid') {
            totalLiquidCycleDist += dist;
            totalLiquidCycleQty += tr.accQty;
            totalLiquidCycleCost += tr.accCost;
          } else {
            totalGnvCycleDist += dist;
            totalGnvCycleQty += tr.accQty;
            totalGnvCycleCost += tr.accCost;
          }

          if (attributedFuel !== 'misto' && fuelStats[attributedFuel]) {
            fuelStats[attributedFuel].distance += dist;
            fuelStats[attributedFuel].qty += tr.accQty;
            fuelStats[attributedFuel].cost += tr.accCost;
            fuelStats[attributedFuel].cycles += 1;
          }
        }
        // Este tanque cheio passa a ser a nova âncora para o próximo ciclo!
        tr.lastFullRecord = rec;
        tr.accQty = 0;
        tr.accCost = 0;
        tr.partialFuels.clear();
      }
    }

    enrichedMap[rec.id] = {
      ...rec,
      stepDeltaKm,
      ...cycleInfo
    };
  });

  const totalInvested = sorted.reduce((acc, r) => acc + (r.totalValue || 0), 0);
  const totalDriven = sorted.length >= 2
    ? Math.max(0, sorted[sorted.length - 1].odometer - sorted[0].odometer)
    : 0;

  // Médias gerais
  const avgLiquidKmL = totalLiquidCycleQty > 0 ? (totalLiquidCycleDist / totalLiquidCycleQty) : null;
  const avgGnvKmM3 = totalGnvCycleQty > 0 ? (totalGnvCycleDist / totalGnvCycleQty) : null;

  const combinedCycleDist = totalLiquidCycleDist + totalGnvCycleDist;
  const combinedCycleCost = totalLiquidCycleCost + totalGnvCycleCost;
  const avgCostPerKm = combinedCycleDist > 0 ? (combinedCycleCost / combinedCycleDist) : null;

  return {
    sortedAsc: sorted,
    enrichedMap,
    fuelStats,
    totalInvested,
    totalDriven,
    avgLiquidKmL,
    avgGnvKmM3,
    avgCostPerKm,
    latestRecord: sorted.length > 0 ? sorted[sorted.length - 1] : null
  };
}
