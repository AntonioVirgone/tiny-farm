import { useEffect } from 'react';
import type { Cell, GameState, Inventory, Toast, UnlockedBuildings } from '../types/game.types';

interface SaveData {
  inventory: Inventory;
  unlocked: UnlockedBuildings;
  grid: Cell[];
  completedQuests: string[];
  respawningFarmers: number[];
  dayCount: number;
  actionsUsedToday: number;
}

interface Params {
  gameState: GameState;
  stateRef: React.MutableRefObject<SaveData>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setHasSave: React.Dispatch<React.SetStateAction<boolean>>;
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  setUnlocked: React.Dispatch<React.SetStateAction<UnlockedBuildings>>;
  setGrid: React.Dispatch<React.SetStateAction<Cell[]>>;
  setCompletedQuests: React.Dispatch<React.SetStateAction<string[]>>;
  setRespawningFarmers: React.Dispatch<React.SetStateAction<number[]>>;
  setDayCount: React.Dispatch<React.SetStateAction<number>>;
  setActionsUsedToday: React.Dispatch<React.SetStateAction<number>>;
  setIsNight: React.Dispatch<React.SetStateAction<boolean>>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const LOCAL_STORAGE_KEY = 'fattoria_avanzata_save';

const buildSavePayload = (state: SaveData) => ({
  inventory: state.inventory,
  unlocked: state.unlocked,
  grid: JSON.stringify(state.grid),
  completedQuests: state.completedQuests,
  respawningFarmers: JSON.stringify(state.respawningFarmers),
  dayCount: state.dayCount,
  actionsUsedToday: state.actionsUsedToday,
});

const applyLoadedData = (data: any, setters: Omit<Params, 'gameState' | 'stateRef' | 'isSaving' | 'setIsSaving' | 'setHasSave' | 'setToasts'>) => {
  setters.setInventory(data.inventory);
  setters.setUnlocked(data.unlocked);
  setters.setGrid(JSON.parse(data.grid));
  setters.setCompletedQuests(data.completedQuests || []);
  setters.setRespawningFarmers(JSON.parse(data.respawningFarmers || '[]'));
  setters.setDayCount(data.dayCount || 1);
  setters.setActionsUsedToday(data.actionsUsedToday || 0);
  setters.setIsNight(false);
  setters.setGameState('playing');
};

export const useSave = (params: Params) => {
  const { gameState, stateRef, isSaving, setIsSaving, setHasSave, setToasts, ...setters } = params;

  // Auto-save ogni 60s
  useEffect(() => {
    if (gameState !== 'playing') return;
    const autoSaveInterval = setInterval(() => handleSaveGame(true), 60000);
    return () => clearInterval(autoSaveInterval);
  }, [gameState]);

  const handleSaveGame = (isAuto = false) => {
    if (!isAuto) setIsSaving(true);
    const payload = buildSavePayload(stateRef.current);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setHasSave(true);
      const msg = isAuto ? 'Autosalvataggio completato' : 'Partita salvata!';
      setToasts(prev => [...prev, { id: 'save-' + Date.now(), title: msg, type: 'success' }]);
    } catch {
      if (!isAuto) setToasts(prev => [...prev, { id: 'err-save', title: 'Errore nel salvataggio', type: 'danger' }]);
    }
    if (!isAuto) setIsSaving(false);
    setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('save-'))), 3000);
  };

  const handleLoadGame = () => {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const data = JSON.parse(local);
        applyLoadedData(data, setters);
      } catch {
        setToasts(prev => [...prev, { id: 'err-load', title: 'Salvataggio corrotto', type: 'danger' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== 'err-load')), 3000);
      }
    } else {
      setToasts(prev => [...prev, { id: 'err-load', title: 'Nessun salvataggio trovato', type: 'danger' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== 'err-load')), 3000);
    }
  };

  const handleExportSave = () => {
    const payload = buildSavePayload(stateRef.current);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fattoria_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setToasts(prev => [...prev, { id: 'export-' + Date.now(), title: 'File di salvataggio esportato!', type: 'success' }]);
    setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('export-'))), 3000);
  };

  const handleImportSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (!data.inventory || !data.grid) throw new Error('File JSON non valido');
        applyLoadedData(data, setters);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        setHasSave(true);
        setToasts(prev => [...prev, { id: 'load-file', title: 'Partita caricata dal file!', type: 'success' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== 'load-file')), 3000);
      } catch {
        alert("Errore nell'importazione. Assicurati che sia un file JSON valido generato dal gioco.");
      }
    };
    reader.readAsText(file);
  };

  return { handleSaveGame, handleLoadGame, handleExportSave, handleImportSave };
};