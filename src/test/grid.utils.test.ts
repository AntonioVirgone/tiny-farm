import { describe, it, expect } from 'vitest';
import { generateInitialGrid, getMergeableCells } from '../utils/grid.utils';

describe('generateInitialGrid', () => {
  it('genera esattamente 64 celle', () => {
    const grid = generateInitialGrid();
    expect(grid).toHaveLength(64);
  });

  it('ogni cella ha id corrispondente al suo indice', () => {
    const grid = generateInitialGrid();
    grid.forEach((cell, i) => expect(cell.id).toBe(i));
  });

  it('la cella 27 è sempre una house (casa di partenza)', () => {
    // Esegui più volte per robustezza
    for (let run = 0; run < 5; run++) {
      const grid = generateInitialGrid();
      expect(grid[27].type).toBe('house');
    }
  });

  it('contiene almeno 1 cella water', () => {
    const grid = generateInitialGrid();
    expect(grid.some(c => c.type === 'water')).toBe(true);
  });

  it('contiene almeno 1 lupo (wolf) all\'inizio', () => {
    // Il lupo spawn è stocastico ma garantito se ci sono celle erba
    // Eseguiamo 10 volte — almeno metà devono avere un lupo
    let withWolf = 0;
    for (let i = 0; i < 10; i++) {
      const grid = generateInitialGrid();
      if (grid.some(c => c.type === 'wolf')) withWolf++;
    }
    expect(withWolf).toBeGreaterThan(5);
  });

  it('il branco di lupi iniziale ha wolfCount = 2', () => {
    let checked = false;
    for (let i = 0; i < 20; i++) {
      const grid = generateInitialGrid();
      const wolf = grid.find(c => c.type === 'wolf');
      if (wolf) {
        expect(wolf.wolfCount).toBe(2);
        checked = true;
        break;
      }
    }
    expect(checked).toBe(true);
  });

  it('tutte le celle hanno busyUntil = null all\'inizio', () => {
    const grid = generateInitialGrid();
    grid.forEach(cell => expect(cell.busyUntil).toBeNull());
  });

  it('nessuna cella di tipo sconosciuto', () => {
    const validTypes = new Set([
      'grass', 'water', 'plowed', 'growing', 'ready',
      'tree', 'forest', 'rock', 'house', 'mine',
      'animal_farm', 'village', 'city', 'county',
      'lumber_mill', 'stone_mason', 'wild_animal', 'wolf', 'port', 'bush',
    ]);
    const grid = generateInitialGrid();
    grid.forEach(cell => expect(validTypes.has(cell.type)).toBe(true));
  });
});

describe('getMergeableCells', () => {
  const makeGrid = (overrides: Record<number, Partial<{ type: string; busyUntil: number | null; pendingAction: string | null }>>) => {
    return Array.from({ length: 64 }, (_, i) => ({
      id: i,
      type: overrides[i]?.type ?? 'grass',
      busyUntil: overrides[i]?.busyUntil ?? null,
      busyTotalDuration: null,
      pendingAction: overrides[i]?.pendingAction ?? null,
    })) as any[];
  };

  it('restituisce il gruppo 2x2 quando 4 celle adiacenti sono dello stesso tipo', () => {
    // Case 0,1,8,9 tutte house
    const grid = makeGrid({ 0: { type: 'house' }, 1: { type: 'house' }, 8: { type: 'house' }, 9: { type: 'house' } });
    const result = getMergeableCells(0, 'house', grid);
    expect(result).toEqual([0, 1, 8, 9]);
  });

  it('restituisce null se il gruppo non è completo', () => {
    const grid = makeGrid({ 0: { type: 'house' }, 1: { type: 'house' }, 8: { type: 'house' } });
    const result = getMergeableCells(0, 'house', grid);
    expect(result).toBeNull();
  });

  it('restituisce null se una cella del gruppo è busy', () => {
    const grid = makeGrid({
      0: { type: 'house' }, 1: { type: 'house' },
      8: { type: 'house' }, 9: { type: 'house', busyUntil: Date.now() + 5000 },
    });
    expect(getMergeableCells(0, 'house', grid)).toBeNull();
  });

  it('restituisce null se non ci sono 4 celle dello stesso tipo', () => {
    const grid = makeGrid({});
    expect(getMergeableCells(5, 'house', grid)).toBeNull();
  });

  it('funziona anche per celle di tipo village e city', () => {
    const grid = makeGrid({
      10: { type: 'village' }, 11: { type: 'village' },
      18: { type: 'village' }, 19: { type: 'village' },
    });
    expect(getMergeableCells(10, 'village', grid)).toEqual([10, 11, 18, 19]);

    const grid2 = makeGrid({
      20: { type: 'city' }, 21: { type: 'city' },
      28: { type: 'city' }, 29: { type: 'city' },
    });
    expect(getMergeableCells(20, 'city', grid2)).toEqual([20, 21, 28, 29]);
  });
});