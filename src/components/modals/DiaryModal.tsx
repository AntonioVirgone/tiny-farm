import React from 'react';
import { BookMarked, CheckCircle, Lock, X } from 'lucide-react';
import type { QuestDefinition } from '../../types/game.types';

interface Props {
  quests: QuestDefinition[];
  completedQuests: string[];
  onClose: () => void;
}

const DiaryModal: React.FC<Props> = ({ quests, completedQuests, onClose }) => {
  const firstIncompleteIndex = quests.findIndex(q => !completedQuests.includes(q.id));

  return (
    <div className="action-modal-overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div className="action-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookMarked color="#a855f7" /> Diario di Viaggio
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            Segui queste indicazioni per espandere il tuo impero. Progredisci sbloccando nuove conoscenze.
          </p>
          {quests.map((quest, idx) => {
            const isCompleted = completedQuests.includes(quest.id);
            const isActive = idx === firstIncompleteIndex;
            const isLocked = idx > firstIncompleteIndex;

            let statusClass = 'locked';
            if (isCompleted) statusClass = 'done';
            else if (isActive) statusClass = 'active';

            return (
              <div key={quest.id} className={`diary-item ${statusClass}`}>
                <div className="diary-icon-wrap">
                  {isLocked ? <Lock size={24} /> : <quest.icon size={24} />}
                </div>
                <div className="diary-content">
                  <div className="diary-title">
                    {isLocked ? 'Obiettivo Sconosciuto' : quest.title}
                    {isCompleted && <CheckCircle size={16} color="#15803d" style={{ marginLeft: 'auto' }} />}
                  </div>
                  {!isLocked && (
                    <>
                      <div className="diary-desc">{quest.desc}</div>
                      <div className="diary-goal">{quest.goal}</div>
                    </>
                  )}
                  {isLocked && <div className="diary-desc">Completa gli obiettivi precedenti per sbloccare.</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiaryModal;