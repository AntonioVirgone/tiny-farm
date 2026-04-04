// Processore del tick di gioco — pure function estratta da useGameLoop.
// Nessun side-effect, nessun timer, nessuna dipendenza React.

import type { Cell, CropId, Inventory } from '../types/game.types';
import type { GameConfig } from '../types/config.types';
import { CROPS } from '../constants/game.constants';

export interface TickResult {
  newGrid: Cell[];
  rewards: Partial<Inventory>;
  deadFarmers: number;    // numero di farmers deceduti in questo tick
  gridChanged: boolean;
}

/**
 * Processa un singolo tick della griglia.
 * Gestisce: mine, foreste, fattorie, animali selvatici, pesca, completamento azioni.
 *
 * @param grid      griglia corrente
 * @param now       timestamp corrente (ms)
 * @param config    configurazione di gioco
 */
export const processGridTick = (grid: Cell[], now: number, config: GameConfig): TickResult => {
  let newGrid = [...grid];
  let gridChanged = false;
  const rewards: Partial<Inventory> = {};
  let deadFarmers = 0;

  const addReward = (key: keyof Inventory, amount: number) => {
    rewards[key] = ((rewards[key] as number) || 0) + amount;
  };

  for (let i = 0; i < newGrid.length; i++) {
    let cell = { ...newGrid[i] };
    let cellModified = false;

    // ── Miniera attiva ──
    if (cell.type === 'mine' && cell.pendingAction === 'active_mine') {
      const elapsed = now - (cell.lastTickTime || now);
      if (elapsed >= 5000) {
        cellModified = true;
        const roll = Math.random() * 100;
        if      (roll < 7)  addReward('gold', 1);
        else if (roll < 14) addReward('copper', 1);
        else if (roll < 21) addReward('iron', 1);
        else                addReward('stone', 1);

        const ticks = (cell.mineTicks || 0) + 1;
        if (ticks >= 12) {
          cell = { ...cell, type: 'rock', pendingAction: null, lastTickTime: undefined, mineTicks: undefined, farmersUsed: undefined };
        } else {
          cell = { ...cell, lastTickTime: now, mineTicks: ticks };
        }
      }
    }

    // ── Foresta attiva ──
    if (cell.type === 'forest' && cell.pendingAction === 'active_forest') {
      const elapsed = now - (cell.lastTickTime || now);
      if (elapsed >= 15000) {
        cellModified = true;
        addReward('wood', config.forestWoodPerTick);

        const ticks = (cell.forestTicks || 0) + 1;
        if (ticks >= 4) {
          cell = { ...cell, type: 'grass', pendingAction: null, lastTickTime: undefined, forestTicks: undefined, farmersUsed: undefined };
        } else {
          cell = { ...cell, lastTickTime: now, forestTicks: ticks };
        }
      }
    }

    // ── Fattoria animali (riproduzione) ──
    if (cell.type === 'animal_farm') {
      const count = cell.animalCount || 0;
      if (count >= 2 && count < 5) {
        if (!cell.reproductionTargetTime) {
          cell = { ...cell, reproductionTargetTime: now + 20000 };
          cellModified = true;
        } else if (now >= cell.reproductionTargetTime) {
          cell = { ...cell, animalCount: count + 1, reproductionTargetTime: count + 1 < 5 ? now + 20000 : null };
          cellModified = true;
        }
      } else if (cell.reproductionTargetTime) {
        cell = { ...cell, reproductionTargetTime: null };
        cellModified = true;
      }
    }

    // ── Animali selvatici (riproduzione) ──
    if (cell.type === 'wild_animal') {
      const count = cell.wildAnimalCount || 1;
      if (count >= 2 && count < 10) {
        if (!cell.wildReproductionTargetTime) {
          cell = { ...cell, wildReproductionTargetTime: now + 50000 };
          cellModified = true;
        } else if (now >= cell.wildReproductionTargetTime) {
          cell = { ...cell, wildAnimalCount: count + 1, wildReproductionTargetTime: count + 1 < 10 ? now + 50000 : null };
          cellModified = true;
        }
      } else if (cell.wildReproductionTargetTime && count < 2) {
        cell = { ...cell, wildReproductionTargetTime: null };
        cellModified = true;
      } else if (count >= 10 && cell.wildReproductionTargetTime) {
        cell = { ...cell, wildReproductionTargetTime: null };
        cellModified = true;
      }
    }

    // ── Pesca ──
    if (cell.type === 'water' && cell.pendingAction === 'fishing') {
      const elapsed = now - (cell.lastTickTime || now);
      if (elapsed >= 10000) {
        cellModified = true;
        addReward('fish', config.fishPerTick);
        const ticks = (cell.fishingTicks || 0) + 1;
        if (ticks >= 3) {
          cell = { ...cell, pendingAction: null, lastTickTime: undefined, fishingTicks: undefined };
        } else {
          cell = { ...cell, lastTickTime: now, fishingTicks: ticks };
        }
      }
    }

    // ── Completamento azioni (busyUntil scaduto) ──
    if (cell.busyUntil && now >= cell.busyUntil && cell.pendingAction !== 'fishing') {
      cellModified = true;
      let newType = cell.type;
      let newPending: typeof cell.pendingAction = null;

      switch (cell.pendingAction) {
        case 'plowing':             newType = 'plowed'; break;
        case 'planting_tree':       newType = 'tree'; break;
        case 'planting_bush':       newType = 'bush'; break;
        case 'planting_forest':     newType = 'forest'; break;
        case 'spawn_rock':          newType = 'rock'; break;
        case 'building_village':    newType = 'village'; break;
        case 'building_city':       newType = 'city'; break;
        case 'building_county':     newType = 'county'; break;
        case 'building_lumber_mill':newType = 'lumber_mill'; break;
        case 'building_stone_mason':newType = 'stone_mason'; break;
        case 'building_port':       newType = 'port'; break;
        case 'building_house':      newType = 'house'; break;
        case 'building_mine':
          newType = 'mine';
          newPending = 'active_mine';
          cell.lastTickTime = now;
          cell.mineTicks = 0;
          break;
        case 'building_animal_farm':
          newType = 'animal_farm';
          cell.animalCount = 2;
          break;
        case 'growing':
          newType = 'ready';
          break;
        case 'harvesting': {
          newType = 'grass';
          const crop = CROPS[cell.cropType!];
          const cfgCrop = config.crops[cell.cropType!];
          const yMin = cfgCrop?.minYield ?? crop.minYield;
          const yMax = cfgCrop?.maxYield ?? crop.maxYield;
          addReward(crop.id, yMin + Math.floor(Math.random() * (yMax - yMin + 1)));
          addReward(`${crop.id}Seeds` as keyof Inventory, crop.minSeeds + Math.floor(Math.random() * (crop.maxSeeds - crop.minSeeds + 1)));
          break;
        }
        case 'chopping': {
          newType = 'grass';
          const wMin = config.choppingWoodMin;
          const wMax = config.choppingWoodMax;
          addReward('wood', wMin + Math.floor(Math.random() * (wMax - wMin + 1)));
          break;
        }
        case 'mining': {
          newType = 'grass';
          const roll = Math.random() * 100;
          if      (roll < 7)  addReward('gold', 2);
          else if (roll < 20) addReward('copper', 3);
          else if (roll < 38) addReward('iron', 3);
          else                addReward('stone', 3 + Math.floor(Math.random() * 3));
          break;
        }
        case 'crafting_planks': addReward('planks', 1); break;
        case 'crafting_bricks': addReward('bricks', 1); break;
        case 'harvesting_bush': {
          newType = 'grass';
          addReward('berries', config.bushBerriesAmount);
          const seeds: Array<keyof Inventory> = ['wheatSeeds', 'tomatoSeeds', 'carrotSeeds', 'eggplantSeeds'];
          for (let s = 0; s < config.bushSeedsAmount; s++) {
            addReward(seeds[Math.floor(Math.random() * seeds.length)], 1);
          }
          break;
        }
        case 'hunting': {
          newType = 'wild_animal';
          let wildCount = cell.wildAnimalCount || 1;
          if (Math.random() * 100 < 15) deadFarmers += 1;
          else if (Math.random() * 100 < 35) { addReward('wildMeat', 1); wildCount -= 1; }
          if (wildCount <= 0) { newType = 'grass'; cell.wildAnimalCount = undefined; cell.wildReproductionTargetTime = undefined; }
          else { cell.wildAnimalCount = wildCount; }
          break;
        }
        case 'hunting_wolf': {
          newType = 'wolf';
          let wolfCount = cell.wolfCount || 1;
          if (Math.random() * 100 < 40) deadFarmers += Math.floor(Math.random() * 2) + 2;
          else if (Math.random() * 100 < 70) { addReward('wildMeat', 2); wolfCount -= 1; }
          if (wolfCount <= 0) { newType = 'grass'; cell.wolfCount = undefined; }
          else { cell.wolfCount = wolfCount; }
          break;
        }
        default:
          // planting_wheat / planting_tomato / ecc. → growing
          if (typeof cell.pendingAction === 'string' && cell.pendingAction.startsWith('planting_')) {
            newType = 'growing';
            const cropType = cell.cropType!;
            const growthTime = config.crops[cropType]?.growthTime ?? CROPS[cropType].growthTime;
            cell.busyUntil = now + growthTime;
            cell.busyTotalDuration = growthTime;
            newPending = 'growing';
          }
      }

      cell = {
        ...cell,
        type: newType,
        pendingAction: newPending,
        cropType: newType === 'grass' ? undefined : cell.cropType,
        farmersUsed: undefined,
      };
      if (newPending !== 'growing') {
        cell.busyUntil = null;
        cell.busyTotalDuration = null;
      }
    }

    if (cellModified) {
      newGrid[i] = cell;
      gridChanged = true;
    }
  }

  return { newGrid, rewards, deadFarmers, gridChanged };
};
