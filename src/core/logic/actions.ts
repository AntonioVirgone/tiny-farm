// Logica delle azioni del giocatore — pure functions, nessun side-effect React.
// Restituisce una ActionResult oppure null se l'azione non è valida.

import type { Cell, CellType, CropId, Inventory, ActionType } from '../types/game.types';
import type { GameConfig } from '../types/config.types';
import { CROPS, COSTS } from '../constants/game.constants';
import { getMergeableCells } from '../utils/grid.utils';
import { computeBaseFarmers, computeTotalPorts } from './farmers';

// ─── Tipi ───────────────────────────────────────────────────────────────────

export interface ActionContext {
  grid: Cell[];
  inventory: Inventory;
  actionsLeft: number;
  isNight: boolean;
  respawningCount: number;
}

export interface ActionResult {
  newGrid: Cell[];
  inventoryDelta: Partial<Inventory>;  // valori positivi = guadagno, negativi = costo
  actionsUsedDelta: number;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Applica un delta all'inventario corrente. */
export const applyInventoryDelta = (inventory: Inventory, delta: Partial<Inventory>): Inventory => {
  const next = { ...inventory };
  (Object.keys(delta) as Array<keyof Inventory>).forEach(k => {
    (next[k] as number) += (delta[k] as number) || 0;
  });
  return next;
};

/** Costo in farmers dell'azione. */
const computeCostFarmers = (action: ActionType): number => {
  if (action === 'hunting') return 2;
  if (action === 'hunting_wolf') return 3;
  if (action === 'start_active_forest') return 3;
  if (typeof action === 'string' && action.startsWith('building_')) {
    return COSTS[action.replace('building_', '') as keyof typeof COSTS]?.farmers || 1;
  }
  if (action === 'planting_tree') return COSTS.tree.farmers;
  if (action === 'planting_forest') return COSTS.forest.farmers;
  if (action === 'spawn_rock') return COSTS.rock.farmers;
  if (action === 'planting_bush') return COSTS.bush.farmers;
  return 1;
};

// ─── Azione principale ───────────────────────────────────────────────────────

/**
 * Calcola il nuovo stato del gioco dopo un'azione del giocatore.
 * @param now  timestamp corrente (ms) — iniettabile per test
 */
export const applyAction = (
  cellId: number,
  action: ActionType,
  ctx: ActionContext,
  config: GameConfig,
  now: number = Date.now(),
): ActionResult | null => {
  if (ctx.isNight) return null;
  const cell = ctx.grid.find(c => c.id === cellId);
  if (!cell) return null;

  const at = config.actionTimes as Record<string, number>;
  const totalPorts = computeTotalPorts(ctx.grid);
  const baseFarmers = computeBaseFarmers(ctx.grid);

  // ── Vendita animale direttamente dalla cella ──
  if (action === 'sell_animal') {
    const idx = ctx.grid.findIndex(c => c.id === cellId);
    if (idx === -1 || !ctx.grid[idx].animalCount) return null;
    const newGrid = [...ctx.grid];
    newGrid[idx] = { ...newGrid[idx], animalCount: newGrid[idx].animalCount! - 1 };
    return { newGrid, inventoryDelta: { coins: 100 }, actionsUsedDelta: 0 };
  }

  // ── Pesca ──
  if (action === 'fishing') {
    const busyShips = ctx.grid.filter(c => c.pendingAction === 'fishing').length;
    if (totalPorts - busyShips < 1) return null;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId
        ? { ...c, pendingAction: action as ActionType, lastTickTime: now, fishingTicks: 0 }
        : c
    );
    return { newGrid, inventoryDelta: {}, actionsUsedDelta: 0 };
  }

  // ── Costo farmers + check ──
  const costFarmers = computeCostFarmers(action);
  if (ctx.actionsLeft < costFarmers) return null;

  // ── Attivazione foresta ──
  if (action === 'start_active_forest') {
    const newGrid = ctx.grid.map(c =>
      c.id === cellId
        ? { ...c, pendingAction: 'active_forest' as ActionType, lastTickTime: now, forestTicks: 0, farmersUsed: costFarmers }
        : c
    );
    return { newGrid, inventoryDelta: {}, actionsUsedDelta: costFarmers };
  }

