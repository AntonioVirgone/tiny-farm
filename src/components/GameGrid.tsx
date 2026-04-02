import React from 'react';
import { CloudFog, Moon } from 'lucide-react';
import GameCell from './GameCell';
import type { Cell } from '../types/game.types';

interface Props {
  grid: Cell[];
  reachableCells: Set<number>;
  isNight: boolean;
  now: number;
  onCellClick: (cellId: number) => void;
}

const GameGrid: React.FC<Props> = ({ grid, reachableCells, isNight, now, onCellClick }) => (
  <div className="grid-wrapper">
    <div className={`night-overlay ${isNight ? 'active' : ''}`}>
      <div className="night-text">
        <Moon size={48} color="#cbd5e1" />
        Notte in corso...
      </div>
    </div>
    <div className="farming-grid">
      {grid.map(cell => {
        const isReachable = reachableCells.has(cell.id);
        return (
          <div
            key={cell.id}
            className={`cell ${!isReachable ? 'fog' : cell.type} ${cell.busyUntil || cell.pendingAction ? 'busy' : ''}`}
            onClick={() => {
              if (!cell.busyUntil && !cell.pendingAction && !isNight) {
                onCellClick(cell.id);
              }
            }}
          >
            {!isReachable
              ? <CloudFog size={28} color="#f8fafc" opacity={0.8} />
              : <GameCell cell={cell} now={now} />}
          </div>
        );
      })}
    </div>
  </div>
);

export default GameGrid;