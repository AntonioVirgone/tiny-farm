import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';

// Core logic
import { generateInitialGrid, getMergeableCells } from '@core/utils/grid.utils';
import { INITIAL_INVENTORY, INITIAL_UNLOCKED } from '@core/constants/game.constants';
import { DEFAULT_GAME_CONFIG, mergeWithDefaults } from '@core/constants/config.defaults';
import { applyAction, applyInventoryDelta } from '@core/logic/actions';
import { computeUnlocks } from '@core/logic/unlocks';
import { computeBaseFarmers, computeTotalPorts, computeTotalFarmers, computeBusyFarmers, computeActionsLeft, computeAvailableShips } from '@core/logic/farmers';
import { applyNightOnGrid, processNightEvents } from '@core/logic/turn';
import { parseSavePayload, isValidSavePayload } from '@core/logic/save';
import { useGameLoop } from '@core/hooks/useGameLoop';
import { useGameEvents } from '@core/hooks/useGameEvents';
import type { Cell, Inventory, Toast, UnlockedBuildings, ActionType } from '@core/types/game.types';
import type { GameConfig } from '@core/types/config.types';

// Storage
import { saveGame, loadGame } from '../storage/gameStorage';

// Components
import HUD from '../components/HUD';
import GameGrid from '../components/grid/GameGrid';
import ToastContainer from '../components/ToastContainer';
import FloatingButtons from '../components/FloatingButtons';
import CellActionModal from '../components/modals/CellActionModal';
import InventoryModal from '../components/modals/InventoryModal';
import MarketModal from '../components/modals/MarketModal';

interface Props {
  gameConfig: GameConfig;
  savedData?: unknown;
  onGameOver: (dayCount: number, coins: number) => void;
}