  // ── Caccia ──
  if (action === 'hunting') {
    const d = at.hunting;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: {}, actionsUsedDelta: costFarmers };
  }

  if (action === 'hunting_wolf') {
    const d = at.hunting_wolf;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: {}, actionsUsedDelta: costFarmers };
  }

  // ── Costruzioni ──
  const buildingChecks: Record<string, () => boolean> = {
    building_house:       () => ctx.inventory.wood >= COSTS.house.wood && ctx.inventory.stone >= COSTS.house.stone,
    building_port:        () => ctx.inventory.wood >= COSTS.port.wood && ctx.inventory.stone >= COSTS.port.stone && ctx.inventory.coins >= COSTS.port.coins && (baseFarmers - ((totalPorts + 1) * COSTS.port.farmers) - ctx.respawningCount) >= 1,
    building_lumber_mill: () => ctx.inventory.wood >= COSTS.lumber_mill.wood && ctx.inventory.stone >= COSTS.lumber_mill.stone && ctx.inventory.coins >= COSTS.lumber_mill.coins,
    building_stone_mason: () => ctx.inventory.wood >= COSTS.stone_mason.wood && ctx.inventory.stone >= COSTS.stone_mason.stone && ctx.inventory.coins >= COSTS.stone_mason.coins,
    building_mine:        () => ctx.inventory.wood >= COSTS.mine.wood && ctx.inventory.coins >= COSTS.mine.coins,
    building_animal_farm: () => ctx.inventory.wheat >= COSTS.animal_farm.wheat && ctx.inventory.wood >= COSTS.animal_farm.wood && ctx.inventory.stone >= COSTS.animal_farm.stone && ctx.inventory.coins >= COSTS.animal_farm.coins,
  };

  const buildingDeltas: Record<string, () => Partial<Inventory>> = {
    building_house:       () => ({ wood: -COSTS.house.wood, stone: -COSTS.house.stone }),
    building_port:        () => ({ wood: -COSTS.port.wood, stone: -COSTS.port.stone, coins: -COSTS.port.coins }),
    building_lumber_mill: () => ({ wood: -COSTS.lumber_mill.wood, stone: -COSTS.lumber_mill.stone, coins: -COSTS.lumber_mill.coins }),
    building_stone_mason: () => ({ wood: -COSTS.stone_mason.wood, stone: -COSTS.stone_mason.stone, coins: -COSTS.stone_mason.coins }),
    building_mine:        () => ({ wood: -COSTS.mine.wood, coins: -COSTS.mine.coins }),
    building_animal_farm: () => ({ wheat: -COSTS.animal_farm.wheat, wood: -COSTS.animal_farm.wood, stone: -COSTS.animal_farm.stone, coins: -COSTS.animal_farm.coins }),
  };

  if (action && action in buildingChecks) {
    if (!buildingChecks[action as string]()) return null;
    const d = at[action as string] || 15000;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: buildingDeltas[action as string](), actionsUsedDelta: costFarmers };
  }

  // ── Merge (villaggio, città, contea) ──
  const mergeMap: Record<string, { sourceType: CellType; costKey: keyof typeof COSTS }> = {
    building_village: { sourceType: 'house',    costKey: 'village' },
    building_city:    { sourceType: 'village',  costKey: 'city' },
    building_county:  { sourceType: 'city',     costKey: 'county' },
  };

  if (action && action in mergeMap) {
    const { sourceType, costKey } = mergeMap[action as string];
    const targets = getMergeableCells(cellId, sourceType, ctx.grid);
    const costCoins = (COSTS[costKey] as { coins: number }).coins;
    if (!targets || ctx.inventory.coins < costCoins) return null;
    const d = at[action as string] || 20000;
    const newGrid = ctx.grid.map(c => {
      if (c.id === cellId)         return { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers };
      if (targets.includes(c.id)) return { ...c, type: 'grass' as CellType, pendingAction: null, busyUntil: null, busyTotalDuration: null, farmersUsed: undefined };
      return c;
    });
    return { newGrid, inventoryDelta: { coins: -costCoins }, actionsUsedDelta: costFarmers };
  }

  // ── Crafting ──
  if (action === 'crafting_planks') {
    if (ctx.inventory.wood < 2) return null;
    const d = at.crafting;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: { wood: -2 }, actionsUsedDelta: costFarmers };
  }

  if (action === 'crafting_bricks') {
    if (ctx.inventory.stone < 2) return null;
    const d = at.crafting;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: { stone: -2 }, actionsUsedDelta: costFarmers };
  }

  // ── Piantagioni (albero, foresta, roccia, cespuglio) ──
  const plantingMap: Record<string, { check: () => boolean; delta: Partial<Inventory>; durationKey: string }> = {
    planting_tree:   { check: () => ctx.inventory.coins >= COSTS.tree.coins,                                                   delta: { coins: -COSTS.tree.coins },                                             durationKey: 'planting_tree' },
    planting_forest: { check: () => ctx.inventory.coins >= COSTS.forest.coins && ctx.inventory.stone >= COSTS.forest.stone,  delta: { coins: -COSTS.forest.coins, stone: -COSTS.forest.stone },               durationKey: 'planting_forest' },
    spawn_rock:      { check: () => ctx.inventory.coins >= COSTS.rock.coins,                                                   delta: { coins: -COSTS.rock.coins },                                             durationKey: 'spawn_rock' },
    planting_bush:   { check: () => ctx.inventory.coins >= COSTS.bush.coins,                                                   delta: { coins: -COSTS.bush.coins },                                             durationKey: 'planting_bush' },
  };

  if (action && action in plantingMap) {
    const entry = plantingMap[action as string];
    if (!entry.check()) return null;
    const d = at[entry.durationKey] || 5000;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: entry.delta, actionsUsedDelta: costFarmers };
  }

  // ── Semina colture ──
  if (
    typeof action === 'string' &&
    action.startsWith('planting_') &&
    !['planting_forest', 'planting_tree', 'planting_bush'].includes(action)
  ) {
    const cropId = action.split('_')[1] as CropId;
    const seedKey = `${cropId}Seeds` as keyof Inventory;
    if ((ctx.inventory[seedKey] as number) < 1) return null;
    const d = at.planting;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, cropType: cropId, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: { [seedKey]: -1 } as Partial<Inventory>, actionsUsedDelta: costFarmers };
  }

  // ── Azioni base (aratura, taglio, estrazione, raccolta) ──
  if (['plowing', 'chopping', 'mining', 'harvesting', 'harvesting_bush'].includes(action as string)) {
    const d = at[action as string] || 3000;
    const newGrid = ctx.grid.map(c =>
      c.id === cellId ? { ...c, busyUntil: now + d, busyTotalDuration: d, pendingAction: action as ActionType, farmersUsed: costFarmers } : c
    );
    return { newGrid, inventoryDelta: {}, actionsUsedDelta: costFarmers };
  }

  return null;
};

