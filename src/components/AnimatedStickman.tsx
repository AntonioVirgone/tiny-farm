import React from 'react';
import type { ActionType } from '../types/game.types';

interface Props {
  action: ActionType;
}

const AnimatedStickman: React.FC<Props> = ({ action }) => {
  if (!action) return null;

  const isStriking = ['chopping', 'mining', 'spawn_rock', 'active_forest'].includes(action) || action.startsWith('building_');
  const isFarming = ['plowing', 'harvesting', 'crafting_planks', 'crafting_bricks'].includes(action) || action.startsWith('planting_');
  const isHunting = action === 'hunting';

  return (
    <svg viewBox="0 0 100 100" style={{ width: '42px', height: '42px', position: 'absolute', top: '0', zIndex: 10, pointerEvents: 'none' }}>
      <circle cx="50" cy="25" r="9" fill="#fcd34d" stroke="#b45309" strokeWidth="2" />
      <path d="M 35 20 Q 50 10 65 20" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="50" y1="34" x2="50" y2="60" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="58" x2="38" y2="85" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="58" x2="62" y2="85" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="40" x2="38" y2="55" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
      <g className={isStriking ? 'anim-strike' : isHunting ? 'anim-hunt' : 'anim-farm'} style={{ transformOrigin: '50px 40px' }}>
        <line x1="50" y1="40" x2="68" y2="48" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        {isStriking && (
          <g transform="translate(68, 48) rotate(20)">
            <line x1="0" y1="-15" x2="0" y2="20" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            {action === 'chopping' || action === 'active_forest' ? (
              <path d="M -5 -10 L 12 -15 L 12 5 L -5 0 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            ) : action === 'mining' || action === 'spawn_rock' ? (
              <path d="M -12 -5 Q 0 -15 12 -5 L 0 5 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
            ) : (
              <rect x="-8" y="-12" width="16" height="8" rx="2" fill="#64748b" />
            )}
          </g>
        )}
        {isFarming && (
          <g transform="translate(68, 48) rotate(0)">
            <line x1="0" y1="-10" x2="0" y2="25" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            {action === 'plowing' ? (
              <path d="M -5 20 L 8 20 L 8 25 L -5 25 Z" fill="#64748b" />
            ) : action === 'harvesting' ? (
              <path d="M 0 -5 C 15 -5 15 15 0 20 C 5 10 5 0 0 -5 Z" fill="#cbd5e1" />
            ) : (
              <circle cx="0" cy="25" r="3" fill="#4ade80" />
            )}
          </g>
        )}
        {isHunting && (
          <g transform="translate(68, 48) rotate(-45)">
            <line x1="0" y1="-25" x2="0" y2="25" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            <polygon points="-4,-25 4,-25 0,-35" fill="#cbd5e1" />
          </g>
        )}
      </g>
    </svg>
  );
};

export default AnimatedStickman;