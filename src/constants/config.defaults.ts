import type { GameConfig } from '../types/config.types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  initialCoins: 1000,
  initialWheatSeeds: 3,

  choppingWoodMin: 5,
  choppingWoodMax: 7,
  forestWoodPerTick: 2,
  fishPerTick: 3,
  bushBerriesAmount: 3,
  bushSeedsAmount: 2,

  actionTimes: {
    plowing: 3000,
    planting: 2000,
    harvesting: 2000,
    chopping: 5000,
    mining: 8000,
    building_house: 15000,
    hunting: 5000,
    hunting_wolf: 8000,
    harvesting_bush: 3000,
    planting_bush: 5000,
    planting_tree: 5000,
    crafting: 5000,
    planting_forest: 10000,
    spawn_rock: 10000,
  },

  crops: {
    wheat:    { growthTime: 10000, minYield: 1, maxYield: 2,  maxYieldExtra: 1, sellPrice: 30,  seedCost: 20 },
    tomato:   { growthTime: 20000, minYield: 8, maxYield: 12, maxYieldExtra: 4, sellPrice: 20,  seedCost: 50 },
    carrot:   { growthTime: 15000, minYield: 3, maxYield: 5,  maxYieldExtra: 2, sellPrice: 40,  seedCost: 35 },
    eggplant: { growthTime: 35000, minYield: 2, maxYield: 5,  maxYieldExtra: 3, sellPrice: 120, seedCost: 70 },
  },
};

const CONFIG_KEY = 'fattoria_config';

export const loadGameConfig = (): GameConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      return {
        ...DEFAULT_GAME_CONFIG,
        ...p,
        actionTimes: { ...DEFAULT_GAME_CONFIG.actionTimes, ...p.actionTimes },
        crops: {
          wheat:    { ...DEFAULT_GAME_CONFIG.crops.wheat,    ...p.crops?.wheat },
          tomato:   { ...DEFAULT_GAME_CONFIG.crops.tomato,   ...p.crops?.tomato },
          carrot:   { ...DEFAULT_GAME_CONFIG.crops.carrot,   ...p.crops?.carrot },
          eggplant: { ...DEFAULT_GAME_CONFIG.crops.eggplant, ...p.crops?.eggplant },
        },
      };
    }
  } catch {}
  return DEFAULT_GAME_CONFIG;
};

export const saveGameConfig = (config: GameConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const resetGameConfig = () => {
  localStorage.removeItem(CONFIG_KEY);
};
