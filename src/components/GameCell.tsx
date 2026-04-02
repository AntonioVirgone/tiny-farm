import React from 'react';
import {
  Anchor, Castle, Droplets, Factory, Fish, Home, Landmark,
  Mountain, Pickaxe, Rabbit, Sprout, Tent, TreePine, Warehouse,
} from 'lucide-react';
import AnimatedStickman from './AnimatedStickman';
import { CROPS } from '../constants/game.constants';
import type { Cell } from '../types/game.types';

interface Props {
  cell: Cell;
  now: number;
}

const GameCell: React.FC<Props> = ({ cell, now }) => {
  if (cell.type === 'mine' && cell.pendingAction === 'active_mine') {
    const progress = ((cell.mineTicks || 0) / 12) * 100;
    return (
      <div className="progress-container">
        <div style={{ position: 'relative', marginTop: '-5px' }}>
          <Mountain size={28} color="#475569" fill="#334155" />
          <Pickaxe size={16} color="#fbbf24" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#3b82f6' }} />
        </div>
      </div>
    );
  }

  if (cell.type === 'forest' && cell.pendingAction === 'active_forest') {
    const progress = ((cell.forestTicks || 0) / 4) * 100;
    return (
      <div className="progress-container">
        <AnimatedStickman action="active_forest" />
        <div style={{ position: 'relative', marginTop: '10px', display: 'flex', gap: '-5px', opacity: 0.3, transform: 'scale(1.2)' }}>
          <TreePine size={28} color="#14532d" fill="#166534" />
          <TreePine size={28} color="#14532d" fill="#166534" style={{ marginLeft: '-10px' }} />
        </div>
        <div className="progress-bar-bg" style={{ bottom: '4px', position: 'absolute' }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#4ade80' }} />
        </div>
      </div>
    );
  }

  if (cell.type === 'water' && cell.pendingAction === 'fishing') {
    const timeSinceLastTick = now - (cell.lastTickTime || now);
    const progress = Math.min(100, (timeSinceLastTick / 10000) * 100);
    return (
      <div className="progress-container">
        <Fish size={20} color="#0284c7" className="animate-bounce-slow" style={{ marginTop: '-5px' }} />
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#fbbf24' }} />
        </div>
      </div>
    );
  }

  if (cell.type === 'animal_farm') {
    const isReproducing = cell.reproductionTargetTime != null;
    const progress = isReproducing
      ? 100 - Math.max(0, Math.min(100, ((cell.reproductionTargetTime! - now) / 20000) * 100))
      : 0;
    return (
      <div className="progress-container">
        <div style={{ position: 'relative', marginTop: '-5px' }}>
          <Warehouse size={28} color="#991b1b" fill="#b91c1c" />
          <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'white', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '1px solid #ccc', color: '#fb7185', width: '16px', height: '16px' }}>
            {cell.animalCount}
          </div>
        </div>
        {isReproducing && (
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#fb7185' }} />
          </div>
        )}
      </div>
    );
  }

  if (cell.busyUntil && cell.busyTotalDuration) {
    const timeLeft = cell.busyUntil - now;
    const progress = 100 - Math.max(0, Math.min(100, (timeLeft / cell.busyTotalDuration) * 100));
    const isPassive = cell.pendingAction === 'growing';
    const isPlayerAction = cell.pendingAction && !['growing', 'fishing', 'active_mine', 'active_forest'].includes(cell.pendingAction);

    return (
      <div className="progress-container">
        {isPlayerAction && <AnimatedStickman action={cell.pendingAction} />}
        <div style={{ position: 'absolute', top: '15px', zIndex: 1, opacity: isPlayerAction ? 0.25 : 0.8, transform: isPlayerAction ? 'scale(1.4)' : 'scale(1)' }}>
          {cell.pendingAction === 'plowing' && <img src="" alt="" style={{ display: 'none' }} />}
          {cell.pendingAction === 'plowing' && <span>🚜</span>}
          {cell.pendingAction?.startsWith('planting_') && cell.pendingAction !== 'planting_forest' && cell.pendingAction !== 'planting_tree' && <Sprout size={24} color="#15803d" />}
          {cell.pendingAction === 'planting_tree' && <TreePine size={24} color="#14532d" />}
          {cell.pendingAction === 'planting_forest' && <div style={{ display: 'flex' }}><TreePine size={18} color="#14532d" /><TreePine size={18} color="#14532d" style={{ marginLeft: '-5px' }} /></div>}
          {cell.pendingAction === 'spawn_rock' && <Mountain size={24} color="#475569" />}
          {cell.pendingAction === 'harvesting' && cell.cropType && React.createElement(CROPS[cell.cropType].icon, { size: 24, color: '#1e293b' })}
          {cell.pendingAction === 'chopping' && <span>🪓</span>}
          {cell.pendingAction === 'mining' && <Pickaxe size={24} color="#475569" />}
          {cell.pendingAction === 'building_house' && <Home size={24} color="#1e293b" />}
          {cell.pendingAction === 'building_village' && <Tent size={24} color="#1e40af" />}
          {cell.pendingAction === 'building_city' && <Castle size={24} color="#581c87" />}
          {cell.pendingAction === 'building_county' && <Landmark size={24} color="#831843" />}
          {cell.pendingAction === 'building_mine' && <span>🔨</span>}
          {cell.pendingAction === 'building_animal_farm' && <Warehouse size={24} color="#b91c1c" />}
          {cell.pendingAction === 'building_lumber_mill' && <Factory size={24} color="#451a03" />}
          {cell.pendingAction === 'building_stone_mason' && <Factory size={24} color="#334155" />}
          {cell.pendingAction === 'building_port' && <Anchor size={24} color="#1e3a8a" />}
          {cell.pendingAction === 'crafting_planks' && <span>📦</span>}
          {cell.pendingAction === 'crafting_bricks' && <span>🧱</span>}
          {cell.pendingAction === 'hunting' && <span>🎯</span>}
          {isPassive && cell.cropType && React.createElement(CROPS[cell.cropType].icon, { size: 24, color: CROPS[cell.cropType].color })}
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: isPassive ? '#4ade80' : '#fbbf24' }} />
        </div>
      </div>
    );
  }

  switch (cell.type) {
    case 'grass': return null;
    case 'water': return <Droplets size={26} color="#38bdf8" fill="#7dd3fc" opacity={0.6} />;
    case 'tree': return <TreePine size={28} color="#14532d" fill="#166534" />;
    case 'forest': return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TreePine size={28} color="#14532d" fill="#166534" />
        <TreePine size={28} color="#14532d" fill="#166534" style={{ marginLeft: '-10px' }} />
      </div>
    );
    case 'rock': return <Mountain size={26} color="#475569" fill="#64748b" />;
    case 'house': return <Home size={30} color="#0f172a" fill="#1e293b" />;
    case 'village': return <Tent size={32} color="#1e3a8a" fill="#3b82f6" />;
    case 'city': return <Castle size={32} color="#4c1d95" fill="#7c3aed" />;
    case 'county': return <Landmark size={32} color="#701a75" fill="#db2777" />;
    case 'lumber_mill': return <Factory size={28} color="#78350f" fill="#92400e" />;
    case 'stone_mason': return <Factory size={28} color="#334155" fill="#475569" />;
    case 'port': return <Anchor size={30} color="#1e3a8a" fill="#3b82f6" />;
    case 'plowed': return null;
    case 'ready': {
      if (!cell.cropType) return null;
      const CropIcon = CROPS[cell.cropType].icon;
      return <CropIcon size={28} color={CROPS[cell.cropType].color} className="animate-bounce-slow" />;
    }
    case 'wild_animal': return (
      <div style={{ position: 'relative' }}>
        <Rabbit size={28} color="#78350f" fill="#b45309" />
        {cell.wildAnimalCount! > 1 && (
          <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'white', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '1px solid #ccc', color: '#b45309', width: '16px', height: '16px' }}>
            {cell.wildAnimalCount}
          </div>
        )}
      </div>
    );
    default: return null;
  }
};

export default GameCell;