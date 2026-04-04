// Barrel export del core — importare da qui per massima portabilità.
// Ogni simbolo esportato è privo di dipendenze browser/DOM/lucide.

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  CropId, CropConfig, CellType, ActionType,
  Inventory, UnlockedBuildings, Cell, Toast,
  QuestDefinition, GameState,
} from './types/game.types';

export type { GameConfig, CropOverride } from './types/config.types';

// ── Constants ──────────────────────────────────────────────────────────────
export {
  CROPS, INITIAL_INVENTORY, INITIAL_UNLOCKED,
  GRID_SIZE, BASE_INITIAL_FARMERS, ACTION_TIMES, COSTS,
} from './constants/game.constants';

export { DEFAULT_GAME_CONFIG, mergeWithDefaults } from './constants/config.defaults';

// ── Utils ──────────────────────────────────────────────────────────────────
export { generateInitialGrid, getMergeableCells } from './utils/grid.utils';

// ── Logic ─────────────────────────────────────────────────────────────────
export {
  computeBaseFarmers, computeTotalPorts, computeTotalFarmers,
  computeBusyFarmers, computeActionsLeft, computeAvailableShips,
  computeTotalAnimals,
} from './logic/farmers';

export type { ActionContext, ActionResult } from './logic/actions';
export {
  applyAction, applyInventoryDelta,
  buySeed, sellResource, sellAnimals,
} from './logic/actions';

export { applyNightOnGrid, processNightEvents, shouldAutoEndDay } from './logic/turn';

export { computeUnlocks } from './logic/unlocks';

export type { QuestCheckState } from './logic/quests';
export { QUEST_DEFINITIONS, checkActiveQuest } from './logic/quests';

export type { TickResult } from './logic/gameLoop';
export { processGridTick } from './logic/gameLoop';

export type { GameEvent, GameEventType } from './logic/events';
export { generateRandomEvent } from './logic/events';

export type { SavePayload, SaveState } from './logic/save';
export { buildSavePayload, parseSavePayload, isValidSavePayload } from './logic/save';

// ── Hooks (React / React Native) ───────────────────────────────────────────
export { useGameLoop }  from './hooks/useGameLoop';
export { useGameEvents } from './hooks/useGameEvents';
export { useVillageElder } from './hooks/useVillageElder';
