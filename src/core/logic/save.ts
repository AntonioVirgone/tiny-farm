// Serializzazione/deserializzazione dello stato — zero storage, zero browser API.
// Il layer di persistenza (localStorage / AsyncStorage / file) è responsabilità della piattaforma.

import type { Cell, Inventory, UnlockedBuildings } from '../types/game.types';

// ─── Payload ─────────────────────────────────────────────────────────────────

export interface SavePayload {
  inventory: Inventory;
  unlocked: UnlockedBuildings;
  grid: string;               // JSON.stringify(Cell[])
  completedQuests: string[];
  respawningFarmers: string;  // JSON.stringify(number[])
  dayCount: number;
  actionsUsedToday: number;
}

export interface SaveState {
  inventory: Inventory;
  unlocked: UnlockedBuildings;
  grid: Cell[];
  completedQuests: string[];
  respawningFarmers: number[];
  dayCount: number;
  actionsUsedToday: number;
}

// ─── Serializzazione ─────────────────────────────────────────────────────────

export const buildSavePayload = (state: SaveState): SavePayload => ({
  inventory: state.inventory,
  unlocked: state.unlocked,
  grid: JSON.stringify(state.grid),
  completedQuests: state.completedQuests,
  respawningFarmers: JSON.stringify(state.respawningFarmers),
  dayCount: state.dayCount,
  actionsUsedToday: state.actionsUsedToday,
});

// ─── Deserializzazione ───────────────────────────────────────────────────────

/**
 * Converte un payload grezzo (da localStorage / file / network) in SaveState.
 * Lancia eccezioni in caso di dati corrotti — gestire nel chiamante.
 */
export const parseSavePayload = (raw: SavePayload): SaveState => ({
  inventory:        raw.inventory,
  unlocked:         raw.unlocked,
  grid:             JSON.parse(raw.grid),
  completedQuests:  raw.completedQuests || [],
  respawningFarmers: JSON.parse(raw.respawningFarmers || '[]'),
  dayCount:         raw.dayCount || 1,
  actionsUsedToday: raw.actionsUsedToday || 0,
});

/**
 * Valida minimamente un payload prima di usarlo.
 */
export const isValidSavePayload = (data: unknown): data is SavePayload => {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.inventory === 'object' &&
    typeof d.grid === 'string' &&
    typeof d.dayCount === 'number'
  );
};
