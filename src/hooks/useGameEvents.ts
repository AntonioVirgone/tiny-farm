import { useEffect } from 'react';
import { BASE_INITIAL_FARMERS, COSTS } from '../constants/game.constants';
import type { Cell, GameState, Toast } from '../types/game.types';

interface Params {
  gameState: GameState;
  gridRef: React.MutableRefObject<Cell[]>;
  respawningRef: React.MutableRefObject<number[]>;
  setGrid: React.Dispatch<React.SetStateAction<Cell[]>>;
  setRespawningFarmers: React.Dispatch<React.SetStateAction<number[]>>;
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
}

export const useGameEvents = ({
  gameState, gridRef, respawningRef, setGrid, setRespawningFarmers, setToasts,
}: Params) => {
  useEffect(() => {
    if (gameState !== 'playing') return;

    const eventInterval = setInterval(() => {
      const currentGrid = gridRef.current;
      const currentRespawning = respawningRef.current;
      const currentPorts = currentGrid.filter(c => c.type === 'port').length;
      const currentBaseFarmers = BASE_INITIAL_FARMERS +
        currentGrid.filter(c => c.type === 'house').length * 1 +
        currentGrid.filter(c => c.type === 'village').length * 6 +
        currentGrid.filter(c => c.type === 'city').length * 30 +
        currentGrid.filter(c => c.type === 'county').length * 100;

      const currentTotalFarmers = Math.max(0, currentBaseFarmers - (currentPorts * COSTS.port.farmers) - currentRespawning.length);
      if (currentTotalFarmers <= 0) return;

      let eventTriggered = false;
      let eventMessage = '';

      const diseaseProb = Math.min(0.90, 0.05 + (currentTotalFarmers - 1) * 0.0447);
      const wolfSpawnProb = 0.25;
      const banditsProb = currentPorts > 0 ? 0.30 : 0;

      if (Math.random() < diseaseProb) {
        eventTriggered = true;
        eventMessage = "Un'improvvisa malattia ha colpito un cittadino!";
        setRespawningFarmers(prev => [...prev, Date.now() + 40000]);
      } else if (Math.random() < wolfSpawnProb) {
        const emptyGrass = currentGrid.map((c, i) => c.type === 'grass' && !c.busyUntil && c.pendingAction === null ? i : -1).filter(i => i !== -1);
        if (emptyGrass.length > 0) {
          const target = emptyGrass[Math.floor(Math.random() * emptyGrass.length)];
          setGrid(prev => {
            const next = [...prev];
            next[target] = { ...next[target], type: 'wolf', wolfCount: 1 };
            return next;
          });
          eventTriggered = true;
          eventMessage = 'Dei lupi affamati sono scesi dalle montagne!';
        }
      } else if (banditsProb > 0 && Math.random() < banditsProb) {
        eventTriggered = true;
        eventMessage = "Dei banditi giunti via mare hanno assalito l'insediamento!";
        setRespawningFarmers(prev => [...prev, Date.now() + 40000]);
      }

      if (eventTriggered) {
        const eventId = 'evt-' + Date.now();
        setToasts(prev => [...prev, { id: eventId, title: eventMessage, type: 'danger' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== eventId)), 5000);
      }
    }, 45000);

    return () => clearInterval(eventInterval);
  }, [gameState]);
};