const GameScreen: React.FC<Props> = ({ gameConfig, savedData, onGameOver }) => {
  const cfg = mergeWithDefaults(gameConfig);

  // ─── State ───────────────────────────────────────────────────────────────────
  const [grid, setGrid] = useState<Cell[]>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).grid; } catch {}
    }
    return generateInitialGrid();
  });

  const [inventory, setInventory] = useState<Inventory>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).inventory; } catch {}
    }
    return { ...INITIAL_INVENTORY, coins: cfg.initialCoins, wheatSeeds: cfg.initialWheatSeeds };
  });

  const [unlocked, setUnlocked] = useState<UnlockedBuildings>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).unlocked; } catch {}
    }
    return { ...INITIAL_UNLOCKED };
  });

  const [dayCount, setDayCount] = useState<number>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).dayCount; } catch {}
    }
    return 1;
  });

  const [actionsUsedToday, setActionsUsedToday] = useState<number>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).actionsUsedToday; } catch {}
    }
    return 0;
  });

  const [respawningFarmers, setRespawningFarmers] = useState<number[]>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).respawningFarmers; } catch {}
    }
    return [];
  });

  const [completedQuests] = useState<string[]>(() => {
    if (savedData && isValidSavePayload(savedData)) {
      try { return parseSavePayload(savedData as any).completedQuests; } catch {}
    }
    return [];
  });

  const [isNight, setIsNight] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showMarket, setShowMarket] = useState(false);

  // Refs
  const gridRef = useRef(grid);
  const respawningRef = useRef(respawningFarmers);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { respawningRef.current = respawningFarmers; }, [respawningFarmers]);

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const baseFarmers    = computeBaseFarmers(grid);
  const totalPorts     = computeTotalPorts(grid);
  const totalFarmers   = computeTotalFarmers(grid, respawningFarmers.length);
  const busyFarmers    = computeBusyFarmers(grid);
  const actionsLeft    = computeActionsLeft(totalFarmers, actionsUsedToday);
  const availableShips = computeAvailableShips(grid);

  const reachableCells = React.useMemo(() => {
    const reach = new Set<number>();
    const waterCells = new Set(grid.map((c, i) => c.type === 'water' ? i : -1).filter(i => i !== -1));
    const portCells  = new Set(grid.map((c, i) => c.type === 'port' ? i : -1).filter(i => i !== -1));
    for (let i = 0; i < 64; i++) {
      if (!waterCells.has(i)) reach.add(i);
      if (portCells.size > 0) waterCells.forEach(w => reach.add(w));
    }
    return reach;
  }, [grid]);

  // ─── Hooks ───────────────────────────────────────────────────────────────────
  useGameLoop({
    gameState: 'playing',
    setGrid,
    setInventory,
    setNow,
    setRespawningFarmers,
    respawningRef,
    gameConfig: cfg,
  });

  useGameEvents({
    gameState: 'playing',
    gridRef,
    respawningRef,
    setGrid,
    setRespawningFarmers,
    setToasts,
  });

  // ─── Unlock effect ────────────────────────────────────────────────────────────
  useEffect(() => {
    setUnlocked(prev => computeUnlocks(inventory, totalFarmers, prev));
  }, [inventory, totalFarmers]);

  // ─── Autosave ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    saveGame({
      inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday,
    }).catch(() => {});
  }, [dayCount, actionsUsedToday, inventory]);

  // ─── Toast helper ─────────────────────────────────────────────────────────────
  const addToast = useCallback((title: string, type: 'success' | 'danger' = 'success') => {
    const id = String(Date.now() + Math.random());
    setToasts(prev => [...prev, { id, title, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // ─── End Day ─────────────────────────────────────────────────────────────────
  const handleEndDay = useCallback(() => {
    if (isNight) return;
    const now = Date.now();
    setGrid(prev => applyNightOnGrid(prev, now));
    setIsNight(true);

    setTimeout(() => {
      setGrid(prev => processNightEvents(prev, dayCount));
      setDayCount(d => d + 1);
      setActionsUsedToday(0);
      setIsNight(false);
      addToast(`Giorno ${dayCount + 1} iniziato! 🌅`, 'success');
    }, 2500);
  }, [isNight, dayCount, addToast]);

  // ─── Action ──────────────────────────────────────────────────────────────────
  const handleAction = useCallback((cellId: number, action: ActionType) => {
    const result = applyAction(cellId, action, {
      grid, inventory, actionsLeft, isNight, respawningCount: respawningFarmers.length,
    }, cfg, Date.now());

    if (!result) return;

    setGrid(result.newGrid);
    if (Object.keys(result.inventoryDelta).length > 0) {
      setInventory(prev => applyInventoryDelta(prev, result.inventoryDelta));
    }
    if (result.actionsUsedDelta > 0) {
      setActionsUsedToday(prev => prev + result.actionsUsedDelta);
    }
  }, [grid, inventory, actionsLeft, isNight, respawningFarmers.length, cfg]);

  // ─── Market ──────────────────────────────────────────────────────────────────
  const handleSell = useCallback((resource: keyof Inventory, amount: number, price: number) => {
    setInventory(prev => {
      const have = prev[resource] as number;
      const sell = Math.min(amount, have);
      if (sell <= 0) return prev;
      return { ...prev, [resource]: have - sell, coins: prev.coins + sell * price };
    });
  }, []);

  const handleBuySeed = useCallback((cropId: string, cost: number) => {
    setInventory(prev => {
      if (prev.coins < cost) return prev;
      const seedKey = `${cropId}Seeds` as keyof Inventory;
      return { ...prev, coins: prev.coins - cost, [seedKey]: (prev[seedKey] as number) + 1 };
    });
  }, []);

  // ─── Selected cell helpers ────────────────────────────────────────────────────
  const selectedCell = selectedCellId !== null ? grid.find(c => c.id === selectedCellId) ?? null : null;
  const isAdjacentToWater = selectedCellId !== null && (() => {
    const neighbors = [selectedCellId - 1, selectedCellId + 1, selectedCellId - 8, selectedCellId + 8];
    return neighbors.some(n => n >= 0 && n < 64 && grid[n]?.type === 'water');
  })();

  const getMergeable = useCallback((cellId: number, targetType: string) => {
    return getMergeableCells(cellId, targetType as any, grid);
  }, [grid]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HUD */}
        <HUD
          dayCount={dayCount}
          isNight={isNight}
          totalFarmers={totalFarmers}
          actionsLeft={actionsLeft}
          inventory={inventory}
          onEndDay={handleEndDay}
        />

        {/* Grid */}
        <View style={styles.gridArea}>
          <GameGrid
            grid={grid}
            reachableCells={reachableCells}
            selectedCell={selectedCellId}
            now={now}
            onCellPress={setSelectedCellId}
          />
        </View>

        {/* Toasts */}
        <ToastContainer toasts={toasts} />

        {/* Bottom bar */}
        <FloatingButtons
          onInventory={() => setShowInventory(true)}
          onMarket={() => setShowMarket(true)}
          onQuests={() => addToast('Missioni in arrivo!', 'success')}
          onElderChat={() => addToast("L'Anziano ti saluta!", 'success')}
        />

        {/* Modals */}
        <CellActionModal
          cell={selectedCell}
          visible={selectedCellId !== null}
          isReachable={selectedCellId !== null && reachableCells.has(selectedCellId)}
          isAdjacentToWater={isAdjacentToWater}
          inventory={inventory}
          unlocked={unlocked}
          actionsLeft={actionsLeft}
          availableShips={availableShips}
          totalPorts={totalPorts}
          baseFarmers={baseFarmers}
          respawningCount={respawningFarmers.length}
          gameConfig={cfg}
          getMergeableCells={getMergeable}
          onAction={handleAction}
          onClose={() => setSelectedCellId(null)}
        />

        <InventoryModal
          visible={showInventory}
          inventory={inventory}
          onClose={() => setShowInventory(false)}
        />

        <MarketModal
          visible={showMarket}
          inventory={inventory}
          onSell={handleSell}
          onBuySeed={handleBuySeed}
          onClose={() => setShowMarket(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a1f10' },
  container: { flex: 1, backgroundColor: '#0a1f10' },
  gridArea: { flex: 1 },
});

export default GameScreen;
