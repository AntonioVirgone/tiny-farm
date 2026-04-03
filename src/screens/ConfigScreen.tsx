import React, { useState } from 'react';
import { RotateCcw, Save, X } from 'lucide-react';
import type { GameConfig } from '../types/config.types';
import { DEFAULT_GAME_CONFIG } from '../constants/config.defaults';

interface Props {
  config: GameConfig;
  onSave: (config: GameConfig) => void;
  onClose: () => void;
}

type Tab = 'raccolta' | 'colture' | 'tempi' | 'partenza';

const CROP_NAMES = { wheat: 'Grano 🌾', tomato: 'Pomodoro 🍅', carrot: 'Carota 🥕', eggplant: 'Melanzana 🍆' };
const ACTION_LABELS: Record<string, string> = {
  plowing: 'Aratura', planting: 'Semina', harvesting: 'Raccolta',
  chopping: 'Abbattimento albero', mining: 'Estrazione roccia',
  building_house: 'Costruzione casa', hunting: 'Caccia selvatica',
  hunting_wolf: 'Caccia al lupo', harvesting_bush: 'Raccolta cespuglio',
  planting_bush: 'Piantagione cespuglio', planting_tree: 'Piantagione albero',
};

const NumField: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min = 1, max = 9999, step = 1, unit, onChange }) => {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
  };
  return (
    <div className="cfg-field">
      <span className="cfg-label">{label}</span>
      <div className="cfg-control">
        <button className="cfg-btn" onClick={dec}>−</button>
        <input className="cfg-input" type="number" value={value} min={min} max={max} step={step} onChange={handleInput} />
        {unit && <span className="cfg-unit">{unit}</span>}
        <button className="cfg-btn" onClick={inc}>+</button>
      </div>
    </div>
  );
};

const ConfigScreen: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [tab, setTab] = useState<Tab>('raccolta');
  const [draft, setDraft] = useState<GameConfig>(() => JSON.parse(JSON.stringify(config)));

  const set = (path: string[], value: number) => {
    setDraft(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as any;
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSave = () => { onSave(draft); onClose(); };
  const handleReset = () => setDraft(JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG)));

  return (
    <div className="action-modal-overlay" style={{ zIndex: 200, background: 'rgba(15,23,42,0.85)' }} onClick={onClose}>
      <div
        className="action-modal"
        style={{ maxWidth: 560, width: '95vw', color: '#1e293b', textAlign: 'left', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Configura Gioco
          </h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px 12px', flexShrink: 0, borderBottom: '1px solid #e2e8f0' }}>
          {(['raccolta', 'colture', 'tempi', 'partenza'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                background: tab === t ? '#3b82f6' : '#f1f5f9',
                color: tab === t ? '#fff' : '#475569',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body cfg-body" style={{ overflowY: 'auto', flex: 1 }}>

          {tab === 'raccolta' && (
            <div className="cfg-section">
              <div className="cfg-group-title">🪓 Taglio Albero</div>
              <NumField label="Legno minimo" value={draft.choppingWoodMin} min={1} max={50} onChange={v => set(['choppingWoodMin'], v)} />
              <NumField label="Legno massimo" value={draft.choppingWoodMax} min={draft.choppingWoodMin} max={50} onChange={v => set(['choppingWoodMax'], v)} />

              <div className="cfg-group-title" style={{ marginTop: 16 }}>🌲 Foresta (per tick)</div>
              <NumField label="Legno per tick" value={draft.forestWoodPerTick} min={1} max={20} onChange={v => set(['forestWoodPerTick'], v)} />

              <div className="cfg-group-title" style={{ marginTop: 16 }}>🐟 Pesca</div>
              <NumField label="Pesce per tick" value={draft.fishPerTick} min={1} max={20} onChange={v => set(['fishPerTick'], v)} />

              <div className="cfg-group-title" style={{ marginTop: 16 }}>🫐 Raccolta Cespuglio</div>
              <NumField label="Bacche raccolte" value={draft.bushBerriesAmount} min={1} max={20} onChange={v => set(['bushBerriesAmount'], v)} />
              <NumField label="Semi raccolti" value={draft.bushSeedsAmount} min={0} max={10} onChange={v => set(['bushSeedsAmount'], v)} />
            </div>
          )}

          {tab === 'colture' && (
            <div className="cfg-section">
              {(Object.keys(CROP_NAMES) as Array<keyof typeof CROP_NAMES>).map(cropId => (
                <div key={cropId} style={{ marginBottom: 20 }}>
                  <div className="cfg-group-title">{CROP_NAMES[cropId]}</div>
                  <NumField label="Costo seme (monete)" value={draft.crops[cropId].seedCost} min={1} max={500}
                    onChange={v => set(['crops', cropId, 'seedCost'], v)} />
                  <NumField label="Tempo crescita" value={Math.round(draft.crops[cropId].growthTime / 1000)} min={1} max={300} unit="s"
                    onChange={v => set(['crops', cropId, 'growthTime'], v * 1000)} />
                  <NumField label="Resa minima" value={draft.crops[cropId].minYield} min={1} max={50}
                    onChange={v => set(['crops', cropId, 'minYield'], v)} />
                  <NumField label="Resa massima" value={draft.crops[cropId].maxYield} min={draft.crops[cropId].minYield} max={50}
                    onChange={v => set(['crops', cropId, 'maxYield'], v)} />
                  <NumField label="Prezzo vendita" value={draft.crops[cropId].sellPrice} min={1} max={1000} unit="💰"
                    onChange={v => set(['crops', cropId, 'sellPrice'], v)} />
                </div>
              ))}
            </div>
          )}

          {tab === 'tempi' && (
            <div className="cfg-section">
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>Durata delle azioni in secondi.</p>
              {(Object.keys(ACTION_LABELS) as Array<keyof typeof ACTION_LABELS>).map(key => (
                <NumField
                  key={key}
                  label={ACTION_LABELS[key]}
                  value={Math.round(draft.actionTimes[key as keyof typeof draft.actionTimes] / 1000)}
                  min={1} max={300} unit="s"
                  onChange={v => set(['actionTimes', key], v * 1000)}
                />
              ))}
            </div>
          )}

          {tab === 'partenza' && (
            <div className="cfg-section">
              <div className="cfg-group-title">🏁 Risorse Iniziali</div>
              <NumField label="Monete iniziali" value={draft.initialCoins} min={0} max={99999} step={50}
                onChange={v => set(['initialCoins'], v)} />
              <NumField label="Semi di grano iniziali" value={draft.initialWheatSeeds} min={0} max={50}
                onChange={v => set(['initialWheatSeeds'], v)} />
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
                Le modifiche alle risorse iniziali vengono applicate solo nelle nuove partite.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e2e8f0', flexShrink: 0, justifyContent: 'flex-end' }}>
          <button
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#64748b' }}
          >
            <RotateCcw size={14} /> Ripristina default
          </button>
          <button
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <Save size={14} /> Salva Configurazione
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;
