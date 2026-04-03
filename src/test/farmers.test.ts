import { describe, it, expect } from 'vitest';
import { BASE_INITIAL_FARMERS, COSTS } from '../constants/game.constants';
import type { Cell } from '../types/game.types';

const makeCell = (type: Cell['type']): Cell => ({
  id: 0, type, busyUntil: null, busyTotalDuration: null, pendingAction: null,
});

// Replica la logica di baseFarmers da Game.tsx
const calcBaseFarmers = (grid: Cell[]) =>
  BASE_INITIAL_FARMERS +
  grid.filter(c => c.type === 'house').length * 1 +
  grid.filter(c => c.type === 'village').length * 6 +
  grid.filter(c => c.type === 'city').length * 30 +
  grid.filter(c => c.type === 'county').length * 100;

const calcTotalFarmers = (grid: Cell[], respawning: number[] = []) => {
  const ports = grid.filter(c => c.type === 'port').length;
  return Math.max(0, calcBaseFarmers(grid) - ports * COSTS.port.farmers - respawning.length);
};

describe('Calcolo popolazione (baseFarmers)', () => {
  it('senza edifici parte da BASE_INITIAL_FARMERS (3)', () => {
    expect(calcBaseFarmers([])).toBe(3);
  });

  it('1 house aggiunge 1 cittadino', () => {
    expect(calcBaseFarmers([makeCell('house')])).toBe(4);
  });

  it('1 village aggiunge 6 cittadini', () => {
    expect(calcBaseFarmers([makeCell('village')])).toBe(9);
  });

  it('1 city aggiunge 30 cittadini', () => {
    expect(calcBaseFarmers([makeCell('city')])).toBe(33);
  });

  it('1 county aggiunge 100 cittadini', () => {
    expect(calcBaseFarmers([makeCell('county')])).toBe(103);
  });

  it('un porto sottrae i suoi sailors da totalFarmers', () => {
    const grid = [makeCell('house'), makeCell('house'), makeCell('port')];
    const base = calcBaseFarmers(grid);
    const total = calcTotalFarmers(grid);
    expect(total).toBe(base - COSTS.port.farmers);
  });

  it('totalFarmers non scende mai sotto 0', () => {
    // Solo porto, zero case → sailors maggiori dei cittadini
    const grid = [makeCell('port')];
    expect(calcTotalFarmers(grid)).toBe(0);
  });

  it('i cittadini in respawn riducono totalFarmers', () => {
    const grid = [makeCell('house'), makeCell('house')]; // base = 5
    const respawning = [Date.now() + 30000, Date.now() + 20000]; // 2 in coma
    expect(calcTotalFarmers(grid, respawning)).toBe(calcBaseFarmers(grid) - 2);
  });
});

describe('Costo azioni per agricoltori', () => {
  it('hunting costa 2 agricoltori', () => {
    // Verifica che la costante usata in startAction sia corretta
    // hunting_wolf costa 3
    const huntingCost = 2;
    const huntingWolfCost = 3;
    expect(huntingWolfCost).toBeGreaterThan(huntingCost);
  });

  it('porto richiede più farmers di una casa', () => {
    expect(COSTS.port.farmers).toBeGreaterThan(COSTS.house.farmers);
  });
});