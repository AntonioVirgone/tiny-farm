// Logica dei turni (giorno/notte) — pure functions, nessun timeout/setInterval.
// I timer (setTimeout) rimangono responsabilità del layer React/RN.

import type { Cell } from '../types/game.types';

// ─── Fine Giorno ─────────────────────────────────────────────────────────────

/**
 * Accelera le azioni pendenti al completamento immediato quando scende la notte.
 * Le azioni passive (pesca, foresta, miniera, crescita) continuano indisturbate.
 */
export const applyNightOnGrid = (grid: Cell[], now: number): Cell[] =>
  grid.map(c => {
    const passive = ['fishing', 'active_forest', 'active_mine', 'growing'];
    if (c.busyUntil && !passive.includes(c.pendingAction as string)) {
      return { ...c, busyUntil: now };
    }
    return c;
  });

// ─── Notte: movimento animali e lupi ─────────────────────────────────────────

const getNeighbors = (i: number): number[] => {
  const n: number[] = [];
  if (i >= 8)             n.push(i - 8);
  if (i < 56)             n.push(i + 8);
  if (i % 8 !== 0)        n.push(i - 1);
  if ((i + 1) % 8 !== 0)  n.push(i + 1);
  return n;
};

const manhattanDist = (a: number, b: number): number =>
  Math.abs((a % 8) - (b % 8)) + Math.abs(Math.floor(a / 8) - Math.floor(b / 8));

/**
 * Processa tutti gli eventi notturni sulla griglia:
 * - Movimento/fuga animali selvatici
 * - Movimento/caccia/fusione lupi (ogni 2 giorni)
 * - Spawn di alberi e cespugli
 * - Auto-merge alberi in foresta (2×2)
 *
 * @param grid      griglia corrente
 * @param dayCount  numero del giorno appena terminato
 */
