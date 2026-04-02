import React from 'react';
import { Info, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const TutorialModal: React.FC<Props> = ({ onClose }) => (
  <div className="action-modal-overlay" style={{ zIndex: 110 }} onClick={onClose}>
    <div className="action-modal" style={{ color: '#1e293b', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info color="#3b82f6" /> Tutorial & Regole
        </h3>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} color="#64748b" />
        </button>
      </div>
      <div className="modal-body" style={{ fontSize: '14px', lineHeight: '1.6' }}>
        <h4 style={{ color: '#3b82f6', marginTop: 0 }}>👥 Cittadini e Azioni (Giorno e Notte)</h4>
        <p>Ogni tuo cittadino rappresenta <strong>1 Azione</strong> al giorno. Costruire un edificio o lavorare la terra consuma le azioni. Se esaurisci tutte le azioni disponibili scenderà automaticamente la notte, costringendo i cittadini a riposare prima del giorno successivo.</p>

        <h4 style={{ color: '#10b981' }}>🏗️ Progressione e Sblocchi</h4>
        <p>Raccogli materiali di base (Legna e Pietra) per sbloccare nuove strutture. Quando raggiungi i requisiti di risorse e popolazione per la prima volta, l'edificio si sbloccherà permanentemente.</p>

        <h4 style={{ color: '#fbbf24' }}>🌫️ Esplorazione e Navigazione</h4>
        <p>Il mare è avvolto dalla nebbia di guerra. Costruisci un <strong>Porto</strong> (che necessita di 5 cittadini come equipaggio fisso) per diradare la nebbia e sbloccare le navi da pesca per il sostentamento.</p>

        <h4 style={{ color: '#ef4444' }}>⚠️ Eventi Casuali e Sopravvivenza</h4>
        <p>Fai molta attenzione! Malattie, branchi di lupi affamati (se stermini gli animali selvatici) e banditi via nave (dopo aver costruito il porto) possono colpire il tuo insediamento. Se la popolazione scende a zero, sarà <strong>Game Over</strong>.</p>
      </div>
    </div>
  </div>
);

export default TutorialModal;