// Calcoli derivati sulla popolazione — pure functions, zero side-effects.

import type { Cell } from '../types/game.types';
import { BASE_INITIAL_FARMERS, COSTS } from '../constants/game.constants';

export const computeBaseFarmers = (grid: Cell[]): number =>
  BASE_INITIAL_FARMERS +
  grid.filter(c => c.type === 'house').length * 1 +
  grid.filter(c => c.type === 'village').length * 6 +
  grid.filter(c => c.type === 'city').length * 30 +
  grid.filter(c => c.type === 'county').length * 100;

export const computeTotalPorts = (grid: Cell[]): number =>
  grid.filter(c => c.type === 'port').length;

export const computeTotalFarmers = (
  grid: Cell[],
  respawningCount: number,
): number => {
  const base = computeBaseFarmers(grid);
  const ports = computeTotalPorts(grid);
  return Math.max(0, base - ports * COSTS.port.farmers - respawningCount);
};

/** Farmers impegnati in azioni non passive. */
export const computeBusyFarmers = (grid: Cell[]): number =>
  grid.reduce((sum, c) => {
    const passive = ['growing', 'active_mine', 'fishing', 'active_forest'];
    if (c.pendingAction && !passive.includes(c.pendingAction as string)) {
      return sum + (c.farmersUsed || 1);
    }
    return sum;
  }, 0);

export const computeActionsLeft = (totalFarmers: number, actionsUsedToday: number): number =>
  Math.max(0, totalFarmers - actionsUsedToday);

export const computeAvailableShips = (grid: Cell[]): number => {
  const totalPorts = computeTotalPorts(grid);
  const busyShips = grid.filter(c => c.pendingAction === 'fishing').length;
  return totalPorts - busyShips;
};

export const computeTotalAnimals = (grid: Cell[]): number =>
  grid.reduce((sum, c) => sum + (c.animalCount || 0), 0);
