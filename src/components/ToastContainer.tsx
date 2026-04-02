import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Toast } from '../types/game.types';

interface Props {
  toasts: Toast[];
}

const ToastContainer: React.FC<Props> = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast ${t.type === 'danger' ? 'toast-danger' : ''}`}>
        {t.type === 'danger'
          ? <AlertTriangle size={24} />
          : <CheckCircle size={24} color="#064e3b" />}
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8 }}>
            {t.type === 'danger' ? 'Avviso Pericolo' : 'Notifica'}
          </div>
          <div>{t.title}</div>
        </div>
      </div>
    ))}
  </div>
);

export default ToastContainer;