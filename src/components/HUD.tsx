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
    <div className="hud-main-stats">
      <div className="stat-card gold">
        <span className="stat-card-label">Finanze</span>
        <div className="stat-card-value"><Coins size={16} /> {coins}</div>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">Popolazione</span>
        <div className="stat-card-value">
          <Users size={16} color="#60a5fa" /> {totalFarmers}
          {respawningCount > 0 && (
            <span style={{ marginLeft: '4px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '2px' }} title="Cittadini in recupero">
              <Skull size={12} /> {respawningCount}
            </span>
          )}
        </div>
      </div>
      <div className={`stat-card ${actionsLeft > 0 && !isNight ? 'highlight' : ''}`}>
        <span className="stat-card-label">Azioni Oggi</span>
        <div className="stat-card-value">
          <Zap size={16} color={isNight ? '#64748b' : '#fbbf24'} />
          <span style={{ color: isNight ? '#64748b' : 'inherit' }}>{actionsLeft} / {totalFarmers}</span>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-card-label">Giorno</span>
        <div className="stat-card-value">
          {isNight ? <Moon size={16} color="#94a3b8" /> : <Sun size={16} color="#fde047" />}
          {dayCount}
        </div>
      </div>
    </div>
  </div>
);

export default HUD;