// ─── Mercato ─────────────────────────────────────────────────────────────────

export const buySeed = (cropId: CropId, inventory: Inventory, config: GameConfig): { newInventory: Inventory } | null => {
  const cost = config.crops[cropId]?.seedCost ?? CROPS[cropId].seedCost;
  if (inventory.coins < cost) return null;
  const seedKey = `${cropId}Seeds` as keyof Inventory;
  return {
    newInventory: {
      ...inventory,
      coins: inventory.coins - cost,
      [seedKey]: (inventory[seedKey] as number) + 1,
    },
  };
};

export const sellResource = (
  itemKey: keyof Inventory,
  amount: number,
  pricePerUnit: number,
  inventory: Inventory,
): { newInventory: Inventory } | null => {
  if ((inventory[itemKey] as number) < amount) return null;
  return {
    newInventory: {
      ...inventory,
      coins: inventory.coins + amount * pricePerUnit,
      [itemKey]: (inventory[itemKey] as number) - amount,
    },
  };
};

export const sellAnimals = (
  amount: number,
  pricePerUnit: number,
  grid: Cell[],
  inventory: Inventory,
): { newGrid: Cell[]; newInventory: Inventory } => {
  let remaining = amount;
  const newGrid = grid.map(c => {
    if (remaining <= 0 || c.type !== 'animal_farm' || !c.animalCount) return c;
    const toTake = Math.min(c.animalCount, remaining);
    remaining -= toTake;
    return { ...c, animalCount: c.animalCount - toTake };
  });
  return {
    newGrid,
    newInventory: { ...inventory, coins: inventory.coins + amount * pricePerUnit },
  };
};
