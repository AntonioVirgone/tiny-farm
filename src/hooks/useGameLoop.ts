import { useEffect } from 'react';
import { CROPS } from '../constants/game.constants';
import type { Cell, GameState, Inventory } from '../types/game.types';

interface Params {
  gameState: GameState;
  setGrid: React.Dispatch<React.SetStateAction<Cell[]>>;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;
  setNow: React.Dispatch<React.SetStateAction<number>>;
  setRespawningFarmers: React.Dispatch<React.SetStateAction<number[]>>;
  respawningRef: React.MutableRefObject<number[]>;
}

export const useGameLoop = ({
  gameState, setGrid, setInventory, setNow, setRespawningFarmers, respawningRef,
}: Params) => {
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      setGrid(prevGrid => {
        let newGrid = [...prevGrid];
        let gridChanged = false;
        let newRewards: Partial<Inventory> = {};
        let newlyDeadFarmers = 0;

        const addReward = (key: keyof Inventory, amount: number) => {
          newRewards[key] = ((newRewards[key] as number) || 0) + amount;
        };

        for (let i = 0; i < newGrid.length; i++) {
          let updatedCell = { ...newGrid[i] };
          let cellModified = false;

          // Miniera attiva
          if (updatedCell.type === 'mine' && updatedCell.pendingAction === 'active_mine') {
            const timeSinceLastTick = currentTime - (updatedCell.lastTickTime || currentTime);
            if (timeSinceLastTick >= 5000) {
              cellModified = true;
              const dropRoll = Math.random() * 100;
              if (dropRoll < 7) addReward('gold', 1);
              else if (dropRoll < 14) addReward('copper', 1);
              else if (dropRoll < 21) addReward('iron', 1);
              else addReward('stone', 1);

              const newTicks = (updatedCell.mineTicks || 0) + 1;
              if (newTicks >= 12) {
                updatedCell = { ...updatedCell, type: 'rock', pendingAction: null, lastTickTime: undefined, mineTicks: undefined, farmersUsed: undefined };
              } else {
                updatedCell = { ...updatedCell, lastTickTime: currentTime, mineTicks: newTicks };
              }
            }
          }

          // Foresta attiva
          if (updatedCell.type === 'forest' && updatedCell.pendingAction === 'active_forest') {
            const timeSinceLastTick = currentTime - (updatedCell.lastTickTime || currentTime);
            if (timeSinceLastTick >= 15000) {
              cellModified = true;
              addReward('wood', 2);
              const newTicks = (updatedCell.forestTicks || 0) + 1;
              if (newTicks >= 4) {
                updatedCell = { ...updatedCell, type: 'grass', pendingAction: null, lastTickTime: undefined, forestTicks: undefined, farmersUsed: undefined };
              } else {
                updatedCell = { ...updatedCell, lastTickTime: currentTime, forestTicks: newTicks };
              }
            }
          }

          // Fattoria animali (riproduzione)
          if (updatedCell.type === 'animal_farm') {
            const count = updatedCell.animalCount || 0;
            if (count >= 2 && count < 5) {
              if (!updatedCell.reproductionTargetTime) {
                updatedCell = { ...updatedCell, reproductionTargetTime: currentTime + 20000 };
                cellModified = true;
              } else if (currentTime >= updatedCell.reproductionTargetTime) {
                updatedCell = { ...updatedCell, animalCount: count + 1, reproductionTargetTime: (count + 1) < 5 ? currentTime + 20000 : null };
                cellModified = true;
              }
            } else if (updatedCell.reproductionTargetTime) {
              updatedCell = { ...updatedCell, reproductionTargetTime: null };
              cellModified = true;
            }
          }

          // Animali selvatici (riproduzione)
          if (updatedCell.type === 'wild_animal') {
            const count = updatedCell.wildAnimalCount || 1;
            if (count >= 2 && count < 10) {
              if (!updatedCell.wildReproductionTargetTime) {
                updatedCell = { ...updatedCell, wildReproductionTargetTime: currentTime + 50000 };
                cellModified = true;
              } else if (currentTime >= updatedCell.wildReproductionTargetTime) {
                updatedCell = { ...updatedCell, wildAnimalCount: count + 1, wildReproductionTargetTime: (count + 1) < 10 ? currentTime + 50000 : null };
                cellModified = true;
              }
            } else if (updatedCell.wildReproductionTargetTime && count < 2) {
              updatedCell = { ...updatedCell, wildReproductionTargetTime: null };
              cellModified = true;
            } else if (count >= 10 && updatedCell.wildReproductionTargetTime) {
              updatedCell = { ...updatedCell, wildReproductionTargetTime: null };
              cellModified = true;
            }
          }

          // Pesca
          if (updatedCell.type === 'water' && updatedCell.pendingAction === 'fishing') {
            const timeSinceLastTick = currentTime - (updatedCell.lastTickTime || currentTime);
            if (timeSinceLastTick >= 10000) {
              cellModified = true;
              addReward('fish', 3);
              const newTicks = (updatedCell.fishingTicks || 0) + 1;
              if (newTicks >= 3) {
                updatedCell = { ...updatedCell, pendingAction: null, lastTickTime: undefined, fishingTicks: undefined };
              } else {
                updatedCell = { ...updatedCell, lastTickTime: currentTime, fishingTicks: newTicks };
              }
            }
          }

          // Completamento azioni
          if (updatedCell.busyUntil && currentTime >= updatedCell.busyUntil && updatedCell.pendingAction !== 'fishing') {
            cellModified = true;
            let newType = updatedCell.type;
            let newPendingAction: any = null;

            if (updatedCell.pendingAction === 'plowing') newType = 'plowed';
            else if (updatedCell.pendingAction === 'planting_tree') newType = 'tree';
            else if (updatedCell.pendingAction === 'planting_forest') newType = 'forest';
            else if (updatedCell.pendingAction === 'spawn_rock') newType = 'rock';
            else if (updatedCell.pendingAction === 'building_village') newType = 'village';
            else if (updatedCell.pendingAction === 'building_city') newType = 'city';
            else if (updatedCell.pendingAction === 'building_county') newType = 'county';
            else if (updatedCell.pendingAction === 'building_lumber_mill') newType = 'lumber_mill';
            else if (updatedCell.pendingAction === 'building_stone_mason') newType = 'stone_mason';
            else if (updatedCell.pendingAction === 'building_port') newType = 'port';
            else if (updatedCell.pendingAction === 'building_mine') {
              newType = 'mine'; newPendingAction = 'active_mine';
              updatedCell.lastTickTime = currentTime; updatedCell.mineTicks = 0;
            }
            else if (updatedCell.pendingAction === 'building_animal_farm') {
              newType = 'animal_farm'; updatedCell.animalCount = 2;
            }
            else if (updatedCell.pendingAction?.startsWith('planting_') && updatedCell.pendingAction !== 'planting_forest' && updatedCell.pendingAction !== 'planting_tree') {
              newType = 'growing';
              const cropType = updatedCell.cropType!;
              updatedCell.busyUntil = currentTime + CROPS[cropType].growthTime;
              updatedCell.busyTotalDuration = CROPS[cropType].growthTime;
              newPendingAction = 'growing';
            }
            else if (updatedCell.pendingAction === 'growing') newType = 'ready';
            else if (updatedCell.pendingAction === 'harvesting') {
              newType = 'grass';
              const crop = CROPS[updatedCell.cropType!];
              addReward(crop.id, crop.minYield + Math.floor(Math.random() * (crop.maxYield - crop.minYield + 1)));
              addReward(`${crop.id}Seeds` as keyof Inventory, crop.minSeeds + Math.floor(Math.random() * (crop.maxSeeds - crop.minSeeds + 1)));
            }
            else if (updatedCell.pendingAction === 'chopping') { newType = 'grass'; addReward('wood', 5 + Math.floor(Math.random() * 3)); }
            else if (updatedCell.pendingAction === 'mining') {
              newType = 'grass';
              const dropRoll = Math.random() * 100;
              if (dropRoll < 7) addReward('gold', 2);
              else if (dropRoll < 20) addReward('copper', 3);
              else if (dropRoll < 38) addReward('iron', 3);
              else addReward('stone', 3 + Math.floor(Math.random() * 3));
            }
            else if (updatedCell.pendingAction === 'crafting_planks') { addReward('planks', 1); }
            else if (updatedCell.pendingAction === 'crafting_bricks') { addReward('bricks', 1); }
            else if (updatedCell.pendingAction === 'building_house') newType = 'house';
            else if (updatedCell.pendingAction === 'hunting') {
              newType = 'wild_animal';
              let wildCount = updatedCell.wildAnimalCount || 1;
              if (Math.random() * 100 < 15) newlyDeadFarmers += 1;
              else if (Math.random() * 100 < 35) { addReward('wildMeat', 1); wildCount -= 1; }
              if (wildCount <= 0) { newType = 'grass'; updatedCell.wildAnimalCount = undefined; updatedCell.wildReproductionTargetTime = undefined; }
              else { updatedCell.wildAnimalCount = wildCount; }
            }
            else if (updatedCell.pendingAction === 'hunting_wolf') {
              newType = 'wolf';
              let wolfCount = updatedCell.wolfCount || 1;
              if (Math.random() * 100 < 40) newlyDeadFarmers += (Math.floor(Math.random() * 2) + 2);
              else if (Math.random() * 100 < 70) { addReward('wildMeat', 2); wolfCount -= 1; }
              if (wolfCount <= 0) { newType = 'grass'; updatedCell.wolfCount = undefined; }
              else { updatedCell.wolfCount = wolfCount; }
            }

            updatedCell = {
              ...updatedCell, type: newType, pendingAction: newPendingAction,
              cropType: newType === 'grass' ? undefined : updatedCell.cropType,
              farmersUsed: undefined,
            };
            if (newPendingAction !== 'growing') {
              updatedCell.busyUntil = null;
              updatedCell.busyTotalDuration = null;
            }
          }

          if (cellModified) {
            newGrid[i] = updatedCell;
            gridChanged = true;
          }
        }

        if (gridChanged && Object.keys(newRewards).length > 0) {
          setTimeout(() => {
            setInventory(prev => {
              const next = { ...prev };
              (Object.keys(newRewards) as Array<keyof Inventory>).forEach(k => {
                next[k] = (next[k] as number) + (newRewards[k] as number);
              });
              return next;
            });
          }, 0);
        }

        if (newlyDeadFarmers > 0) {
          setTimeout(() => {
            setRespawningFarmers(prev => {
              const next = [...prev];
              for (let i = 0; i < newlyDeadFarmers; i++) next.push(currentTime + 40000);
              return next;
            });
          }, 0);
        }

        return gridChanged ? newGrid : prevGrid;
      });

      // Respawn cittadini
      let respawnChanged = false;
      const filteredRespawning = respawningRef.current.filter(time => {
        if (currentTime >= time) { respawnChanged = true; return false; }
        return true;
      });
      if (respawnChanged) setRespawningFarmers(filteredRespawning);

    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);
};