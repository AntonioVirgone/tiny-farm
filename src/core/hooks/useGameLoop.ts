// Hook del game loop — usa solo React hooks + core/logic/gameLoop.
// Compatibile con React Native (nessuna dipendenza browser).

import { useEffect } from 'react';
import type { Cell, GameState, Inventory } from '../types/game.types';
import type { GameConfig } from '../types/config.types';
import { DEFAULT_GAME_CONFIG } from '../constants/config.defaults';
import { processGridTick } from '../logic/gameLoop';

interface Params {
  gameState: GameState;
  setGrid: React.Dispatch<React.SetStateAction<Cell[]>>;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  setNow: React.Dispatch<React.SetStateAction<number>>;
  setRespawningFarmers: React.Dispatch<React.SetStateAction<number[]>>;
  respawningRef: React.MutableRefObject<number[]>;
  gameConfig?: GameConfig;
}

export const useGameLoop = ({
  gameState,
  setGrid,
  setInventory,
  setNow,
  setRespawningFarmers,
  respawningRef,
  gameConfig = DEFAULT_GAME_CONFIG,
}: Params) => {
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const now = Date.now();
      setNow(now);

      setGrid(prevGrid => {
        const { newGrid, rewards, deadFarmers, gridChanged } = processGridTick(prevGrid, now, gameConfig);

        if (gridChanged && Object.keys(rewards).length > 0) {
          setTimeout(() => {
            setInventory(prev => {
              const next = { ...prev };
              (Object.keys(rewards) as Array<keyof Inventory>).forEach(k => {
                next[k] = (next[k] as number) + (rewards[k] as number);
              });
              return next;
            });
          }, 0);
        }

        if (deadFarmers > 0) {
          setTimeout(() => {
            setRespawningFarmers(prev => {
              const next = [...prev];
              for (let i = 0; i < deadFarmers; i++) next.push(now + 40000);
              return next;
            });
          }, 0);
        }

        return gridChanged ? newGrid : prevGrid;
      });

      // Respawn cittadini
      let respawnChanged = false;
      const filtered = respawningRef.current.filter(time => {
        if (now >= time) { respawnChanged = true; return false; }
        return true;
      });
      if (respawnChanged) setRespawningFarmers(filtered);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, gameConfig]);
};
