// Configurazione di default — zero storage, zero dipendenze browser.
// Il layer di persistenza (localStorage / AsyncStorage) è responsabilità della piattaforma.

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

/**
 * Merge safe: unisce una config parziale salvata con i default.
 * Non tocca lo storage — chiamare da piattaforma (web/RN) dopo aver letto il valore.
 */
export const mergeWithDefaults = (partial: Partial<GameConfig>): GameConfig => ({
  ...DEFAULT_GAME_CONFIG,
  ...partial,
  actionTimes: { ...DEFAULT_GAME_CONFIG.actionTimes, ...partial.actionTimes },
  crops: {
    wheat:    { ...DEFAULT_GAME_CONFIG.crops.wheat,    ...partial.crops?.wheat },
    tomato:   { ...DEFAULT_GAME_CONFIG.crops.tomato,   ...partial.crops?.tomato },
    carrot:   { ...DEFAULT_GAME_CONFIG.crops.carrot,   ...partial.crops?.carrot },
    eggplant: { ...DEFAULT_GAME_CONFIG.crops.eggplant, ...partial.crops?.eggplant },
  },
});
