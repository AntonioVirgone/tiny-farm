import React from 'react';
import {
  Anchor, Axe, Castle, CloudFog, Coins, Crosshair, Dog, Factory,
  Home, Landmark, Mountain, PawPrint, Pickaxe, Rabbit,
  Ship, Shrub, Skull, Sprout, Tent, Tractor, TreePine, Warehouse, X, Zap,
} from 'lucide-react';
import { ACTION_TIMES, COSTS, CROPS } from '../../constants/game.constants';
import type { ActionType, Cell, CropId, Inventory, UnlockedBuildings } from '../../types/game.types';

interface Props {
  cell: Cell;
  isReachable: boolean;
  isAdjacentToWater: boolean;
  inventory: Inventory;
  unlocked: UnlockedBuildings;
  actionsLeft: number;
  availableShips: number;
  totalPorts: number;
  baseFarmers: number;
  respawningCount: number;
  getMergeableCells: (cellId: number, targetType: any) => number[] | null;
  onAction: (cellId: number, action: ActionType) => void;
  onClose: () => void;
}

const CellActionModal: React.FC<Props> = ({
  cell, isReachable, isAdjacentToWater, inventory, unlocked, actionsLeft, availableShips,
  totalPorts, baseFarmers, respawningCount,
  getMergeableCells, onAction, onClose,
}) => {
  const canBuildHouse = inventory.wood >= COSTS.house.wood && inventory.stone >= COSTS.house.stone;
  const canBuildMine = inventory.wood >= COSTS.mine.wood && inventory.coins >= COSTS.mine.coins;
  const canPlantTree = inventory.coins >= COSTS.tree.coins;
  const canPlantForest = inventory.coins >= COSTS.forest.coins && inventory.stone >= COSTS.forest.stone;
  const canSpawnRock = inventory.coins >= COSTS.rock.coins;
  const canBuildAnimalFarm = inventory.wheat >= COSTS.animal_farm.wheat && inventory.wood >= COSTS.animal_farm.wood && inventory.stone >= COSTS.animal_farm.stone && inventory.coins >= COSTS.animal_farm.coins;
  const canBuildLumberMill = inventory.wood >= COSTS.lumber_mill.wood && inventory.stone >= COSTS.lumber_mill.stone && inventory.coins >= COSTS.lumber_mill.coins;
  const canBuildStoneMason = inventory.wood >= COSTS.stone_mason.wood && inventory.stone >= COSTS.stone_mason.stone && inventory.coins >= COSTS.stone_mason.coins;
  const futureFarmersAfterPort = baseFarmers - ((totalPorts + 1) * COSTS.port.farmers) - respawningCount;
  const canBuildPort = inventory.wood >= COSTS.port.wood && inventory.stone >= COSTS.port.stone && inventory.coins >= COSTS.port.coins && futureFarmersAfterPort >= 1;

  const cellTitle = !isReachable ? (
    <><CloudFog size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle', color: '#94a3b8' }} /> Zona Inesplorata</>
  ) : (
    <>
      {cell.type === 'grass' && 'Terreno Libero'}
      {cell.type === 'water' && 'Fiume / Lago'}
      {cell.type === 'plowed' && 'Terreno Arato'}
      {cell.type === 'tree' && 'Albero Alto'}
      {cell.type === 'forest' && 'Bosco Rigoglioso'}
      {cell.type === 'rock' && 'Roccia Solida'}
      {cell.type === 'wild_animal' && 'Animali Selvatici'}
      {cell.type === 'bush' && 'Cespuglio'}
      {cell.type === 'wolf' && 'Branco di Lupi!'}
      {cell.type === 'ready' && 'Raccolto Pronto!'}
      {cell.type === 'growing' && 'Coltura in crescita...'}
      {cell.type === 'mine' && 'Miniera Attiva'}
      {cell.type === 'animal_farm' && 'Fattoria Animali'}
      {cell.type === 'house' && 'Casa del Cittadino'}
      {cell.type === 'village' && 'Villaggio'}
      {cell.type === 'city' && 'Città'}
      {cell.type === 'county' && 'Contea'}
      {cell.type === 'lumber_mill' && 'Segheria'}
      {cell.type === 'stone_mason' && 'Tagliapietre'}
      {cell.type === 'port' && 'Porto'}
    </>
  );

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{cellTitle}</h3>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <div className="modal-body">
          {!isReachable ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
              <CloudFog size={50} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Nebbia Fitta</div>
              <p>Il mare ti blocca il passaggio. Costruisci un <b>Porto</b> sulla terraferma adiacente all'acqua per esplorare.</p>
            </div>
          ) : (
            <>
              {actionsLeft <= 0 && !['growing', 'mine', 'animal_farm', 'water'].includes(cell.type) && !(cell.type === 'forest' && cell.pendingAction === 'active_forest') && (
                <div style={{ padding: '10px', background: '#fef2f2', color: '#ef4444', textAlign: 'center', borderRadius: '12px', marginBottom: '15px', fontWeight: 'bold' }}>
                  Azioni esaurite per oggi!
                </div>
              )}

              {cell.type === 'wild_animal' && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                  <Rabbit size={40} color="#b45309" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                    {cell.wildAnimalCount === 1 ? 'Animale Solitario' : `Branco Selvatico: ${cell.wildAnimalCount} / 10`}
                  </div>
                  <div style={{ fontSize: '13px', margin: '10px 0 20px' }}>
                    {cell.wildAnimalCount === 1 ? 'Cerca un compagno per riprodursi...' :
                      cell.wildAnimalCount! >= 2 && cell.wildAnimalCount! < 10 ? 'Si stanno riproducendo passivamente (50s)...' : 'Capacità massima del branco raggiunta!'}
                  </div>
                  <button className="action-btn" style={{ background: '#c2410c', color: 'white' }} disabled={actionsLeft < 2} onClick={() => onAction(cell.id, 'hunting')}>
                    <Crosshair size={20} /> Caccia ({ACTION_TIMES.hunting / 1000}s)
                    <span className="action-badge" style={{ background: actionsLeft >= 2 ? 'rgba(255,255,255,0.2)' : '#ef4444', padding: '4px 6px' }}>
                      2<Zap size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> | 20% 🎯 | 15% <Skull size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </span>
                  </button>
                </div>
              )}

              {cell.type === 'wolf' && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                  <Dog size={40} color="#0f172a" fill="#334155" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>
                    {cell.wolfCount === 1 ? 'Lupo Solitario' : `Branco di Lupi: ${cell.wolfCount} / 10`}
                  </div>
                  <div style={{ fontSize: '13px', margin: '10px 0 20px' }}>
                    I lupi si muovono di notte e cacciano i conigli. Pericolosi!
                  </div>
                  <button className="action-btn" style={{ background: '#7f1d1d', color: 'white' }} disabled={actionsLeft < 3} onClick={() => onAction(cell.id, 'hunting_wolf')}>
                    <Crosshair size={20} /> Caccia al Lupo ({ACTION_TIMES.hunting_wolf / 1000}s)
                    <span className="action-badge" style={{ background: actionsLeft >= 3 ? 'rgba(255,255,255,0.2)' : '#ef4444', padding: '4px 6px' }}>
                      3<Zap size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> | 40% <Skull size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                    </span>
                  </button>
                </div>
              )}

              {cell.type === 'water' && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                  {totalPorts > 0 ? (
                    <>
                      <button className="action-btn btn-fishing" disabled={availableShips < 1} onClick={() => onAction(cell.id, 'fishing')}>
                        <Ship size={20} /> Invia Nave a Pescare (30s)
                        <span className="action-badge" style={{ background: availableShips >= 1 ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                          1<Ship size={10} />
                        </span>
                      </button>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Genera 3 Pesci ogni 10 secondi per un massimo di 30 secondi.</p>
                    </>
                  ) : (
                    <div style={{ padding: '15px', background: '#f0f9ff', color: '#0284c7', borderRadius: '12px', fontWeight: 'bold' }}>
                      Costruisci un Porto per poter pescare e navigare in queste acque!
                    </div>
                  )}
                </div>
              )}

              {cell.type === 'grass' && (
                <>
                  <button className="action-btn btn-plow" disabled={actionsLeft < 1} onClick={() => onAction(cell.id, 'plowing')}>
                    <Tractor size={20} /> Ara Terreno ({ACTION_TIMES.plowing / 1000}s)
                  </button>
                  {isAdjacentToWater && unlocked.port && (
                    <>
                      <button className="action-btn btn-port" disabled={actionsLeft < COSTS.port.farmers || !canBuildPort} onClick={() => onAction(cell.id, 'building_port')}>
                        <Anchor size={20} /> Costruisci Porto ({ACTION_TIMES.building_port / 1000}s)
                        <span className="action-badge" style={{ background: canBuildPort && actionsLeft >= COSTS.port.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                          20<TreePine size={10} /> 10<Mountain size={10} /> 200<Coins size={10} /> {COSTS.port.farmers}<Zap size={10} />
                        </span>
                      </button>
                      <p style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', marginTop: '-5px', marginBottom: '10px' }}>
                        Attenzione: Il porto sacrificherà permanentemente {COSTS.port.farmers} cittadini per l'equipaggio!
                      </p>
                    </>
                  )}
                  {unlocked.house && (
                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.house.farmers || !canBuildHouse} onClick={() => onAction(cell.id, 'building_house')}>
                      <Home size={20} /> Costruisci Casa ({ACTION_TIMES.building_house / 1000}s)
                      <span className="action-badge" style={{ background: canBuildHouse && actionsLeft >= COSTS.house.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        3<TreePine size={10} /> 6<Mountain size={10} /> {COSTS.house.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.animal_farm && (
                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.animal_farm.farmers || !canBuildAnimalFarm} onClick={() => onAction(cell.id, 'building_animal_farm')}>
                      <Warehouse size={20} /> Fattoria Animali ({ACTION_TIMES.building_animal_farm / 1000}s)
                      <span className="action-badge" style={{ background: canBuildAnimalFarm && actionsLeft >= COSTS.animal_farm.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        5<span>🌾</span> 5<TreePine size={10} /> 5<Mountain size={10} /> 100<Coins size={10} /> {COSTS.animal_farm.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.lumber_mill && (
                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.lumber_mill.farmers || !canBuildLumberMill} onClick={() => onAction(cell.id, 'building_lumber_mill')}>
                      <Factory size={20} /> Segheria ({ACTION_TIMES.building_lumber_mill / 1000}s)
                      <span className="action-badge" style={{ background: canBuildLumberMill && actionsLeft >= COSTS.lumber_mill.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        15<TreePine size={10} /> 5<Mountain size={10} /> 150<Coins size={10} /> {COSTS.lumber_mill.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.stone_mason && (
                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.stone_mason.farmers || !canBuildStoneMason} onClick={() => onAction(cell.id, 'building_stone_mason')}>
                      <Factory size={20} /> Tagliapietre ({ACTION_TIMES.building_stone_mason / 1000}s)
                      <span className="action-badge" style={{ background: canBuildStoneMason && actionsLeft >= COSTS.stone_mason.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        10<TreePine size={10} /> 15<Mountain size={10} /> 150<Coins size={10} /> {COSTS.stone_mason.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.tree && (
                    <button className="action-btn btn-plant-forest" disabled={actionsLeft < COSTS.tree.farmers || !canPlantTree} onClick={() => onAction(cell.id, 'planting_tree')}>
                      <TreePine size={20} /> Pianta Albero ({ACTION_TIMES.planting_tree / 1000}s)
                      <span className="action-badge" style={{ background: canPlantTree && actionsLeft >= COSTS.tree.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        {COSTS.tree.coins}<Coins size={10} /> {COSTS.tree.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.bush && (
                    <button className="action-btn btn-plant-forest" disabled={actionsLeft < COSTS.bush.farmers || inventory.coins < COSTS.bush.coins} onClick={() => onAction(cell.id, 'planting_bush')}>
                      <Shrub size={20} /> Pianta Cespuglio ({ACTION_TIMES.planting_bush / 1000}s)
                      <span className="action-badge" style={{ background: inventory.coins >= COSTS.bush.coins && actionsLeft >= COSTS.bush.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        {COSTS.bush.coins}<Coins size={10} /> {COSTS.bush.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.forest && (
                    <button className="action-btn btn-plant-forest" disabled={actionsLeft < COSTS.forest.farmers || !canPlantForest} onClick={() => onAction(cell.id, 'planting_forest')}>
                      <div style={{ display: 'flex', marginRight: '4px' }}><TreePine size={20} /><TreePine size={20} style={{ marginLeft: '-10px' }} /></div> Pianta Bosco ({ACTION_TIMES.planting_forest / 1000}s)
                      <span className="action-badge" style={{ background: canPlantForest && actionsLeft >= COSTS.forest.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        {COSTS.forest.stone}<Mountain size={10} /> {COSTS.forest.coins}<Coins size={10} /> {COSTS.forest.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                  {unlocked.rock && (
                    <button className="action-btn" style={{ background: '#475569', color: 'white' }} disabled={actionsLeft < COSTS.rock.farmers || !canSpawnRock} onClick={() => onAction(cell.id, 'spawn_rock')}>
                      <Mountain size={20} /> Cerca Filone ({ACTION_TIMES.spawn_rock / 1000}s)
                      <span className="action-badge" style={{ background: canSpawnRock && actionsLeft >= COSTS.rock.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        50<Coins size={10} /> {COSTS.rock.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                </>
              )}

              {cell.type === 'plowed' && (
                <>
                  <p style={{ marginTop: 0, fontSize: '13px', color: '#64748b' }}>Scegli cosa piantare (Lavoro: {ACTION_TIMES.planting / 1000}s):</p>
                  {(Object.keys(CROPS) as CropId[]).map(cropKey => {
                    const crop = CROPS[cropKey];
                    const seedCount = inventory[`${crop.id}Seeds` as keyof Inventory] as number;
                    return (
                      <button key={crop.id} className="action-btn" style={{ background: crop.color, color: 'white' }}
                        disabled={seedCount < 1 || actionsLeft < 1}
                        onClick={() => onAction(cell.id, `planting_${crop.id}`)}>
                        {React.createElement(crop.icon, { size: 20 })} Pianta {crop.name} <span style={{ fontSize: '12px', opacity: 0.8 }}>- Cresce in {crop.growthTime / 1000}s</span>
                        <span className="action-badge">Semi: {seedCount}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {cell.type === 'ready' && cell.cropType && (
                <button className="action-btn btn-harvest" disabled={actionsLeft < 1} onClick={() => onAction(cell.id, 'harvesting')}>
                  {React.createElement(CROPS[cell.cropType].icon, { size: 20 })}
                  Raccogli {CROPS[cell.cropType].name} ({ACTION_TIMES.harvesting / 1000}s)
                </button>
              )}

              {cell.type === 'tree' && (
                <button className="action-btn btn-chop" disabled={actionsLeft < 1} onClick={() => onAction(cell.id, 'chopping')}>
                  <Axe size={20} /> Taglia Albero ({ACTION_TIMES.chopping / 1000}s)
                </button>
              )}

              {cell.type === 'bush' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Shrub size={40} color="#15803d" fill="#16a34a" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
                    Raccogliendo otterrai <b>3 bacche</b> e <b>2 semi casuali</b> (grano, pomodoro, carota o melanzana).
                  </div>
                  <button className="action-btn btn-harvest" disabled={actionsLeft < 1} onClick={() => onAction(cell.id, 'harvesting_bush')}>
                    <Shrub size={20} /> Raccogli Bacche ({ACTION_TIMES.harvesting_bush / 1000}s)
                  </button>
                </div>
              )}

              {cell.type === 'rock' && (
                <>
                  <button className="action-btn btn-chop" disabled={actionsLeft < 1} onClick={() => onAction(cell.id, 'mining')}>
                    <Pickaxe size={20} /> Spacca Roccia ({ACTION_TIMES.mining / 1000}s)
                  </button>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '-5px', marginBottom: '10px', textAlign: 'center' }}>Può droppare: Pietra, Ferro, Rame o Oro.</p>
                  {unlocked.mine && (
                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.mine.farmers || !canBuildMine} onClick={() => onAction(cell.id, 'building_mine')}>
                      <span>🔨</span> Costruisci Miniera ({ACTION_TIMES.building_mine / 1000}s)
                      <span className="action-badge" style={{ background: canBuildMine && actionsLeft >= COSTS.mine.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                        10<TreePine size={10} /> 100<Coins size={10} /> {COSTS.mine.farmers}<Zap size={10} />
                      </span>
                    </button>
                  )}
                </>
              )}

              {cell.type === 'lumber_mill' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Factory size={40} color="#78350f" fill="#92400e" style={{ margin: '0 auto 10px' }} />
                  <button className="action-btn" style={{ background: '#d97706', color: 'white' }} disabled={actionsLeft < 1 || inventory.wood < 2} onClick={() => onAction(cell.id, 'crafting_planks')}>
                    <span>📦</span> Crea Asse di Legno ({ACTION_TIMES.crafting / 1000}s)
                    <span className="action-badge" style={{ background: inventory.wood >= 2 && actionsLeft >= 1 ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>2<TreePine size={10} /></span>
                  </button>
                </div>
              )}

              {cell.type === 'stone_mason' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Factory size={40} color="#334155" fill="#475569" style={{ margin: '0 auto 10px' }} />
                  <button className="action-btn" style={{ background: '#cbd5e1', color: '#334155' }} disabled={actionsLeft < 1 || inventory.stone < 2} onClick={() => onAction(cell.id, 'crafting_bricks')}>
                    <span>🧱</span> Crea Mattone ({ACTION_TIMES.crafting / 1000}s)
                    <span className="action-badge" style={{ background: inventory.stone >= 2 && actionsLeft >= 1 ? 'rgba(0,0,0,0.1)' : '#ef4444', color: inventory.stone >= 2 && actionsLeft >= 1 ? '#334155' : 'white' }}>2<Mountain size={10} /></span>
                  </button>
                </div>
              )}

              {cell.type === 'house' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Home size={40} color="#0f172a" fill="#1e293b" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Fornisce 1 Cittadino.</div>
                  {getMergeableCells(cell.id, 'house') && unlocked.village && (
                    <div style={{ marginTop: '20px' }}>
                      <button className="action-btn btn-build" disabled={actionsLeft < COSTS.village.farmers || inventory.coins < COSTS.village.coins} onClick={() => onAction(cell.id, 'building_village')}>
                        <Tent size={20} /> Crea Villaggio ({ACTION_TIMES.building_village / 1000}s)
                        <span className="action-badge" style={{ background: actionsLeft >= COSTS.village.farmers && inventory.coins >= COSTS.village.coins ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                          {COSTS.village.coins}<Coins size={10} /> {COSTS.village.farmers}<Zap size={10} />
                        </span>
                      </button>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>Unisce 4 case adiacenti (2x2). Fornisce 6 cittadini!</p>
                    </div>
                  )}
                </div>
              )}

              {cell.type === 'village' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Tent size={40} color="#1e3a8a" fill="#3b82f6" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Fornisce 6 Cittadini.</div>
                  {getMergeableCells(cell.id, 'village') && unlocked.city && (
                    <div style={{ marginTop: '20px' }}>
                      <button className="action-btn btn-build" disabled={actionsLeft < COSTS.city.farmers || inventory.coins < COSTS.city.coins} onClick={() => onAction(cell.id, 'building_city')}>
                        <Castle size={20} /> Crea Città ({ACTION_TIMES.building_city / 1000}s)
                        <span className="action-badge" style={{ background: actionsLeft >= COSTS.city.farmers && inventory.coins >= COSTS.city.coins ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                          {COSTS.city.coins}<Coins size={10} /> {COSTS.city.farmers}<Zap size={10} />
                        </span>
                      </button>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>Unisce 4 villaggi adiacenti (2x2). Fornisce 30 cittadini!</p>
                    </div>
                  )}
                </div>
              )}

              {cell.type === 'city' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Castle size={40} color="#4c1d95" fill="#7c3aed" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Fornisce 30 Cittadini.</div>
                  {getMergeableCells(cell.id, 'city') && unlocked.county && (
                    <div style={{ marginTop: '20px' }}>
                      <button className="action-btn btn-build" disabled={actionsLeft < COSTS.county.farmers || inventory.coins < COSTS.county.coins} onClick={() => onAction(cell.id, 'building_county')}>
                        <Landmark size={20} /> Crea Contea ({ACTION_TIMES.building_county / 1000}s)
                        <span className="action-badge" style={{ background: actionsLeft >= COSTS.county.farmers && inventory.coins >= COSTS.county.coins ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>
                          {COSTS.county.coins}<Coins size={10} /> {COSTS.county.farmers}<Zap size={10} />
                        </span>
                      </button>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>Unisce 4 città adiacenti (2x2). Fornisce 100 cittadini!</p>
                    </div>
                  )}
                </div>
              )}

              {cell.type === 'county' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Landmark size={40} color="#701a75" fill="#db2777" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', color: '#64748b' }}>La Contea è l'insediamento massimo. Fornisce ben 100 Cittadini!</div>
                </div>
              )}

              {cell.type === 'port' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <Anchor size={40} color="#1e3a8a" fill="#3b82f6" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Questo porto sblocca la navigazione e funge da base per 1 Nave.</div>
                </div>
              )}

              {cell.type === 'animal_farm' && (
                <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                  <PawPrint size={40} color="#fb7185" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>Animali: {cell.animalCount} / 5</div>
                  <div style={{ fontSize: '13px', margin: '10px 0 20px' }}>
                    {cell.animalCount! < 2 && 'Servono almeno 2 animali per riprodursi.'}
                    {cell.animalCount! >= 2 && cell.animalCount! < 5 && 'Cucciolo in arrivo (20s)...'}
                    {cell.animalCount! >= 5 && 'Capacità massima raggiunta!'}
                  </div>
                  <button className="action-btn btn-sell-direct" disabled={cell.animalCount! <= 2} onClick={() => { onAction(cell.id, 'sell_animal'); onClose(); }}>
                    <Coins size={20} /> Vendi 1 Animale (+100 Monete)
                  </button>
                </div>
              )}

              {cell.type === 'mine' && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  <span style={{ fontSize: '40px' }}>🔨</span>
                  <br />Miniera in funzione passivamente.<br />Genera minerali senza usare azioni. ({cell.mineTicks || 0}/12)
                </div>
              )}

              {cell.type === 'forest' && cell.pendingAction === 'active_forest' && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <TreePine size={40} color="#15803d" />
                    <TreePine size={40} color="#15803d" style={{ marginLeft: '-15px' }} />
                  </div>
                  I taglialegna stanno disboscando la foresta.<br />Generano automaticamente 2 legna ogni 15s. Scomparirà dopo 60s. ({cell.forestTicks || 0}/4)
                </div>
              )}

              {cell.type === 'forest' && cell.pendingAction !== 'active_forest' && (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <TreePine size={40} color="#15803d" />
                    <TreePine size={40} color="#15803d" style={{ marginLeft: '-15px' }} />
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>Bosco Rigoglioso. Richiede una squadra di taglialegna per essere disboscato.</div>
                  <button className="action-btn btn-chop" disabled={actionsLeft < 3} onClick={() => onAction(cell.id, 'start_active_forest')}>
                    <Axe size={20} /> Invia Squadra Taglialegna
                    <span className="action-badge" style={{ background: actionsLeft >= 3 ? 'rgba(255,255,255,0.2)' : '#ef4444' }}>3<Zap size={10} /></span>
                  </button>
                </div>
              )}

              {cell.type === 'growing' && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                  <Sprout size={40} color="#4ade80" style={{ margin: '0 auto 10px' }} />
                  La pianta sta crescendo da sola.<br />Nessuna azione necessaria!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CellActionModal;