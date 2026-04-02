import React from 'react';
import { Bone, Box, Coins, Fish, Gem, Layers, Mountain, PawPrint, Sprout, Store, TreePine, X } from 'lucide-react';
import { CROPS } from '../../constants/game.constants';
import type { CropId, Inventory } from '../../types/game.types';

interface Props {
  inventory: Inventory;
  totalAnimals: number;
  onBuySeed: (cropId: CropId) => void;
  onSellResource: (itemKey: keyof Inventory, amount: number, price: number) => void;
  onSellAnimals: (amount: number, price: number) => void;
  onClose: () => void;
}

const MarketModal: React.FC<Props> = ({ inventory, totalAnimals, onBuySeed, onSellResource, onSellAnimals, onClose }) => (
  <div className="action-modal-overlay" style={{ zIndex: 60 }} onClick={onClose}>
    <div className="action-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Store color="#10b981" /> Mercato
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', padding: '6px 12px', borderRadius: '12px', color: '#b45309', fontWeight: '800', border: '1px solid #fde68a' }}>
            <Coins size={16} color="#fbbf24" /> {inventory.coins}
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>
      </div>
      <div className="modal-body">
        <div className="market-section-title">Compra Semi</div>
        {(Object.keys(CROPS) as CropId[]).map(key => {
          const crop = CROPS[key];
          const currentSeeds = inventory[`${crop.id}Seeds` as keyof Inventory] as number;
          return (
            <div className="market-item" key={`buy-${crop.id}`}>
              <div className="market-item-info">
                <Sprout size={24} color={crop.color} />
                <div>
                  <strong>Semi di {crop.name}</strong>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginLeft: '6px' }}>(Hai: {currentSeeds})</span>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Cresce in {crop.growthTime / 1000}s</div>
                </div>
              </div>
              <button className="btn-buy" onClick={() => onBuySeed(crop.id)} disabled={inventory.coins < crop.seedCost}>
                {crop.seedCost} <Coins size={12} style={{ display: 'inline' }} />
              </button>
            </div>
          );
        })}

        <div className="market-section-title">Vendi Animali & Pesce</div>
        <div className="market-item">
          <div className="market-item-info">
            <Bone size={24} color="#b45309" />
            <div><strong>Carne Selvatica ({inventory.wildMeat})</strong><div style={{ fontSize: '12px', color: '#64748b' }}>+250 monete/cad.</div></div>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn-sell" onClick={() => onSellResource('wildMeat', 1, 250)} disabled={inventory.wildMeat < 1}>1x</button>
            <button className="btn-sell-all" onClick={() => onSellResource('wildMeat', inventory.wildMeat, 250)} disabled={inventory.wildMeat < 1}>Tutto</button>
          </div>
        </div>
        <div className="market-item">
          <div className="market-item-info">
            <PawPrint size={24} color="#fb7185" />
            <div><strong>Bestiame ({totalAnimals})</strong><div style={{ fontSize: '12px', color: '#64748b' }}>+100 monete/cad. <span style={{ color: '#ef4444' }}>(Min. 2)</span></div></div>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn-sell" onClick={() => onSellAnimals(1, 100)} disabled={totalAnimals <= 2}>1x</button>
            <button className="btn-sell-all" onClick={() => onSellAnimals(Math.max(0, totalAnimals - 2), 100)} disabled={totalAnimals <= 2}>Tutto</button>
          </div>
        </div>
        <div className="market-item">
          <div className="market-item-info">
            <Fish size={24} color="#7dd3fc" />
            <div><strong>Pesce ({inventory.fish})</strong><div style={{ fontSize: '12px', color: '#64748b' }}>+20 monete/cad.</div></div>
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn-sell" onClick={() => onSellResource('fish', 1, 20)} disabled={inventory.fish < 1}>1x</button>
            <button className="btn-sell-all" onClick={() => onSellResource('fish', inventory.fish, 20)} disabled={inventory.fish < 1}>Tutto</button>
          </div>
        </div>

        <div className="market-section-title">Vendi Raccolto</div>
        {(Object.keys(CROPS) as CropId[]).map(key => {
          const crop = CROPS[key];
          const qty = inventory[crop.id as keyof Inventory] as number;
          return (
            <div className="market-item" key={`sell-${crop.id}`}>
              <div className="market-item-info">
                {React.createElement(crop.icon, { size: 24, color: crop.color })}
                <div><strong>{crop.name} ({qty})</strong><div style={{ fontSize: '12px', color: '#64748b' }}>+{crop.sellPrice} monete/cad.</div></div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button className="btn-sell" onClick={() => onSellResource(crop.id as keyof Inventory, 1, crop.sellPrice)} disabled={qty < 1}>1x</button>
                <button className="btn-sell-all" onClick={() => onSellResource(crop.id as keyof Inventory, qty, crop.sellPrice)} disabled={qty < 1}>Tutto</button>
              </div>
            </div>
          );
        })}

        <div className="market-section-title">Vendi Materiali</div>
        {([
          { id: 'planks' as keyof Inventory, name: 'Assi di Legno', icon: Box, color: '#d97706', price: 25 },
          { id: 'bricks' as keyof Inventory, name: 'Mattoni', icon: Layers, color: '#cbd5e1', price: 35 },
          { id: 'wood' as keyof Inventory, name: 'Legna', icon: TreePine, color: '#14532d', price: 5 },
          { id: 'stone' as keyof Inventory, name: 'Pietra', icon: Mountain, color: '#475569', price: 8 },
        ]).map(mat => (
          <div className="market-item" key={`sell-${mat.id}`}>
            <div className="market-item-info">
              <mat.icon size={24} color={mat.color} />
              <div><strong>{mat.name} ({inventory[mat.id]})</strong><div style={{ fontSize: '12px', color: '#64748b' }}>+{mat.price} monete/cad.</div></div>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="btn-sell" onClick={() => onSellResource(mat.id, 1, mat.price)} disabled={(inventory[mat.id] as number) < 1}>1x</button>
              <button className="btn-sell-all" onClick={() => onSellResource(mat.id, inventory[mat.id] as number, mat.price)} disabled={(inventory[mat.id] as number) < 1}>Tutto</button>
            </div>
          </div>
        ))}

        <div className="market-section-title">Vendi Minerali</div>
        {([
          { id: 'iron' as keyof Inventory, name: 'Ferro', icon: Gem, color: '#94a3b8', price: 40 },
          { id: 'copper' as keyof Inventory, name: 'Rame', icon: Gem, color: '#d97706', price: 80 },
          { id: 'gold' as keyof Inventory, name: 'Oro', icon: Gem, color: '#eab308', price: 200 },
        ]).map(mat => (
          <div className="market-item" key={`sell-${mat.id}`}>
            <div className="market-item-info">
              <mat.icon size={24} color={mat.color} />
              <div><strong>{mat.name} ({inventory[mat.id]})</strong><div style={{ fontSize: '12px', color: '#64748b' }}>+{mat.price} monete/cad.</div></div>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button className="btn-sell" onClick={() => onSellResource(mat.id, 1, mat.price)} disabled={(inventory[mat.id] as number) < 1}>1x</button>
              <button className="btn-sell-all" onClick={() => onSellResource(mat.id, inventory[mat.id] as number, mat.price)} disabled={(inventory[mat.id] as number) < 1}>Tutto</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MarketModal;