// Hook eventi di gioco — usa solo React hooks + core/logic/events.
// Compatibile con React Native (nessuna dipendenza browser).

import { useEffect } from 'react';
import type { Cell, GameState, Toast } from '../types/game.types';
import { generateRandomEvent } from '../logic/events';

interface Params {
  gameState: GameState;
  gridRef: React.MutableRefObject<Cell[]>;
  respawningRef: React.MutableRefObject<number[]>;
  setGrid: React.Dispatch<React.SetStateAction<Cell[]>>;
  setRespawningFarmers: React.Dispatch<React.SetStateAction<number[]>>;
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
}

export const useGameEvents = ({
  gameState,
  gridRef,
  respawningRef,
  setGrid,
  setRespawningFarmers,
  setToasts,
}: Params) => {
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const grid = gridRef.current;
      const respawningCount = respawningRef.current.length;

      const event = generateRandomEvent(grid, respawningCount);
      if (!event) return;

      // Applica effetti dell'evento
      if (event.type === 'disease') {
        setRespawningFarmers(prev => [...prev, Date.now() + 40000]);
      } else if (event.type === 'wolf_spawn' && event.wolfTargetIdx !== undefined) {
        const idx = event.wolfTargetIdx;
        setGrid(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], type: 'wolf', wolfCount: 1 };
          return next;
        });
      } else if (event.type === 'bandits') {
        setRespawningFarmers(prev => [...prev, Date.now() + 40000]);
      }

      // Toast notifica
      const toastId = 'evt-' + Date.now();
      setToasts(prev => [...prev, { id: toastId, title: event.message, type: 'danger' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000);
    }, 45000);

    return () => clearInterval(interval);
  }, [gameState]);
};
