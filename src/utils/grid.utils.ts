import { GRID_SIZE } from '../constants/game.constants';
import type { Cell, CellType } from '../types/game.types';

export const generateInitialGrid = (): Cell[] => {
  const grid: Cell[] = Array(GRID_SIZE * GRID_SIZE).fill(null) as Cell[];
  const waterCells = new Set<number>();
  let currentCol = Math.floor(Math.random() * GRID_SIZE);

  for (let row = 0; row < GRID_SIZE; row++) {
    waterCells.add(row * GRID_SIZE + currentCol);
    if (Math.random() > 0.4) {
      currentCol += Math.random() > 0.5 ? 1 : -1;
      currentCol = Math.max(0, Math.min(GRID_SIZE - 1, currentCol));
      waterCells.add(row * GRID_SIZE + currentCol);
    }
  }

  const emptyGrassCells: number[] = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    if (i === 27) {
      grid[i] = { id: i, type: 'house', busyUntil: null, busyTotalDuration: null, pendingAction: null };
      waterCells.delete(i);
      continue;
    }
    let type: CellType = 'grass';
    if (waterCells.has(i)) {
      type = 'water';
    } else {
      const rand = Math.random();
      if (rand < 0.12) type = 'tree';
      else if (rand < 0.20) type = 'rock';
      else if (rand < 0.27) type = 'bush';
    }
    grid[i] = { id: i, type, busyUntil: null, busyTotalDuration: null, pendingAction: null };
    if (type === 'grass') emptyGrassCells.push(i);
  }

  for (let k = 0; k < 6; k++) {
    if (emptyGrassCells.length === 0) break;
    const randIndex = Math.floor(Math.random() * emptyGrassCells.length);
    const cellId = emptyGrassCells[randIndex];
    grid[cellId].type = 'wild_animal';
    grid[cellId].wildAnimalCount = 1;
    emptyGrassCells.splice(randIndex, 1);
  }

  if (emptyGrassCells.length > 0) {
    const randIndex = Math.floor(Math.random() * emptyGrassCells.length);
    const cellId = emptyGrassCells[randIndex];
    grid[cellId].type = 'wolf';
    grid[cellId].wolfCount = 2;
    emptyGrassCells.splice(randIndex, 1);
  }

  return grid;
};

export const getMergeableCells = (
  cellId: number,
  targetType: CellType,
  grid: Cell[],
): number[] | null => {
  const isIdleType = (id: number) => {
    const c = grid.find(cell => cell.id === id);
    return c && c.type === targetType && !c.busyUntil && c.pendingAction === null;
  };

  const possibleTopLefts = [cellId, cellId - 1, cellId - 8, cellId - 9];
  for (const tl of possibleTopLefts) {
    if (tl < 0 || tl > 63) continue;
    const col = tl % 8;
    const row = Math.floor(tl / 8);
    if (col >= 7 || row >= 7) continue;
    const group = [tl, tl + 1, tl + 8, tl + 9];
    if (group.includes(cellId) && group.every(isIdleType)) return group;
  }
  return null;
};