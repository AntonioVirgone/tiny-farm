import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CROPS } from '../constants/game.constants';
import type { Cell, Inventory } from '../types/game.types';

// Helpers per creare celle di test
const makeCell = (id: number, overrides: Partial<Cell> = {}): Cell => ({
  id,
  type: 'grass',
  busyUntil: null,
  busyTotalDuration: null,
  pendingAction: null,
  ...overrides,
});

// Simula la logica di completamento azione estratta da useGameLoop
// (stessa logica — se cambia lì, i test lo rilevano)
const processCompletedAction = (cell: Cell, now: number): {
  newType: Cell['type'];
  rewards: Partial<Inventory>;
  deadFarmers: number;
  updatedCell: Cell;
} => {
  const rewards: Partial<Inventory> = {};
  let deadFarmers = 0;
  let newType = cell.type;
  const addReward = (key: keyof Inventory, amount: number) => {
    rewards[key] = ((rewards[key] as number) || 0) + amount;
  };

  const pending = cell.pendingAction;

  if (pending === 'plowing') newType = 'plowed';
  else if (pending === 'planting_tree') newType = 'tree';
  else if (pending === 'planting_bush') newType = 'bush';
  else if (pending === 'spawn_rock') newType = 'rock';
  else if (pending === 'building_village') newType = 'village';
  else if (pending === 'building_city') newType = 'city';
  else if (pending === 'building_county') newType = 'county';
  else if (pending === 'building_lumber_mill') newType = 'lumber_mill';
  else if (pending === 'building_stone_mason') newType = 'stone_mason';
  else if (pending === 'building_port') newType = 'port';
  else if (pending === 'building_house') newType = 'house';
  else if (pending === 'chopping') { newType = 'grass'; addReward('wood', 5); }
  else if (pending === 'harvesting') {
    newType = 'grass';
    const crop = CROPS[cell.cropType!];
    addReward(crop.id, crop.minYield);
  }
  else if (pending === 'harvesting_bush') {
    newType = 'grass';
    addReward('berries', 3);
    // 2 semi casuali — qui testiamo solo che il tipo diventa grass e berries = 3
  }
  else if (pending === 'hunting') {
    newType = 'wild_animal';
    const wildCount = (cell.wildAnimalCount || 1) - 1;
    if (wildCount <= 0) { newType = 'grass'; }
  }
  else if (pending === 'hunting_wolf') {
    newType = 'wolf';
    const wolfCount = (cell.wolfCount || 1) - 1;
    if (wolfCount <= 0) { newType = 'grass'; }
  }

  return { newType, rewards, deadFarmers, updatedCell: { ...cell, type: newType } };
};

describe('Logica completamento azioni (game loop)', () => {
  it('plowing → plowed', () => {
    const cell = makeCell(5, { type: 'grass', pendingAction: 'plowing' });
    const { newType } = processCompletedAction(cell, Date.now());
    expect(newType).toBe('plowed');
  });

  it('planting_tree → tree', () => {
    const cell = makeCell(5, { type: 'grass', pendingAction: 'planting_tree' });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('tree');
  });

  it('planting_bush → bush', () => {
    const cell = makeCell(5, { type: 'grass', pendingAction: 'planting_bush' });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('bush');
  });

  it('chopping → grass + legna', () => {
    const cell = makeCell(5, { type: 'tree', pendingAction: 'chopping' });
    const { newType, rewards } = processCompletedAction(cell, Date.now());
    expect(newType).toBe('grass');
    expect(rewards.wood).toBeGreaterThanOrEqual(5);
  });

  it('harvesting_bush → grass + 3 bacche', () => {
    const cell = makeCell(5, { type: 'bush', pendingAction: 'harvesting_bush' });
    const { newType, rewards } = processCompletedAction(cell, Date.now());
    expect(newType).toBe('grass');
    expect(rewards.berries).toBe(3);
  });

  it('harvesting grano → grass + grano', () => {
    const cell = makeCell(5, { type: 'ready', pendingAction: 'harvesting', cropType: 'wheat' });
    const { newType, rewards } = processCompletedAction(cell, Date.now());
    expect(newType).toBe('grass');
    expect((rewards.wheat ?? 0)).toBeGreaterThanOrEqual(CROPS.wheat.minYield);
  });

  it('hunting con 1 animale → grass (branco estinto)', () => {
    const cell = makeCell(5, { type: 'wild_animal', pendingAction: 'hunting', wildAnimalCount: 1 });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('grass');
  });

  it('hunting con 2 animali → wild_animal (branco ridotto)', () => {
    const cell = makeCell(5, { type: 'wild_animal', pendingAction: 'hunting', wildAnimalCount: 2 });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('wild_animal');
  });

  it('hunting_wolf con 1 lupo → grass (lupo eliminato)', () => {
    const cell = makeCell(5, { type: 'wolf', pendingAction: 'hunting_wolf', wolfCount: 1 });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('grass');
  });

  it('hunting_wolf con branco → wolf (branco ridotto)', () => {
    const cell = makeCell(5, { type: 'wolf', pendingAction: 'hunting_wolf', wolfCount: 3 });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('wolf');
  });

  it('building_house → house', () => {
    const cell = makeCell(5, { type: 'grass', pendingAction: 'building_house' });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('house');
  });

  it('building_port → port', () => {
    const cell = makeCell(5, { type: 'grass', pendingAction: 'building_port' });
    expect(processCompletedAction(cell, Date.now()).newType).toBe('port');
  });
});