export interface CropOverride {
  growthTime: number;
  minYield: number;
  maxYield: number;
  maxYieldExtra: number;
  sellPrice: number;
  seedCost: number;
}

export interface GameConfig {
  // Partenza
  initialCoins: number;
  initialWheatSeeds: number;

  // Raccolta
  choppingWoodMin: number;
  choppingWoodMax: number;
  forestWoodPerTick: number;
  fishPerTick: number;
  bushBerriesAmount: number;
  bushSeedsAmount: number;

  // Tempi azioni (ms)
  actionTimes: {
    plowing: number;
    planting: number;
    harvesting: number;
    chopping: number;
    mining: number;
    building_house: number;
    hunting: number;
    hunting_wolf: number;
    harvesting_bush: number;
    planting_bush: number;
    planting_tree: number;
    // internal (not shown in UI)
    crafting: number;
    planting_forest: number;
    spawn_rock: number;
  };

  // Colture
  crops: {
    wheat: CropOverride;
    tomato: CropOverride;
    carrot: CropOverride;
    eggplant: CropOverride;
  };
}
