import React, { useState } from 'react';
import { BookMarked, Play } from 'lucide-react';
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
      <h1>Fattoria Avanzata</h1>
      <p>
        Espandi il tuo insediamento, estrai minerali preziosi, commercia nel mercato e affronta l'ignoto costruendo porti.
        <br /><br />
        <strong>Attenzione:</strong> Le tue decisioni contano. Il gioco include eventi casuali pericolosi. Se perdi tutti i tuoi cittadini, la partita terminerà!
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
        {hasSave && (
          <button className="btn-start" style={{ background: '#10b981' }} onClick={onLoadGame}>
            <Play size={28} /> Continua Partita
          </button>
        )}
        <button className="btn-start" onClick={onNewGame}>
          <Play size={28} /> {hasSave ? 'Nuova Partita' : 'Inizia Partita'}
        </button>
        <button className="btn-start" style={{ background: '#64748b' }} onClick={() => setShowTutorial(true)}>
          <BookMarked size={28} /> Tutorial & Regole
        </button>
      </div>

      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </div>
  );
};

export default StartScreen;