export const processNightEvents = (grid: Cell[], dayCount: number): Cell[] => {
  let newGrid = [...grid];
  const movedTo = new Set<number>();

  const getWolfPositions   = () => newGrid.map((c, i) => c.type === 'wolf'        ? i : -1).filter(i => i !== -1);
  const getRabbitPositions = () => newGrid.map((c, i) => c.type === 'wild_animal' ? i : -1).filter(i => i !== -1);

  // 1. CONIGLI: fuga dai lupi o spostamento casuale
  for (let i = 0; i < newGrid.length; i++) {
    const cell = newGrid[i];
    if (cell.type !== 'wild_animal' || movedTo.has(i) || cell.busyUntil || cell.pendingAction !== null) continue;

    const neighbors = getNeighbors(i);

    // Prova fusione con coniglio adiacente
    const mergeTarget = neighbors.find(n => newGrid[n].type === 'wild_animal' && !movedTo.has(n));
    if (mergeTarget !== undefined) {
      const total = Math.min(10, (cell.wildAnimalCount || 1) + (newGrid[mergeTarget].wildAnimalCount || 1));
      newGrid[mergeTarget] = { ...newGrid[mergeTarget], wildAnimalCount: total };
      newGrid[i] = { ...newGrid[i], type: 'grass', wildAnimalCount: undefined, wildReproductionTargetTime: undefined };
      movedTo.add(mergeTarget); movedTo.add(i);
      continue;
    }

    // Movimento verso erba libera, preferendo distanza dai lupi
    const freeGrass = neighbors.filter(n => newGrid[n].type === 'grass' && !newGrid[n].busyUntil && newGrid[n].pendingAction === null);
    if (freeGrass.length > 0) {
      const wolves = getWolfPositions();
      let target = freeGrass[Math.floor(Math.random() * freeGrass.length)];
      if (wolves.length > 0) {
        let maxDist = -1;
        let bestTiles = [target];
        for (const move of freeGrass) {
          const minD = Math.min(...wolves.map(w => manhattanDist(w, move)));
          if (minD > maxDist) { maxDist = minD; bestTiles = [move]; }
          else if (minD === maxDist) bestTiles.push(move);
        }
        target = bestTiles[Math.floor(Math.random() * bestTiles.length)];
      }
      newGrid[target] = { ...newGrid[target], type: 'wild_animal', wildAnimalCount: cell.wildAnimalCount, wildReproductionTargetTime: cell.wildReproductionTargetTime };
      newGrid[i] = { ...newGrid[i], type: 'grass', wildAnimalCount: undefined, wildReproductionTargetTime: undefined };
      movedTo.add(target); movedTo.add(i);
    }
  }

  // 2. LUPI: ogni 2 giorni — attacco, fusione, inseguimento
  if (dayCount % 2 === 0) {
    for (let i = 0; i < newGrid.length; i++) {
      const cell = newGrid[i];
      if (cell.type !== 'wolf' || movedTo.has(i) || cell.busyUntil || cell.pendingAction !== null) continue;

      const neighbors = getNeighbors(i);

      // Attacca coniglio adiacente
      const adjRabbit = neighbors.find(n => newGrid[n].type === 'wild_animal');
      if (adjRabbit !== undefined) {
        const rCount = newGrid[adjRabbit].wildAnimalCount || 1;
        const wCount = cell.wolfCount || 1;
        if (wCount >= rCount) {
          newGrid[adjRabbit] = { ...newGrid[adjRabbit], type: 'grass', wildAnimalCount: undefined, wildReproductionTargetTime: undefined };
        } else {
          newGrid[adjRabbit] = { ...newGrid[adjRabbit], wildAnimalCount: rCount - 1 };
        }
        movedTo.add(i);
        continue;
      }

      // Fusione branco
      const wolfMerge = neighbors.find(n => newGrid[n].type === 'wolf' && !movedTo.has(n));
      if (wolfMerge !== undefined) {
        const total = Math.min(10, (cell.wolfCount || 1) + (newGrid[wolfMerge].wolfCount || 1));
        newGrid[wolfMerge] = { ...newGrid[wolfMerge], wolfCount: total };
        newGrid[i] = { ...newGrid[i], type: 'grass', wolfCount: undefined };
        movedTo.add(wolfMerge); movedTo.add(i);
        continue;
      }

      // Inseguimento conigli
      const freeGrass = neighbors.filter(n => newGrid[n].type === 'grass' && !newGrid[n].busyUntil && newGrid[n].pendingAction === null);
      if (freeGrass.length > 0) {
        const rabbits = getRabbitPositions();
        let target = freeGrass[Math.floor(Math.random() * freeGrass.length)];
        if (rabbits.length > 0) {
          let minDist = 999;
          let bestTiles = [target];
          for (const move of freeGrass) {
            const d = Math.min(...rabbits.map(r => manhattanDist(r, move)));
            if (d < minDist) { minDist = d; bestTiles = [move]; }
            else if (d === minDist) bestTiles.push(move);
          }
          target = bestTiles[Math.floor(Math.random() * bestTiles.length)];
        }
        newGrid[target] = { ...newGrid[target], type: 'wolf', wolfCount: cell.wolfCount };
        newGrid[i] = { ...newGrid[i], type: 'grass', wolfCount: undefined };
        movedTo.add(target); movedTo.add(i);
      }
    }
  }

  // 3. SPAWN alberi e cespugli
  const emptyGrass = newGrid
    .map((c, i) => c.type === 'grass' && !c.busyUntil && c.pendingAction === null ? i : -1)
    .filter(i => i !== -1);

  if (emptyGrass.length > 0) {
    const count = Math.floor(Math.random() * 3) + 1;
    const pool = [...emptyGrass];
    for (let k = 0; k < count && pool.length > 0; k++) {
      const idx = Math.floor(Math.random() * pool.length);
      const cellId = pool.splice(idx, 1)[0];
      newGrid[cellId] = { ...newGrid[cellId], type: Math.random() < 0.3 ? 'bush' : 'tree' };
    }
  }

  // 4. AUTO-MERGE 4 alberi → foresta (2×2)
  for (let i = 0; i < newGrid.length; i++) {
    const col = i % 8; const row = Math.floor(i / 8);
    if (newGrid[i].type !== 'tree' || col >= 7 || row >= 7) continue;
    if (newGrid[i].busyUntil || newGrid[i].pendingAction !== null) continue;
    const [tl, tr, bl, br] = [i, i + 1, i + 8, i + 9];
    const isIdleTree = (id: number) => newGrid[id].type === 'tree' && !newGrid[id].busyUntil && newGrid[id].pendingAction === null;
    if (isIdleTree(tr) && isIdleTree(bl) && isIdleTree(br)) {
      newGrid[tl] = { ...newGrid[tl], type: 'forest', pendingAction: null, busyUntil: null, busyTotalDuration: null };
      newGrid[tr] = { ...newGrid[tr], type: 'grass' };
      newGrid[bl] = { ...newGrid[bl], type: 'grass' };
      newGrid[br] = { ...newGrid[br], type: 'grass' };
    }
  }

  return newGrid;
};

// ─── Trigger automatico fine-giorno ──────────────────────────────────────────

/**
 * True se il giocatore ha esaurito tutte le azioni e i farmers non sono impegnati.
 * La UI usa questo per avviare la transizione notte.
 */
export const shouldAutoEndDay = (actionsLeft: number, busyFarmers: number, isNight: boolean, totalFarmers: number): boolean =>
  actionsLeft <= 0 && busyFarmers === 0 && !isNight && totalFarmers > 0;
