import React from 'react';
import { Coins, Moon, Skull, Sun, Users, Zap } from 'lucide-react';

interface Props {
  coins: number;
  totalFarmers: number;
  respawningCount: number;
  actionsLeft: number;
  dayCount: number;
  isNight: boolean;
}

const HUD: React.FC<Props> = ({ coins, totalFarmers, respawningCount, actionsLeft, dayCount, isNight }) => (
  <div className={`hud-wrapper ${isNight ? 'night' : ''}`}>
    <div className="hud-title-row">
      <span className="hud-game-title">🌾 Tiny Farm</span>
      <div className="hud-day-badge">
        {isNight ? <Moon size={14} color="#94a3b8" /> : <Sun size={14} color="#fde047" />}
        {isNight ? 'Notte' : `Giorno ${dayCount}`}
      </div>
    </div>
    <div className="hud-main-stats">
      <div className="stat-card gold">
        <span className="stat-card-label">Monete</span>
        <div className="stat-card-value"><Coins size={15} /> {coins.toLocaleString()}</div>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">Popolazione</span>
        <div className="stat-card-value">
          <Users size={15} color="#60a5fa" />
          {totalFarmers}
          {respawningCount > 0 && (
            <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px' }}>
              <Skull size={11} />{respawningCount}
            </span>
          )}
        </div>
      </div>
      <div className={`stat-card ${actionsLeft > 0 && !isNight ? 'highlight' : ''}`}>
        <span className="stat-card-label">Azioni</span>
        <div className="stat-card-value">
          <Zap size={15} color={isNight ? '#475569' : '#fbbf24'} />
          <span style={{ color: isNight ? '#475569' : undefined }}>{actionsLeft}/{totalFarmers}</span>
        </div>
      </div>
    </div>
  </div>
);

export default HUD;