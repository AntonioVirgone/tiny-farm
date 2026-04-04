// Utility griglia — zero dipendenze esterne, copia identica dell'originale.

import type { Cell, CellType } from '../types/game.types';

export const generateInitialGrid = (): Cell[] => {
  const grid: Cell[] = [];

  // Bordo sinistro e destro = acqua
  const leftWater  = new Set([0, 8, 16, 24, 32, 40, 48, 56]);
  const rightWater = new Set([7, 15, 23, 31, 39, 47, 55, 63]);

  // Acqua interna a L lungo il bordo sinistro
  const innerLeft  = new Set([1, 9]);
  const fogCells   = new Set([...Array.from({ length: 8 }, (_, i) => i), ...Array.from({ length: 8 }, (_, i) => 56 + i)]);

  for (let i = 0; i < 64; i++) {
    let type: CellType = 'grass';

    if (leftWater.has(i) || rightWater.has(i) || innerLeft.has(i)) type = 'water';
    else if (fogCells.has(i)) type = 'water';
    else {
      const r = Math.random();
      if (r < 0.05) type = 'rock';
      else if (r < 0.11) type = 'wild_animal';
      else if (r < 0.17) { /* wolf — aggiunto sotto */ }
    }

    grid.push({
      id: i,
      type,
      busyUntil: null,
      busyTotalDuration: null,
      pendingAction: null,
    });
  }

  // Aggiungi animali selvatici (6 celle non-water)
  let placedAnimals = 0;
  while (placedAnimals < 6) {
    const idx = Math.floor(Math.random() * 64);
    if (grid[idx].type === 'grass') {
      grid[idx] = { ...grid[idx], type: 'wild_animal', wildAnimalCount: Math.floor(Math.random() * 3) + 1 };
      placedAnimals++;
    }
  }

  // Aggiungi un branco di lupi
  let wolfPlaced = false;
  while (!wolfPlaced) {
    const idx = Math.floor(Math.random() * 64);
    if (grid[idx].type === 'grass') {
      grid[idx] = { ...grid[idx], type: 'wolf', wolfCount: 2 };
      wolfPlaced = true;
    }
  }

  // Casa iniziale in posizione centrale
  grid[27] = { ...grid[27], type: 'house' };

  // Alberi e cespugli casuali (7% delle celle erba)
  for (let i = 0; i < 64; i++) {
    if (grid[i].type === 'grass' && i !== 27 && Math.random() < 0.07) {
      grid[i] = { ...grid[i], type: Math.random() < 0.25 ? 'bush' : 'tree' };
    }
  }

  return grid;
};

/**
 * Restituisce gli indici delle 3 celle adiacenti (2×2) che formano un merge,
 * oppure null se il blocco 2×2 non è completo.
 */
export const getMergeableCells = (cellId: number, targetType: CellType, grid: Cell[]): number[] | null => {
  const col = cellId % 8;
  const row = Math.floor(cellId / 8);

  const tryBlock = (tl: number): number[] | null => {
    const tlc = tl % 8; const tlr = Math.floor(tl / 8);
    if (tlc > 6 || tlr > 6) return null;
    const ids = [tl, tl + 1, tl + 8, tl + 9];
    if (!ids.every(id => grid[id]?.type === targetType)) return null;
    return ids.filter(id => id !== cellId);
  };

  const offsets = [
    [0, 0], [-1, 0], [0, -1], [-1, -1],
  ];

  for (const [dc, dr] of offsets) {
    const tl = (row + dr) * 8 + (col + dc);
    if (tl < 0 || tl >= 64) continue;
    const result = tryBlock(tl);
    if (result) return result;
  }

  return null;
};
