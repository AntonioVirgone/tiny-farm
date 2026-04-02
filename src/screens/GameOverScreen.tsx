import React from 'react';
import { Skull } from 'lucide-react';

interface Props {
  onRestart: () => void;
}

const GameOverScreen: React.FC<Props> = ({ onRestart }) => (
  <div className="fullscreen-menu">
    <Skull size={80} color="#ef4444" style={{ marginBottom: '20px' }} />
    <h1 className="game-over-title">Game Over</h1>
    <p>
      L'ultimo dei tuoi cittadini ha perso la vita.
      Il tuo insediamento è ora solo una rovina abbandonata, destinata ad essere consumata dalla natura.
    </p>
    <button className="btn-start" onClick={onRestart}>
      Ricomincia Nuova Partita
    </button>
  </div>
);

export default GameOverScreen;