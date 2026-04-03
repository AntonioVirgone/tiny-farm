import { describe, it, expect } from 'vitest';
import {
  CROPS, INITIAL_INVENTORY, INITIAL_UNLOCKED,
  ACTION_TIMES, COSTS, BASE_INITIAL_FARMERS,
} from '../constants/game.constants';

describe('CROPS', () => {
  const cropIds = ['wheat', 'tomato', 'carrot', 'eggplant'] as const;

  it('contiene tutti i 4 tipi di coltura', () => {
    cropIds.forEach(id => expect(CROPS[id]).toBeDefined());
  });

  it('ogni coltura ha campi obbligatori validi', () => {
    cropIds.forEach(id => {
      const c = CROPS[id];
      expect(c.growthTime).toBeGreaterThan(0);
      expect(c.seedCost).toBeGreaterThan(0);
      expect(c.sellPrice).toBeGreaterThan(0);
      expect(c.minYield).toBeLessThanOrEqual(c.maxYield);
      expect(c.minSeeds).toBeLessThanOrEqual(c.maxSeeds);
    });
  });
});

describe('INITIAL_INVENTORY', () => {
  it('parte con 1000 monete', () => {
    expect(INITIAL_INVENTORY.coins).toBe(1000);
  });

  it('parte con 3 semi di grano', () => {
    expect(INITIAL_INVENTORY.wheatSeeds).toBe(3);
  });

  it('le bacche iniziali sono 0', () => {
    expect(INITIAL_INVENTORY.berries).toBe(0);
  });

  it('tutte le risorse non-monete partono a 0 o con semi iniziali', () => {
    const { coins, wheatSeeds, ...rest } = INITIAL_INVENTORY;
    Object.entries(rest).forEach(([key, val]) => {
      expect(val, `${key} dovrebbe essere 0`).toBe(0);
    });
  });
});

describe('INITIAL_UNLOCKED', () => {
  it('tutti gli edifici partono bloccati', () => {
    Object.entries(INITIAL_UNLOCKED).forEach(([key, val]) => {
      expect(val, `${key} dovrebbe essere false`).toBe(false);
    });
  });

  it('contiene bush come edificio sbloccabile', () => {
    expect('bush' in INITIAL_UNLOCKED).toBe(true);
  });
});

describe('ACTION_TIMES', () => {
  it('tutte le durate sono > 0', () => {
    Object.entries(ACTION_TIMES).forEach(([key, val]) => {
      expect(val, `${key} dovrebbe essere > 0`).toBeGreaterThan(0);
    });
  });

  it('hunting_wolf (8s) è più lungo di hunting (5s)', () => {
    expect(ACTION_TIMES.hunting_wolf).toBeGreaterThan(ACTION_TIMES.hunting);
  });

  it('harvesting_bush esiste', () => {
    expect(ACTION_TIMES.harvesting_bush).toBe(3000);
  });

  it('planting_bush esiste', () => {
    expect(ACTION_TIMES.planting_bush).toBe(5000);
  });
});

describe('COSTS', () => {
  it('ogni edificio ha almeno 1 farmer', () => {
    Object.entries(COSTS).forEach(([key, cost]) => {
      if ('farmers' in cost) {
        expect(cost.farmers, `${key} farmers`).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it('il porto costa più di una casa (in legna)', () => {
    expect(COSTS.port.wood).toBeGreaterThan(COSTS.house.wood);
  });

  it('bush costa meno di tree', () => {
    expect(COSTS.bush.coins).toBeLessThanOrEqual(COSTS.tree.coins);
  });
});

describe('BASE_INITIAL_FARMERS', () => {
  it('vale 3', () => {
    expect(BASE_INITIAL_FARMERS).toBe(3);
  });
});