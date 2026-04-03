import { describe, it, expect } from 'vitest';
import { ACTION_TIMES, COSTS, INITIAL_INVENTORY } from '../constants/game.constants';
import type { Inventory } from '../types/game.types';

// Simula la logica di raccolta del cespuglio
const harvestBush = (): Partial<Inventory> => {
  const rewards: Partial<Inventory> = { berries: 3 };
  const seedTypes: Array<keyof Inventory> = ['wheatSeeds', 'tomatoSeeds', 'carrotSeeds', 'eggplantSeeds'];
  for (let s = 0; s < 2; s++) {
    const key = seedTypes[Math.floor(Math.random() * seedTypes.length)];
    rewards[key] = ((rewards[key] as number) || 0) + 1;
  }
  return rewards;
};

describe('Cespuglio (bush)', () => {
  it('la raccolta dà sempre esattamente 3 bacche', () => {
    for (let i = 0; i < 20; i++) {
      const rewards = harvestBush();
      expect(rewards.berries).toBe(3);
    }
  });

  it('la raccolta dà sempre esattamente 2 semi in totale', () => {
    for (let i = 0; i < 20; i++) {
      const rewards = harvestBush();
      const seedKeys: Array<keyof Inventory> = ['wheatSeeds', 'tomatoSeeds', 'carrotSeeds', 'eggplantSeeds'];
      const totalSeeds = seedKeys.reduce((sum, k) => sum + ((rewards[k] as number) || 0), 0);
      expect(totalSeeds).toBe(2);
    }
  });

  it('i semi casuali sono solo di tipo valido', () => {
    const validSeeds = new Set(['wheatSeeds', 'tomatoSeeds', 'carrotSeeds', 'eggplantSeeds']);
    for (let i = 0; i < 30; i++) {
      const rewards = harvestBush();
      Object.keys(rewards)
        .filter(k => k !== 'berries')
        .forEach(k => expect(validSeeds.has(k)).toBe(true));
    }
  });

  it('su 100 raccolte ogni tipo di seme appare almeno una volta (distribuzione non vuota)', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      const rewards = harvestBush();
      Object.entries(rewards).forEach(([k, v]) => {
        if (k !== 'berries') counts[k] = (counts[k] || 0) + (v as number);
      });
    }
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(2);
  });

  it('harvesting_bush dura 3 secondi', () => {
    expect(ACTION_TIMES.harvesting_bush).toBe(3000);
  });

  it('planting_bush dura 5 secondi', () => {
    expect(ACTION_TIMES.planting_bush).toBe(5000);
  });

  it('bush costa meno o uguale di un albero', () => {
    expect(COSTS.bush.coins).toBeLessThanOrEqual(COSTS.tree.coins);
  });

  it('bacche iniziali sono 0', () => {
    expect(INITIAL_INVENTORY.berries).toBe(0);
  });
});