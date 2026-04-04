// Pure types — zero dipendenze da browser, DOM, React, lucide.
// Compatibile con React Native.

export type CropId = 'wheat' | 'tomato' | 'carrot' | 'eggplant';

export interface CropConfig {
  id: CropId;
  name: string;
  seedCost: number;
  growthTime: number;
  minYield: number;
  maxYield: number;
  minSeeds: number;
  maxSeeds: number;
  sellPrice: number;
  iconId: string;  // es. 'wheat' | 'tomato' — la UI risolve l'icona concreta
  color: string;
}

export type CellType =
  | 'grass' | 'water' | 'plowed' | 'growing' | 'ready'
  | 'tree' | 'forest' | 'rock' | 'house' | 'mine'
  | 'animal_farm' | 'village' | 'city' | 'county'
  | 'lumber_mill' | 'stone_mason' | 'wild_animal' | 'wolf' | 'port' | 'bush';

export type ActionType =
  | 'plowing' | 'chopping' | 'mining' | 'building_house' | 'building_mine'
  | 'building_animal_farm' | 'planting_tree' | 'planting_forest'
  | 'building_village' | 'building_city' | 'building_county'
  | 'building_lumber_mill' | 'building_stone_mason' | 'building_port'
  | 'active_mine' | 'active_forest' | 'harvesting' | 'growing'
  | 'fishing' | 'hunting' | 'hunting_wolf' | 'harvesting_bush' | 'crafting_planks' | 'crafting_bricks'
  | 'spawn_rock' | 'start_active_forest'
  | string | null;

export interface Inventory {
  coins: number;
  wood: number;
  stone: number;
  wheat: number;
  wheatSeeds: number;
  tomato: number;
  tomatoSeeds: number;
  carrot: number;
  carrotSeeds: number;
  eggplant: number;
  eggplantSeeds: number;
  fish: number;
  berries: number;
  planks: number;
  bricks: number;
  wildMeat: number;
  iron: number;
  copper: number;
  gold: number;
}

export interface UnlockedBuildings {
  house: boolean;
  animal_farm: boolean;
  lumber_mill: boolean;
  stone_mason: boolean;
  mine: boolean;
  port: boolean;
  village: boolean;
  city: boolean;
  county: boolean;
  tree: boolean;
  forest: boolean;
  rock: boolean;
  bush: boolean;
}

export interface Cell {
  id: number;
  type: CellType;
  cropType?: CropId;
  busyUntil: number | null;
  busyTotalDuration: number | null;
  pendingAction: ActionType;
  farmersUsed?: number;
  mineTicks?: number;
  forestTicks?: number;
  lastTickTime?: number;
  animalCount?: number;
  reproductionTargetTime?: number | null;
  fishingTicks?: number;
  wildAnimalCount?: number;
  wildReproductionTargetTime?: number | null;
  wolfCount?: number;
}

export interface Toast {
  id: string;
  title: string;
  type?: 'success' | 'danger';
}

// iconId al posto di React.ElementType: la UI concreta (web o RN) mappa la stringa all'icona
export interface QuestDefinition {
  id: string;
  iconId: string;
  title: string;
  desc: string;
  goal: string;
}

export type GameState = 'start' | 'playing' | 'gameover';
