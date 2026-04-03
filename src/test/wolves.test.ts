import { describe, it, expect } from 'vitest';
import { ACTION_TIMES } from '../constants/game.constants';
import type { Cell } from '../types/game.types';

const makeCell = (id: number, overrides: Partial<Cell> = {}): Cell => ({
  id, type: 'grass', busyUntil: null, busyTotalDuration: null, pendingAction: null, ...overrides,
});

// Simula la logica di movimento notturno dei lupi (da Game.tsx)
const simulateWolfNight = (grid: Cell[]): Cell[] => {
  const newGrid = grid.map(c => ({ ...c }));
  const movedTo = new Set<number>();

  const getNeighbors = (i: number) => {
    const n: number[] = [];
    if (i >= 8) n.push(i - 8);
    if (i < 56) n.push(i + 8);
    if (i % 8 !== 0) n.push(i - 1);
    if ((i + 1) % 8 !== 0) n.push(i + 1);
    return n;
  };

  for (let i = 0; i < newGrid.length; i++) {
    const cell = newGrid[i];
    if (cell.type === 'wolf' && !movedTo.has(i) && !cell.busyUntil && cell.pendingAction === null) {
      const neighbors = getNeighbors(i);

      // Attacca conigli adiacenti
      const adjRabbits = neighbors.filter(n => newGrid[n].type === 'wild_animal');
      if (adjRabbits.length > 0) {
        const targetRabbit = adjRabbits[0];
        const rCount = newGrid[targetRabbit].wildAnimalCount || 1;
        const wCount = cell.wolfCount || 1;
        if (wCount >= rCount) {
          newGrid[targetRabbit] = { ...newGrid[targetRabbit], type: 'grass', wildAnimalCount: undefined };
        } else {
          newGrid[targetRabbit] = { ...newGrid[targetRabbit], wildAnimalCount: rCount - 1 };
        }
        movedTo.add(i);
        continue;
      }

      // Fusione lupi
      const mergeTarget = neighbors.find(n => newGrid[n].type === 'wolf' && !movedTo.has(n));
      if (mergeTarget !== undefined) {
        const totalCount = Math.min(10, (cell.wolfCount || 1) + (newGrid[mergeTarget].wolfCount || 1));
        newGrid[mergeTarget] = { ...newGrid[mergeTarget], wolfCount: totalCount };
        newGrid[i] = { ...newGrid[i], type: 'grass', wolfCount: undefined };
        movedTo.add(mergeTarget); movedTo.add(i);
      }
    }
  }
  return newGrid;
};

describe('Sistema lupi', () => {
  it('un lupo con wolfCount >= wildAnimalCount elimina il branco di conigli', () => {
    const grid = Array.from({ length: 64 }, (_, i) => makeCell(i));
    grid[0] = makeCell(0, { type: 'wolf', wolfCount: 3 });
    grid[1] = makeCell(1, { type: 'wild_animal', wildAnimalCount: 2 });

    const result = simulateWolfNight(grid);
    expect(result[1].type).toBe('grass');
  });

  it('un lupo con wolfCount < wildAnimalCount riduce il branco di 1', () => {
    const grid = Array.from({ length: 64 }, (_, i) => makeCell(i));
    grid[0] = makeCell(0, { type: 'wolf', wolfCount: 1 });
    grid[1] = makeCell(1, { type: 'wild_animal', wildAnimalCount: 5 });

    const result = simulateWolfNight(grid);
    expect(result[1].type).toBe('wild_animal');
    expect(result[1].wildAnimalCount).toBe(4);
  });

  it('due branchi di lupi adiacenti si fondono', () => {
    const grid = Array.from({ length: 64 }, (_, i) => makeCell(i));
    grid[10] = makeCell(10, { type: 'wolf', wolfCount: 2 });
    grid[11] = makeCell(11, { type: 'wolf', wolfCount: 3 });

    const result = simulateWolfNight(grid);
    const wolfCells = result.filter(c => c.type === 'wolf');
    expect(wolfCells).toHaveLength(1);
    expect(wolfCells[0].wolfCount).toBe(5);
  });

  it('la fusione di lupi non supera il massimo di 10', () => {
    const grid = Array.from({ length: 64 }, (_, i) => makeCell(i));
    grid[10] = makeCell(10, { type: 'wolf', wolfCount: 8 });
    grid[11] = makeCell(11, { type: 'wolf', wolfCount: 8 });

    const result = simulateWolfNight(grid);
    const wolf = result.find(c => c.type === 'wolf');
    expect(wolf?.wolfCount).toBe(10);
  });

  it('hunting_wolf dura 8 secondi', () => {
    expect(ACTION_TIMES.hunting_wolf).toBe(8000);
  });

  it('un lupo busy non si muove di notte', () => {
    const grid = Array.from({ length: 64 }, (_, i) => makeCell(i));
    grid[10] = makeCell(10, { type: 'wolf', wolfCount: 3, busyUntil: Date.now() + 5000 });
    grid[11] = makeCell(11, { type: 'wild_animal', wildAnimalCount: 1 });

    const result = simulateWolfNight(grid);
    // Il lupo è busy → non attacca
    expect(result[11].type).toBe('wild_animal');
  });
});