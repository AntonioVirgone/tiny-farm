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
    <button className="btn-elder" onClick={onAskElder}>
      <Sparkles size={16} /> Anziano
    </button>

    <div className="floating-btn-container">
      <button className="floating-btn" style={{ position: 'relative' }} onClick={onOpenDiary}>
        <BookMarked size={20} />
        Diario
        {unreadQuests > 0 && (
          <span className="badge-notification">{unreadQuests}</span>
        )}
      </button>
      <button className="floating-btn" onClick={onOpenInventory}>
        <Package size={20} />
        Zaino
      </button>
      <button className="floating-btn" onClick={onOpenMarket}>
        <Store size={20} />
        Mercato
      </button>
      <button className="floating-btn" onClick={onOpenSettings}>
        <Settings size={20} />
        Opzioni
      </button>
      {actionsLeft > 0 && !isNight && (
        <button className="floating-btn nav-sleep" onClick={onSleep}>
          <Moon size={20} />
          Dormi
        </button>
      )}
    </div>
  </>
);

export default FloatingButtons;