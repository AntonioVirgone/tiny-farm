import React from 'react';
import {
  Apple, Bone, Box, Carrot, Fish, Gem, Layers, Leaf,
  Mountain, Package, PawPrint, Sprout, TreePine, Wheat, X,
} from 'lucide-react';
import type { Inventory } from '../../types/game.types';

interface Props {
  inventory: Inventory;
  totalAnimals: number;
  onClose: () => void;
}

const InventoryModal: React.FC<Props> = ({ inventory, totalAnimals, onClose }) => (
  <div className="action-modal-overlay" style={{ zIndex: 60 }} onClick={onClose}>
    <div className="action-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package color="#3b82f6" /> Il Tuo Zaino
        </h3>
        <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
          <X size={20} color="#64748b" />
        </button>
      </div>
      <div className="modal-body">
        <h4 className="market-section-title">Materie Prime & Lavorati</h4>
        <div className="inventory-grid">
          <div className="inventory-card"><TreePine size={28} color="#4ade80" /><div className="inventory-val">{inventory.wood}</div><span className="inventory-name">Legna</span></div>
          <div className="inventory-card"><Mountain size={28} color="#94a3b8" /><div className="inventory-val">{inventory.stone}</div><span className="inventory-name">Pietra</span></div>
          <div className="inventory-card"><Box size={28} color="#fb923c" /><div className="inventory-val">{inventory.planks}</div><span className="inventory-name">Assi</span></div>
          <div className="inventory-card"><Layers size={28} color="#cbd5e1" /><div className="inventory-val">{inventory.bricks}</div><span className="inventory-name">Mattoni</span></div>
        </div>

        <h4 className="market-section-title">Minerali</h4>
        <div className="inventory-grid">
          <div className="inventory-card"><Gem size={28} color="#94a3b8" /><div className="inventory-val">{inventory.iron}</div><span className="inventory-name">Ferro</span></div>
          <div className="inventory-card"><Gem size={28} color="#f59e0b" /><div className="inventory-val">{inventory.copper}</div><span className="inventory-name">Rame</span></div>
          <div className="inventory-card"><Gem size={28} color="#fbbf24" /><div className="inventory-val">{inventory.gold}</div><span className="inventory-name">Oro</span></div>
        </div>

        <h4 className="market-section-title">Agricoltura, Cibo & Bestiame</h4>
        <div className="inventory-grid">
          <div className="inventory-card"><Wheat size={28} color="#fde047" /><div className="inventory-val">{inventory.wheat}</div><span className="inventory-name">Grano</span></div>
          <div className="inventory-card"><Apple size={28} color="#f87171" /><div className="inventory-val">{inventory.tomato}</div><span className="inventory-name">Pomodori</span></div>
          <div className="inventory-card"><Carrot size={28} color="#fdba74" /><div className="inventory-val">{inventory.carrot}</div><span className="inventory-name">Carote</span></div>
          <div className="inventory-card"><Leaf size={28} color="#481570" /><div className="inventory-val">{inventory.eggplant}</div><span className="inventory-name">Melanzane</span></div>
          <div className="inventory-card"><Fish size={28} color="#7dd3fc" /><div className="inventory-val">{inventory.fish}</div><span className="inventory-name">Pesce</span></div>
          <div className="inventory-card"><Bone size={28} color="#d97706" /><div className="inventory-val">{inventory.wildMeat}</div><span className="inventory-name">Carne</span></div>
          <div className="inventory-card"><PawPrint size={28} color="#fb7185" /><div className="inventory-val">{totalAnimals}</div><span className="inventory-name">Bestiame</span></div>
        </div>

        <h4 className="market-section-title">Semi di Piantagione</h4>
        <div className="inventory-grid">
          <div className="inventory-card"><Sprout size={28} color="#fde047" /><div className="inventory-val">{inventory.wheatSeeds}</div><span className="inventory-name">S. Grano</span></div>
          <div className="inventory-card"><Sprout size={28} color="#f87171" /><div className="inventory-val">{inventory.tomatoSeeds}</div><span className="inventory-name">S. Pomodoro</span></div>
          <div className="inventory-card"><Sprout size={28} color="#fdba74" /><div className="inventory-val">{inventory.carrotSeeds}</div><span className="inventory-name">S. Carota</span></div>
          <div className="inventory-card"><Sprout size={28} color="#481570" /><div className="inventory-val">{inventory.eggplantSeeds}</div><span className="inventory-name">S. Melanzana</span></div>
        </div>
      </div>
    </div>
  </div>
);

export default InventoryModal;