import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CROPS, COSTS, ACTION_TIMES } from '@core/constants/game.constants';
import { DEFAULT_GAME_CONFIG } from '@core/constants/config.defaults';
import type { GameConfig } from '@core/types/config.types';
import type { ActionType, Cell, CropId, Inventory, UnlockedBuildings } from '@core/types/game.types';
import { CELL_EMOJI, CROP_EMOJI } from '../../icons/iconMap';
import { colors } from '../../styles/colors';

interface Props {
  cell: Cell | null;
  visible: boolean;
  isReachable: boolean;
  isAdjacentToWater: boolean;
  inventory: Inventory;
  unlocked: UnlockedBuildings;
  actionsLeft: number;
  availableShips: number;
  totalPorts: number;
  baseFarmers: number;
  respawningCount: number;
  gameConfig?: GameConfig;
  getMergeableCells: (cellId: number, targetType: string) => number[] | null;
  onAction: (cellId: number, action: ActionType) => void;
  onClose: () => void;
}

const CELL_NAMES: Record<string, string> = {
  grass: 'Terreno Libero', water: 'Fiume / Lago', plowed: 'Terreno Arato',
  tree: 'Albero Alto', forest: 'Bosco Rigoglioso', rock: 'Roccia Solida',
  wild_animal: 'Animali Selvatici', bush: 'Cespuglio', wolf: 'Branco di Lupi!',
  ready: 'Raccolto Pronto!', growing: 'Coltura in crescita...', mine: 'Miniera Attiva',
  animal_farm: 'Fattoria Animali', house: 'Casa del Cittadino', village: 'Villaggio',
  city: 'Città', county: 'Contea', lumber_mill: 'Segheria',
  stone_mason: 'Tagliapietre', port: 'Porto',
};

