import React from 'react';
import { Moon } from 'lucide-react';
import GameCell from './GameCell';
import type { Cell } from '../types/game.types';

interface Props {
  grid: Cell[];
  reachableCells: Set<number>;
  selectedCell: number | null;
  isNight: boolean;
  now: number;
  onCellClick: (cellId: number) => void;
}

const GameGrid: React.FC<Props> = ({ grid, reachableCells, selectedCell, isNight, now, onCellClick }) => (
  <div className="grid-wrapper">
    <div className={`night-overlay ${isNight ? 'active' : ''}`}>
      <div className="night-stars" />
      <div className="night-text">
        <Moon size={44} color="#94a3b8" />
        Notte in corso...
      </div>
    </div>
    <div className="farming-grid">
      {grid.map(cell => {
        const isReachable = reachableCells.has(cell.id);
        const isSelected = selectedCell === cell.id;
        return (
          <div
            key={cell.id}
            className={`cell ${!isReachable ? 'fog' : cell.type} ${cell.busyUntil || cell.pendingAction ? 'busy' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              if (!cell.busyUntil && !cell.pendingAction && !isNight) {
                onCellClick(cell.id);
              }
            }}
          >
            {!isReachable
              ? null
              : <GameCell cell={cell} now={now} />}
          </div>
        );
      })}
    </div>
  </div>
);

export default GameGrid;