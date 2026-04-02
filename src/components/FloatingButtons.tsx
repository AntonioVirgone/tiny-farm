import React from 'react';
import { BookMarked, Moon, Package, Settings, Sparkles, Store } from 'lucide-react';

interface Props {
  actionsLeft: number;
  isNight: boolean;
  unreadQuests: number;
  onOpenDiary: () => void;
  onOpenInventory: () => void;
  onOpenMarket: () => void;
  onOpenSettings: () => void;
  onSleep: () => void;
  onAskElder: () => void;
}

const FloatingButtons: React.FC<Props> = ({
  actionsLeft, isNight, unreadQuests,
  onOpenDiary, onOpenInventory, onOpenMarket, onOpenSettings, onSleep, onAskElder,
}) => (
  <>
    <button className="floating-btn btn-elder pointer-events-auto" onClick={onAskElder}>
      <Sparkles size={20} /> Anziano
    </button>

    <div className="floating-btn-container">
      <button className="floating-btn btn-diary" style={{ position: 'relative' }} onClick={onOpenDiary}>
        <BookMarked size={16} /> Diario
        {unreadQuests > 0 && (
          <span className="badge-notification">{unreadQuests}</span>
        )}
      </button>
      <button className="floating-btn btn-inventory" onClick={onOpenInventory}>
        <Package size={16} /> Zaino
      </button>
      <button className="floating-btn btn-market" onClick={onOpenMarket}>
        <Store size={16} /> Mercato
      </button>
      <button className="floating-btn btn-settings" onClick={onOpenSettings}>
        <Settings size={16} /> Opzioni
      </button>
      {actionsLeft > 0 && !isNight && (
        <button className="floating-btn btn-sleep" onClick={onSleep}>
          <Moon size={16} /> Dormi
        </button>
      )}
    </div>
  </>
);

export default FloatingButtons;