interface ActionBtnProps {
  label: string;
  emoji?: string;
  disabled?: boolean;
  color?: string;
  badge?: string;
  badgeOk?: boolean;
  onPress: () => void;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ label, emoji, disabled, color = colors.primary, badge, badgeOk = true, onPress }) => (
  <Pressable
    style={[styles.actionBtn, { backgroundColor: disabled ? '#374151' : color }, disabled && styles.disabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.actionBtnRow}>
      {emoji ? <Text style={styles.actionEmoji}>{emoji}</Text> : null}
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
    {badge ? (
      <View style={[styles.badge, { backgroundColor: badgeOk ? 'rgba(255,255,255,0.2)' : colors.danger }]}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
  </Pressable>
);

const CellActionModal: React.FC<Props> = ({
  cell, visible, isReachable, isAdjacentToWater, inventory, unlocked, actionsLeft,
  availableShips, totalPorts, baseFarmers, respawningCount,
  gameConfig = DEFAULT_GAME_CONFIG, getMergeableCells, onAction, onClose,
}) => {
  if (!cell) return null;

  const at = (key: string): number => {
    const cfg = gameConfig.actionTimes as Record<string, number>;
    return cfg[key] ?? ACTION_TIMES[key as keyof typeof ACTION_TIMES] ?? 15000;
  };

  const canBuildHouse = inventory.wood >= COSTS.house.wood && inventory.stone >= COSTS.house.stone;
  const canBuildMine = inventory.wood >= COSTS.mine.wood && inventory.coins >= COSTS.mine.coins;
  const canPlantTree = inventory.coins >= COSTS.tree.coins;
  const canPlantForest = inventory.coins >= COSTS.forest.coins && inventory.stone >= COSTS.forest.stone;
  const canSpawnRock = inventory.coins >= COSTS.rock.coins;
  const canBuildAnimalFarm = inventory.wheat >= COSTS.animal_farm.wheat && inventory.wood >= COSTS.animal_farm.wood && inventory.stone >= COSTS.animal_farm.stone && inventory.coins >= COSTS.animal_farm.coins;
  const canBuildLumberMill = inventory.wood >= COSTS.lumber_mill.wood && inventory.stone >= COSTS.lumber_mill.stone && inventory.coins >= COSTS.lumber_mill.coins;
  const canBuildStoneMason = inventory.wood >= COSTS.stone_mason.wood && inventory.stone >= COSTS.stone_mason.stone && inventory.coins >= COSTS.stone_mason.coins;
  const futureFarmers = baseFarmers - ((totalPorts + 1) * COSTS.port.farmers) - respawningCount;
  const canBuildPort = inventory.wood >= COSTS.port.wood && inventory.stone >= COSTS.port.stone && inventory.coins >= COSTS.port.coins && futureFarmers >= 1;
  const canBuildVillage = actionsLeft >= COSTS.village.farmers && inventory.coins >= COSTS.village.coins;
  const canBuildCity = actionsLeft >= COSTS.city.farmers && inventory.coins >= COSTS.city.coins;
  const canBuildCounty = actionsLeft >= COSTS.county.farmers && inventory.coins >= COSTS.county.coins;

  const noActions = actionsLeft <= 0;
  const title = isReachable ? (CELL_NAMES[cell.type] ?? cell.type) : 'Zona Inesplorata';

  const do_action = (action: ActionType) => { onAction(cell.id, action); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>{isReachable ? (CELL_EMOJI[cell.type] ?? '❓') : '🌫️'}</Text>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ gap: 8, paddingBottom: 20 }}>
            {!isReachable ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Nebbia Fitta. Costruisci un Porto sulla terraferma adiacente all'acqua per esplorare.</Text>
              </View>
            ) : (
              <>
                {noActions && !['growing', 'mine', 'animal_farm', 'water'].includes(cell.type) && (
                  <View style={[styles.infoBox, { backgroundColor: '#fef2f2' }]}>
                    <Text style={{ color: colors.danger, fontWeight: '700', textAlign: 'center' }}>Azioni esaurite per oggi!</Text>
                  </View>
                )}

                {/* GRASS */}
                {cell.type === 'grass' && (
                  <>
                    <ActionBtn label={`Ara Terreno (${at('plowing') / 1000}s)`} emoji="🚜" disabled={noActions} color="#a16207" onPress={() => do_action('plowing')} />
                    {isAdjacentToWater && unlocked.port && (
                      <ActionBtn label={`Costruisci Porto (${at('building_port') / 1000}s)`} emoji="⚓" disabled={!canBuildPort || actionsLeft < COSTS.port.farmers} color={colors.cellPort} badge={`🪵${COSTS.port.wood} 🪨${COSTS.port.stone} 🪙${COSTS.port.coins} 👥${COSTS.port.farmers}`} badgeOk={canBuildPort} onPress={() => do_action('building_port')} />
                    )}
                    {unlocked.house && (
                      <ActionBtn label={`Costruisci Casa (${at('building_house') / 1000}s)`} emoji="🏠" disabled={!canBuildHouse || actionsLeft < COSTS.house.farmers} color={colors.cellHouse} badge={`🪵${COSTS.house.wood} 🪨${COSTS.house.stone} 👥${COSTS.house.farmers}`} badgeOk={canBuildHouse} onPress={() => do_action('building_house')} />
                    )}
                    {unlocked.animal_farm && (
                      <ActionBtn label={`Fattoria Animali (${at('building_animal_farm') / 1000}s)`} emoji="🐾" disabled={!canBuildAnimalFarm || actionsLeft < COSTS.animal_farm.farmers} color={colors.cellFarm} badge={`🌾${COSTS.animal_farm.wheat} 🪵${COSTS.animal_farm.wood} 🪨${COSTS.animal_farm.stone} 🪙${COSTS.animal_farm.coins}`} badgeOk={canBuildAnimalFarm} onPress={() => do_action('building_animal_farm')} />
                    )}
                    {unlocked.lumber_mill && (
                      <ActionBtn label={`Segheria (${at('building_lumber_mill') / 1000}s)`} emoji="🏭" disabled={!canBuildLumberMill || actionsLeft < COSTS.lumber_mill.farmers} color={colors.cellMill} badge={`🪵${COSTS.lumber_mill.wood} 🪨${COSTS.lumber_mill.stone} 🪙${COSTS.lumber_mill.coins}`} badgeOk={canBuildLumberMill} onPress={() => do_action('building_lumber_mill')} />
                    )}
                    {unlocked.stone_mason && (
                      <ActionBtn label={`Tagliapietre (${at('building_stone_mason') / 1000}s)`} emoji="🏗️" disabled={!canBuildStoneMason || actionsLeft < COSTS.stone_mason.farmers} color={colors.cellMason} badge={`🪵${COSTS.stone_mason.wood} 🪨${COSTS.stone_mason.stone} 🪙${COSTS.stone_mason.coins}`} badgeOk={canBuildStoneMason} onPress={() => do_action('building_stone_mason')} />
                    )}
                    {unlocked.tree && (
                      <ActionBtn label={`Pianta Albero (${at('planting_tree') / 1000}s)`} emoji="🌲" disabled={!canPlantTree || noActions} color={colors.cellTree} badge={`🪙${COSTS.tree.coins}`} badgeOk={canPlantTree} onPress={() => do_action('planting_tree')} />
                    )}
                    {unlocked.bush && (
                      <ActionBtn label={`Pianta Cespuglio (${at('planting_bush') / 1000}s)`} emoji="🌿" disabled={inventory.coins < COSTS.bush.coins || noActions} color={colors.cellBush} badge={`🪙${COSTS.bush.coins}`} badgeOk={inventory.coins >= COSTS.bush.coins} onPress={() => do_action('planting_bush')} />
                    )}
                    {unlocked.forest && (
                      <ActionBtn label={`Pianta Bosco (${at('planting_forest') / 1000}s)`} emoji="🌳" disabled={!canPlantForest || actionsLeft < COSTS.forest.farmers} color={colors.cellForest} badge={`🪨${COSTS.forest.stone} 🪙${COSTS.forest.coins} 👥${COSTS.forest.farmers}`} badgeOk={canPlantForest} onPress={() => do_action('planting_forest')} />
                    )}
                    {unlocked.rock && (
                      <ActionBtn label={`Cerca Filone (${at('spawn_rock') / 1000}s)`} emoji="⛏️" disabled={!canSpawnRock || noActions} color={colors.cellRock} badge={`🪙${COSTS.rock.coins}`} badgeOk={canSpawnRock} onPress={() => do_action('spawn_rock')} />
                    )}
                  </>
                )}

                {/* PLOWED */}
                {cell.type === 'plowed' && (
                  <>
                    <Text style={styles.sectionLabel}>Scegli cosa piantare ({at('planting') / 1000}s):</Text>
                    {(Object.keys(CROPS) as CropId[]).map(cropKey => {
                      const crop = CROPS[cropKey];
                      const seedCount = inventory[`${crop.id}Seeds` as keyof Inventory] as number;
                      const growTime = (gameConfig.crops[cropKey]?.growthTime ?? crop.growthTime) / 1000;
                      return (
                        <ActionBtn
                          key={crop.id}
                          label={`Pianta ${crop.name} — cresce in ${growTime}s`}
                          emoji={CROP_EMOJI[crop.id]}
                          disabled={seedCount < 1 || noActions}
                          color={crop.color}
                          badge={`Semi: ${seedCount}`}
                          badgeOk={seedCount >= 1}
                          onPress={() => do_action(`planting_${crop.id}`)}
                        />
                      );
                    })}
                  </>
                )}

                {/* READY */}
                {cell.type === 'ready' && cell.cropType && (
                  <ActionBtn label={`Raccogli ${CROPS[cell.cropType].name} (${at('harvesting') / 1000}s)`} emoji={CROP_EMOJI[cell.cropType]} disabled={noActions} color={colors.cellReady} onPress={() => do_action('harvesting')} />
                )}

                {/* TREE */}
                {cell.type === 'tree' && (
                  <ActionBtn label={`Taglia Albero (${at('chopping') / 1000}s)`} emoji="🪓" disabled={noActions} color={colors.cellTree} onPress={() => do_action('chopping')} />
                )}

                {/* BUSH */}
                {cell.type === 'bush' && (
                  <>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>
                        Raccogliendo otterrai <Text style={{ fontWeight: '700' }}>{gameConfig.bushBerriesAmount} bacche</Text> e <Text style={{ fontWeight: '700' }}>{gameConfig.bushSeedsAmount} semi casuali</Text> (grano, pomodoro, carota o melanzana).
                      </Text>
                    </View>
                    <ActionBtn label={`Raccogli Bacche (${at('harvesting_bush') / 1000}s)`} emoji="🫐" disabled={noActions} color={colors.success} onPress={() => do_action('harvesting_bush')} />
                  </>
                )}

                {/* ROCK */}
                {cell.type === 'rock' && (
                  <>
                    <ActionBtn label={`Spacca Roccia (${at('mining') / 1000}s)`} emoji="⛏️" disabled={noActions} color={colors.cellRock} onPress={() => do_action('mining')} />
                    <Text style={styles.hint}>Può droppare: Pietra, Ferro, Rame o Oro.</Text>
                    {unlocked.mine && (
                      <ActionBtn label={`Costruisci Miniera (${at('building_mine') / 1000}s)`} emoji="⚒️" disabled={!canBuildMine || actionsLeft < COSTS.mine.farmers} color={colors.cellMine} badge={`🪵${COSTS.mine.wood} 🪙${COSTS.mine.coins} 👥${COSTS.mine.farmers}`} badgeOk={canBuildMine} onPress={() => do_action('building_mine')} />
                    )}
                  </>
                )}

                {/* WATER */}
                {cell.type === 'water' && (
                  totalPorts > 0 ? (
                    <>
                      <ActionBtn label="Invia Nave a Pescare (30s)" emoji="⛵" disabled={availableShips < 1} color={colors.cellPort} badge={`🚢${availableShips}`} badgeOk={availableShips >= 1} onPress={() => do_action('fishing')} />
                      <Text style={styles.hint}>Genera 3 Pesci ogni 10 secondi per un massimo di 30 secondi.</Text>
                    </>
                  ) : (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>Costruisci un Porto per poter pescare e navigare in queste acque!</Text>
                    </View>
                  )
                )}

                {/* WILD ANIMAL */}
                {cell.type === 'wild_animal' && (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>🐰</Text>
                      <Text style={styles.infoTitle}>{cell.wildAnimalCount === 1 ? 'Animale Solitario' : `Branco Selvatico: ${cell.wildAnimalCount} / 10`}</Text>
                      <Text style={styles.infoText}>
                        {cell.wildAnimalCount === 1 ? 'Cerca un compagno per riprodursi...' : cell.wildAnimalCount! >= 2 && cell.wildAnimalCount! < 10 ? 'Si stanno riproducendo passivamente (50s)...' : 'Capacità massima del branco raggiunta!'}
                      </Text>
                    </View>
                    <ActionBtn label={`Caccia (${at('hunting') / 1000}s)`} emoji="🎯" disabled={actionsLeft < 2} color="#c2410c" badge="👥2 | 20% hit | 15% ☠️" badgeOk={actionsLeft >= 2} onPress={() => do_action('hunting')} />
                  </>
                )}

                {/* WOLF */}
                {cell.type === 'wolf' && (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>🐺</Text>
                      <Text style={styles.infoTitle}>{cell.wolfCount === 1 ? 'Lupo Solitario' : `Branco di Lupi: ${cell.wolfCount} / 10`}</Text>
                      <Text style={styles.infoText}>I lupi si muovono di notte e cacciano i conigli. Pericolosi!</Text>
                    </View>
                    <ActionBtn label={`Caccia al Lupo (${at('hunting_wolf') / 1000}s)`} emoji="🗡️" disabled={actionsLeft < 3} color="#7f1d1d" badge="👥3 | 40% ☠️" badgeOk={actionsLeft >= 3} onPress={() => do_action('hunting_wolf')} />
                  </>
                )}

                {/* LUMBER MILL */}
                {cell.type === 'lumber_mill' && (
                  <ActionBtn label={`Crea Asse di Legno (${at('crafting') / 1000}s)`} emoji="📦" disabled={noActions || inventory.wood < 2} color={colors.cellMill} badge="🪵2" badgeOk={inventory.wood >= 2} onPress={() => do_action('crafting_planks')} />
                )}

                {/* STONE MASON */}
                {cell.type === 'stone_mason' && (
                  <ActionBtn label={`Crea Mattone (${at('crafting') / 1000}s)`} emoji="🧱" disabled={noActions || inventory.stone < 2} color={colors.cellMason} badge="🪨2" badgeOk={inventory.stone >= 2} onPress={() => do_action('crafting_bricks')} />
                )}

                {/* HOUSE */}
                {cell.type === 'house' && (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>🏠</Text>
                      <Text style={styles.infoText}>Fornisce 1 Cittadino.</Text>
                    </View>
                    {getMergeableCells(cell.id, 'house') && unlocked.village && (
                      <>
                        <ActionBtn label={`Crea Villaggio (${at('building_village') / 1000}s)`} emoji="⛺" disabled={!canBuildVillage} color={colors.cellVillage} badge={`🪙${COSTS.village.coins} 👥${COSTS.village.farmers}`} badgeOk={canBuildVillage} onPress={() => do_action('building_village')} />
                        <Text style={styles.hint}>Unisce 4 case adiacenti (2×2). Fornisce 6 cittadini!</Text>
                      </>
                    )}
                  </>
                )}

                {/* VILLAGE */}
                {cell.type === 'village' && (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>⛺</Text>
                      <Text style={styles.infoText}>Fornisce 6 Cittadini.</Text>
                    </View>
                    {getMergeableCells(cell.id, 'village') && unlocked.city && (
                      <>
                        <ActionBtn label={`Crea Città (${at('building_city') / 1000}s)`} emoji="🏰" disabled={!canBuildCity} color={colors.cellCity} badge={`🪙${COSTS.city.coins} 👥${COSTS.city.farmers}`} badgeOk={canBuildCity} onPress={() => do_action('building_city')} />
                        <Text style={styles.hint}>Unisce 4 villaggi adiacenti (2×2). Fornisce 30 cittadini!</Text>
                      </>
                    )}
                  </>
                )}

                {/* CITY */}
                {cell.type === 'city' && (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>🏰</Text>
                      <Text style={styles.infoText}>Fornisce 30 Cittadini.</Text>
                    </View>
                    {getMergeableCells(cell.id, 'city') && unlocked.county && (
                      <>
                        <ActionBtn label={`Crea Contea (${at('building_county') / 1000}s)`} emoji="🏛️" disabled={!canBuildCounty} color={colors.cellCounty} badge={`🪙${COSTS.county.coins} 👥${COSTS.county.farmers}`} badgeOk={canBuildCounty} onPress={() => do_action('building_county')} />
                        <Text style={styles.hint}>Unisce 4 città adiacenti (2×2). Fornisce 100 cittadini!</Text>
                      </>
                    )}
                  </>
                )}

                {/* COUNTY */}
                {cell.type === 'county' && (
                  <View style={styles.centeredInfo}>
                    <Text style={styles.bigEmoji}>🏛️</Text>
                    <Text style={styles.infoText}>La Contea è l'insediamento massimo. Fornisce ben 100 Cittadini!</Text>
                  </View>
                )}

                {/* PORT */}
                {cell.type === 'port' && (
                  <View style={styles.centeredInfo}>
                    <Text style={styles.bigEmoji}>⚓</Text>
                    <Text style={styles.infoText}>Questo porto sblocca la navigazione e funge da base per 1 Nave.</Text>
                  </View>
                )}

                {/* ANIMAL FARM */}
                {cell.type === 'animal_farm' && (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>🐾</Text>
                      <Text style={styles.infoTitle}>Animali: {cell.animalCount} / 5</Text>
                      <Text style={styles.infoText}>
                        {cell.animalCount! < 2 && 'Servono almeno 2 animali per riprodursi.'}
                        {cell.animalCount! >= 2 && cell.animalCount! < 5 && 'Cucciolo in arrivo (20s)...'}
                        {cell.animalCount! >= 5 && 'Capacità massima raggiunta!'}
                      </Text>
                    </View>
                    <ActionBtn label="Vendi 1 Animale (+100 Monete)" emoji="🪙" disabled={cell.animalCount! <= 2} color={colors.success} onPress={() => do_action('sell_animal')} />
                  </>
                )}

                {/* MINE */}
                {cell.type === 'mine' && (
                  <View style={styles.centeredInfo}>
                    <Text style={styles.bigEmoji}>⚒️</Text>
                    <Text style={styles.infoText}>Miniera in funzione passivamente. Genera minerali senza usare azioni. ({cell.mineTicks || 0}/12)</Text>
                  </View>
                )}

                {/* FOREST */}
                {cell.type === 'forest' && cell.pendingAction === 'active_forest' ? (
                  <View style={styles.centeredInfo}>
                    <Text style={styles.bigEmoji}>🌳</Text>
                    <Text style={styles.infoText}>I taglialegna stanno disboscando la foresta. Generano automaticamente 2 legna ogni 15s. Scomparirà dopo 60s. ({cell.forestTicks || 0}/4)</Text>
                  </View>
                ) : cell.type === 'forest' ? (
                  <>
                    <View style={styles.centeredInfo}>
                      <Text style={styles.bigEmoji}>🌳</Text>
                      <Text style={styles.infoText}>Bosco Rigoglioso. Richiede una squadra di taglialegna per essere disboscato.</Text>
                    </View>
                    <ActionBtn label="Invia Squadra Taglialegna" emoji="🪓" disabled={actionsLeft < 3} color={colors.cellTree} badge="👥3" badgeOk={actionsLeft >= 3} onPress={() => do_action('start_active_forest')} />
                  </>
                ) : null}

                {/* GROWING */}
                {cell.type === 'growing' && (
                  <View style={styles.centeredInfo}>
                    <Text style={styles.bigEmoji}>🌱</Text>
                    <Text style={styles.infoText}>La pianta sta crescendo da sola. Nessuna azione necessaria!</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  headerEmoji: { fontSize: 24 },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionEmoji: { fontSize: 18 },
  actionLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  disabled: { opacity: 0.55 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  hint: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: -2,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  centeredInfo: {
    alignItems: 'center',
    padding: 8,
    gap: 6,
  },
  bigEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
});

export default CellActionModal;
