// Storage layer React Native — AsyncStorage al posto di localStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildSavePayload, parseSavePayload, isValidSavePayload,
  type SaveState,
} from '@core/logic/save';
import { mergeWithDefaults, DEFAULT_GAME_CONFIG } from '@core/constants/config.defaults';
import type { GameConfig } from '@core/types/config.types';

const SAVE_KEY   = 'fattoria_avanzata_save';
const CONFIG_KEY = 'fattoria_config';

// ── Partita ───────────────────────────────────────────────────────────────

export const saveGame = async (state: SaveState): Promise<void> => {
  const payload = buildSavePayload(state);
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload));
};

export const loadGame = async (): Promise<SaveState | null> => {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (!isValidSavePayload(data)) return null;
  return parseSavePayload(data);
};

export const hasSavedGame = async (): Promise<boolean> => {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  return raw !== null;
};

export const deleteSave = async (): Promise<void> => {
  await AsyncStorage.removeItem(SAVE_KEY);
};

// ── Configurazione ────────────────────────────────────────────────────────

export const saveConfig = async (config: GameConfig): Promise<void> => {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const loadConfig = async (): Promise<GameConfig> => {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_GAME_CONFIG;
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return DEFAULT_GAME_CONFIG;
  }
};

export const resetConfig = async (): Promise<void> => {
  await AsyncStorage.removeItem(CONFIG_KEY);
};
