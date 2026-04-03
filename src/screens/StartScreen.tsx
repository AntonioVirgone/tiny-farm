import React, { useState } from 'react';
import { BookMarked, Play, RefreshCw } from 'lucide-react';
import TutorialModal from '../components/modals/TutorialModal';

interface Props {
  hasSave: boolean;
  onNewGame: () => void;
  onLoadGame: () => void;
}

const StartScreen: React.FC<Props> = ({ hasSave, onNewGame, onLoadGame }) => {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="fullscreen-menu">
      <div className="start-logo">🌾</div>
      <h1>Tiny Farm</h1>
      <p className="subtitle">Village Builder</p>
      <p>
        Espandi il tuo insediamento, raccogli risorse, commercia nel mercato e affronta l'ignoto. Le tue decisioni contano — se perdi tutti i cittadini, è game over.
      </p>

      <div className="fullscreen-menu settings-btn-group">
        {hasSave && (
          <button className="btn-start" style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }} onClick={onLoadGame}>
            <Play size={22} /> Continua Partita
          </button>
        )}
        <button className="btn-start" onClick={onNewGame}>
          {hasSave ? <RefreshCw size={22} /> : <Play size={22} />}
          {hasSave ? 'Nuova Partita' : 'Inizia a Giocare'}
        </button>
        <button className="btn-start" style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} onClick={() => setShowTutorial(true)}>
          <BookMarked size={22} /> Tutorial & Regole
        </button>
      </div>

      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </div>
  );
};

export default StartScreen;