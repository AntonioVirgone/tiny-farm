import { useEffect } from 'react';
import { COSTS } from '../constants/game.constants';
import type { Cell, GameState, Toast } from '../types/game.types';

interface Params {
  gameState: GameState;
  gridRef: React.MutableRefObject<Cell[]>;
  respawningRef: React.MutableRefObject<number[]>;
  setRespawningFarmers: React.Dispatch<React.SetStateAction<number[]>>;
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
}

export const useGameEvents = ({
  gameState, gridRef, respawningRef, setRespawningFarmers, setToasts,
}: Params) => {
  useEffect(() => {
    if (gameState !== 'playing') return;

    const eventInterval = setInterval(() => {
      const currentGrid = gridRef.current;
      const currentRespawning = respawningRef.current;
      const currentPorts = currentGrid.filter(c => c.type === 'port').length;
      const currentBaseFarmers =
        currentGrid.filter(c => c.type === 'house').length * 1 +
        currentGrid.filter(c => c.type === 'village').length * 6 +
        currentGrid.filter(c => c.type === 'city').length * 30 +
        currentGrid.filter(c => c.type === 'county').length * 100;

      const currentTotalFarmers = Math.max(0, currentBaseFarmers - (currentPorts * COSTS.port.farmers) - currentRespawning.length);
      if (currentTotalFarmers <= 0) return;

      const diseaseProb = Math.min(0.90, 0.05 + (currentTotalFarmers - 1) * 0.0447);
      const hasWildAnimals = currentGrid.some(c => c.type === 'wild_animal');
      const wolvesProb = !hasWildAnimals ? 0.40 : 0;
      const banditsProb = currentPorts > 0 ? 0.30 : 0;

      let eventMessage = '';

      if (Math.random() < diseaseProb) {
        eventMessage = "Un'improvvisa malattia ha colpito un cittadino!";
      } else if (wolvesProb > 0 && Math.random() < wolvesProb) {
        eventMessage = 'Senza più prede nella foresta, i lupi hanno attaccato la fattoria!';
      } else if (banditsProb > 0 && Math.random() < banditsProb) {
        eventMessage = 'Dei banditi giunti via mare hanno assalito l\'insediamento!';
      }

      if (eventMessage) {
        setRespawningFarmers(prev => [...prev, Date.now() + 40000]);
        const eventId = 'evt-' + Date.now();
        setToasts(prev => [...prev, { id: eventId, title: eventMessage, type: 'danger' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== eventId)), 5000);
      }
    }, 45000);

    return () => clearInterval(eventInterval);
  }, [gameState]);
};