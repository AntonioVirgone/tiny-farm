// Logica sblocco edifici — pure function, nessun side-effect.

import type { Inventory, UnlockedBuildings } from '../types/game.types';
import { COSTS } from '../constants/game.constants';

/**
 * Calcola il nuovo stato degli sblocchi in base all'inventario e ai farmers.
 * Restituisce lo stesso oggetto se nulla è cambiato (referenza stabile per React).
 */
export const computeUnlocks = (
  inventory: Inventory,
  totalFarmers: number,
  current: UnlockedBuildings,
): UnlockedBuildings => {
  const next = { ...current };
  let changed = false;

  const check = (key: keyof UnlockedBuildings, condition: boolean) => {
    if (!next[key] && condition) { next[key] = true; changed = true; }
  };

  check('tree',         inventory.coins >= COSTS.tree.coins         && totalFarmers >= COSTS.tree.farmers);
  check('forest',       inventory.coins >= COSTS.forest.coins       && (inventory.stone ?? 0) >= (COSTS.forest as any).stone && totalFarmers >= COSTS.forest.farmers);
  check('house',        inventory.wood  >= COSTS.house.wood         && inventory.stone >= COSTS.house.stone);
  check('animal_farm',  inventory.wheat >= COSTS.animal_farm.wheat  && inventory.wood >= COSTS.animal_farm.wood && inventory.stone >= COSTS.animal_farm.stone && inventory.coins >= COSTS.animal_farm.coins && totalFarmers >= COSTS.animal_farm.farmers);
  check('lumber_mill',  inventory.wood  >= COSTS.lumber_mill.wood   && inventory.stone >= COSTS.lumber_mill.stone && inventory.coins >= COSTS.lumber_mill.coins && totalFarmers >= COSTS.lumber_mill.farmers);
  check('stone_mason',  inventory.wood  >= COSTS.stone_mason.wood   && inventory.stone >= COSTS.stone_mason.stone && inventory.coins >= COSTS.stone_mason.coins && totalFarmers >= COSTS.stone_mason.farmers);
  check('mine',         inventory.wood  >= COSTS.mine.wood          && inventory.coins >= COSTS.mine.coins && totalFarmers >= COSTS.mine.farmers);
  check('port',         inventory.wood  >= COSTS.port.wood          && inventory.stone >= COSTS.port.stone && inventory.coins >= COSTS.port.coins && totalFarmers >= COSTS.port.farmers);
  check('rock',         inventory.coins >= COSTS.rock.coins         && totalFarmers >= COSTS.rock.farmers);
  check('bush',         inventory.coins >= COSTS.bush.coins         && totalFarmers >= COSTS.bush.farmers);
  check('village',      inventory.coins >= COSTS.village.coins      && totalFarmers >= COSTS.village.farmers);
  check('city',         inventory.coins >= COSTS.city.coins         && totalFarmers >= COSTS.city.farmers);
  check('county',       inventory.coins >= COSTS.county.coins       && totalFarmers >= COSTS.county.farmers);

  return changed ? next : current;
};
