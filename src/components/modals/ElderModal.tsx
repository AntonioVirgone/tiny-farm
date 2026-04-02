import React from 'react';
import { Sparkles, Users, X } from 'lucide-react';

interface Props {
  isThinking: boolean;
  message: string;
  onClose: () => void;
}

const ElderModal: React.FC<Props> = ({ isThinking, message, onClose }) => (
  <div className="action-modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
    <div className="action-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles color="#8b5cf6" /> L'Anziano del Villaggio
        </h3>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} color="#64748b" />
        </button>
      </div>
      <div className="modal-body">
        <div className="elder-chat-box">
          <div className="elder-avatar">
            <Users size={32} />
          </div>
          <div className="elder-text">
            {isThinking ? (
              <span className="loading-dots">L'Anziano sta scrutando i presagi</span>
            ) : (
              <p style={{ margin: 0 }}>"{message}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ElderModal;