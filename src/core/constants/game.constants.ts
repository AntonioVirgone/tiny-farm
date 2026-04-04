// Costanti di gioco — zero dipendenze da lucide-react, browser, DOM.
// Gli iconId sono stringhe: la UI concreta (web/RN) li mappa alle icone native.

import type { CropConfig, CropId, Inventory, UnlockedBuildings } from '../types/game.types';

export const CROPS: Record<CropId, CropConfig> = {
  wheat:    { id: 'wheat',    name: 'Grano',     seedCost: 20, growthTime: 10000, minYield: 1, maxYield: 2,  minSeeds: 0, maxSeeds: 1, sellPrice: 30,  iconId: 'wheat',    color: '#ca8a04' },
  tomato:   { id: 'tomato',   name: 'Pomodoro',  seedCost: 50, growthTime: 20000, minYield: 8, maxYield: 12, minSeeds: 2, maxSeeds: 4, sellPrice: 20,  iconId: 'tomato',   color: '#ef4444' },
  carrot:   { id: 'carrot',   name: 'Carota',    seedCost: 35, growthTime: 15000, minYield: 3, maxYield: 5,  minSeeds: 1, maxSeeds: 2, sellPrice: 40,  iconId: 'carrot',   color: '#f97316' },
  eggplant: { id: 'eggplant', name: 'Melanzana', seedCost: 70, growthTime: 35000, minYield: 2, maxYield: 5,  minSeeds: 0, maxSeeds: 2, sellPrice: 120, iconId: 'eggplant', color: '#481570' },
};

export const INITIAL_INVENTORY: Inventory = {
  coins: 1000, wood: 0, stone: 0,
  wheat: 0, wheatSeeds: 3,
  tomato: 0, tomatoSeeds: 0,
  carrot: 0, carrotSeeds: 0,
  eggplant: 0, eggplantSeeds: 0,
  fish: 0, berries: 0, planks: 0, bricks: 0,
  wildMeat: 0, iron: 0, copper: 0, gold: 0,
};

export const INITIAL_UNLOCKED: UnlockedBuildings = {
  house: false, animal_farm: false, lumber_mill: false, stone_mason: false,
  mine: false, port: false, village: false, city: false, county: false,
  tree: false, forest: false, rock: false, bush: false,
};

export const GRID_SIZE = 8;

export const BASE_INITIAL_FARMERS = 3;

export const ACTION_TIMES = {
  plowing: 3000, planting: 2000, harvesting: 2000, chopping: 5000, mining: 8000,
  building_house: 15000, building_mine: 10000, planting_tree: 5000, planting_forest: 10000,
  building_animal_farm: 15000, spawn_rock: 10000, building_village: 20000, building_city: 30000,
  building_county: 40000, building_lumber_mill: 12000, building_stone_mason: 12000,
  building_port: 15000, crafting: 5000, hunting: 5000, hunting_wolf: 8000,
  harvesting_bush: 3000, planting_bush: 5000,
};

export const COSTS = {
  house:        { wood: 3,  stone: 6,  farmers: 1 },
  mine:         { wood: 10, coins: 100, farmers: 3 },
  tree:         { coins: 50,  farmers: 1 },
  forest:       { coins: 300, stone: 5, farmers: 2 },
  animal_farm:  { wheat: 5, wood: 5, stone: 5, coins: 100, farmers: 2 },
  rock:         { coins: 50,  farmers: 1 },
  bush:         { coins: 40,  farmers: 1 },
  village:      { coins: 100, farmers: 2 },
  city:         { coins: 500, farmers: 4 },
  county:       { coins: 2000, farmers: 8 },
  lumber_mill:  { wood: 15, stone: 5,  coins: 150, farmers: 2 },
  stone_mason:  { wood: 10, stone: 15, coins: 150, farmers: 2 },
  port:         { wood: 20, stone: 10, coins: 200, farmers: 5 },
};
