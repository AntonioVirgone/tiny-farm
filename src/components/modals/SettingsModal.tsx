import React from 'react';
import { Download, LogOut, Save, Settings, Upload, X } from 'lucide-react';

interface Props {
  isSaving: boolean;
  onSave: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onMainMenu: () => void;
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ isSaving, onSave, onExport, onImportClick, onMainMenu, onClose }) => (
  <div className="action-modal-overlay" style={{ zIndex: 60 }} onClick={onClose}>
    <div className="action-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings color="#475569" /> Menu di Gioco
        </h3>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} color="#64748b" />
        </button>
      </div>
      <div className="modal-body">
        <button className="action-btn" style={{ background: '#10b981', color: 'white' }} disabled={isSaving} onClick={() => { onSave(); onClose(); }}>
          <Save size={20} /> Salva Partita
        </button>
        <button className="action-btn" style={{ background: '#3b82f6', color: 'white' }} onClick={() => { onExport(); onClose(); }}>
          <Download size={20} /> Esporta Salvataggio (.json)
        </button>
        <button className="action-btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => { onImportClick(); onClose(); }}>
          <Upload size={20} /> Importa Salvataggio (.json)
        </button>
        <button className="action-btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => { onMainMenu(); onClose(); }}>
          <LogOut size={20} /> Torna al Menu Principale
        </button>
      </div>
    </div>
  </div>
);

export default SettingsModal;