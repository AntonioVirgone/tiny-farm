// Generatore di eventi casuali — pure function estratta da useGameEvents.
// Nessun timer, nessun setState: la piattaforma decide quando chiamarla.

import type { Cell } from '../types/game.types';
import { BASE_INITIAL_FARMERS, COSTS } from '../constants/game.constants';

export type GameEventType = 'disease' | 'wolf_spawn' | 'bandits';

export interface GameEvent {
  type: GameEventType;
  message: string;
  wolfTargetIdx?: number;   // solo per wolf_spawn
}

/**
 * Calcola lo stato corrente della popolazione (usato internamente agli eventi).
 * Duplica la logica di farmers.ts per mantenere events.ts autosufficiente.
 */
const getCurrentFarmers = (grid: Cell[], respawningCount: number): number => {
  const base = BASE_INITIAL_FARMERS +
    grid.filter(c => c.type === 'house').length * 1 +
    grid.filter(c => c.type === 'village').length * 6 +
    grid.filter(c => c.type === 'city').length * 30 +
    grid.filter(c => c.type === 'county').length * 100;
  const ports = grid.filter(c => c.type === 'port').length;
  return Math.max(0, base - ports * COSTS.port.farmers - respawningCount);
};

/**
 * Genera un evento casuale oppure null se nessun evento scatta.
 * Probabilità calibrate sullo stato del gioco.
 *
 * @param grid            griglia corrente (snapshot)
 * @param respawningCount numero di farmers in respawn
 */
export const generateRandomEvent = (
  grid: Cell[],
  respawningCount: number,
): GameEvent | null => {
  const totalFarmers = getCurrentFarmers(grid, respawningCount);
  if (totalFarmers <= 0) return null;

  const totalPorts = grid.filter(c => c.type === 'port').length;

  const diseaseProb  = Math.min(0.90, 0.05 + (totalFarmers - 1) * 0.0447);
  const wolfProb     = 0.25;
  const banditsProb  = totalPorts > 0 ? 0.30 : 0;

  const roll = Math.random();

  if (roll < diseaseProb) {
    return {
      type: 'disease',
      message: "Un'improvvisa malattia ha colpito un cittadino!",
    };
  }

  if (roll < diseaseProb + wolfProb) {
    const emptyGrass = grid
      .map((c, i) => c.type === 'grass' && !c.busyUntil && c.pendingAction === null ? i : -1)
      .filter(i => i !== -1);
    if (emptyGrass.length === 0) return null;
    const wolfTargetIdx = emptyGrass[Math.floor(Math.random() * emptyGrass.length)];
    return {
      type: 'wolf_spawn',
      message: 'Dei lupi affamati sono scesi dalle montagne!',
      wolfTargetIdx,
    };
  }

  if (banditsProb > 0 && roll < diseaseProb + wolfProb + banditsProb) {
    return {
      type: 'bandits',
      message: "Dei banditi giunti via mare hanno assalito l'insediamento!",
    };
  }

  return null;
};
