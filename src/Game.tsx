import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

import { auth, db, appId } from './config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ACTION_TIMES, BASE_INITIAL_FARMERS, COSTS, CROPS, INITIAL_INVENTORY, INITIAL_UNLOCKED } from './constants/game.constants';
import { useGameEvents } from './hooks/useGameEvents';
import { useGameLoop } from './hooks/useGameLoop';
import { useSave } from './hooks/useSave';
import { useVillageElder } from './hooks/useVillageElder';
import type {
  ActionType, Cell, CellType, CropId, GameState, Inventory, QuestDefinition, Toast, UnlockedBuildings,
} from './types/game.types';
import { generateInitialGrid, getMergeableCells } from './utils/grid.utils';

import CellActionModal from './components/modals/CellActionModal';
import DiaryModal from './components/modals/DiaryModal';
import ElderModal from './components/modals/ElderModal';
import InventoryModal from './components/modals/InventoryModal';
import MarketModal from './components/modals/MarketModal';
import SettingsModal from './components/modals/SettingsModal';
import FloatingButtons from './components/FloatingButtons';
import GameGrid from './components/GameGrid';
import HUD from './components/HUD';
import ToastContainer from './components/ToastContainer';
import GameOverScreen from './screens/GameOverScreen';
import StartScreen from './screens/StartScreen';

import {
  Anchor, Axe, Factory, Hammer,
  Home, Landmark, Tent, Wheat,
} from 'lucide-react';

// --- CSS injection ---
const GAME_CSS = `
  body { margin: 0; font-family: 'Inter', system-ui, sans-serif; background-color: #86efac; color: #1e293b; user-select: none; -webkit-tap-highlight-color: transparent; }
  .game-container { max-width: 600px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background: #bbf7d0; box-shadow: 0 0 50px rgba(0,0,0,0.1); position: relative; padding-bottom: 120px; }

  .hud-wrapper { background: #0f172a; color: #f8fafc; border-bottom: 4px solid #1e293b; padding: 12px 20px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); position: sticky; top: 0; z-index: 10; border-radius: 0 0 24px 24px; margin-bottom: 10px; transition: background 2s; }
  .hud-wrapper.night { background: #090e17; border-bottom-color: #0f172a; }

  .hud-main-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .stat-card { background: #1e293b; border: 2px solid #334155; border-radius: 12px; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-weight: 800; font-size: 13px; transition: all 0.2s ease; }
  .stat-card.highlight { border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
  .stat-card.gold { border-color: #fbbf24; color: #fbbf24; }
  .stat-card-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; text-align: center; }
  .stat-card-value { display: flex; align-items: center; justify-content: center; gap: 4px; }

  .floating-btn-container { position: fixed; bottom: 20px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; padding: 0 15px; z-index: 20; pointer-events: none; max-width: 600px; margin: 0 auto; flex-wrap: wrap; }
  .floating-btn { pointer-events: auto; padding: 12px 14px; border-radius: 30px; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 3px solid white; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: transform 0.1s; flex: 1; max-width: 140px; white-space: nowrap; }
  .floating-btn:active { transform: scale(0.95); }
  .floating-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-inventory { background: #3b82f6; color: white; }
  .btn-diary { background: #a855f7; color: white; }
  .btn-market { background: #fbbf24; color: #713f12; }
  .btn-settings { background: #475569; color: white; }
  .btn-sleep { background: #1e3a8a; color: white; border-color: #3b82f6; }
  .btn-elder { background: #8b5cf6; color: white; border-color: #d8b4fe; box-shadow: 0 0 20px rgba(139, 92, 246, 0.6); position: fixed; right: 20px; top: 120px; flex: none; width: auto; z-index: 30; padding: 12px 18px; border-radius: 50px; }

  .badge-notification { position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; font-size: 11px; font-weight: 900; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); animation: bounce-strong 1s infinite; }
  @keyframes bounce-strong { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px) scale(1.1); } }
  .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 100; pointer-events: none; width: 90%; max-width: 400px; }
  .toast { background: #4ade80; color: #064e3b; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px rgba(74, 222, 128, 0.4); border: 2px solid white; animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1), fadeOut 0.4s 3.6s forwards; }
  .toast-danger { background: #ef4444; color: white; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); border-color: #fca5a5; }
  @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes fadeOut { to { opacity: 0; transform: translateY(-20px); } }

  .diary-item { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 15px; margin-bottom: 12px; display: flex; gap: 15px; transition: all 0.3s ease; position: relative; overflow: hidden; }
  .diary-item.done { background: #f0fdf4; border-color: #4ade80; opacity: 0.8; }
  .diary-item.active { background: #eff6ff; border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); transform: translateY(-2px); }
  .diary-item.locked { background: #f1f5f9; border-color: #cbd5e1; opacity: 0.6; filter: grayscale(1); }
  .diary-icon-wrap { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #e2e8f0; color: #64748b; }
  .diary-item.done .diary-icon-wrap { background: #4ade80; color: white; }
  .diary-item.active .diary-icon-wrap { background: #3b82f6; color: white; }
  .diary-content { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; }
  .diary-title { font-weight: 800; font-size: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px; }
  .diary-desc { font-size: 12px; color: #64748b; line-height: 1.4; }
  .diary-goal { font-size: 12px; font-weight: 700; color: #0f172a; background: rgba(0,0,0,0.05); padding: 6px 10px; border-radius: 8px; margin-top: 4px; display: inline-block; }
  .diary-item.active .diary-goal { background: #dbeafe; color: #1d4ed8; }
  .diary-item.done .diary-goal { background: #dcfce7; color: #15803d; text-decoration: line-through; }

  .inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .inventory-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .inventory-val { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }
  .inventory-name { font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

  .grid-wrapper { padding: 5px 15px 15px; flex-grow: 1; display: flex; align-items: flex-start; justify-content: center; position: relative; }
  .night-overlay { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 40; pointer-events: none; opacity: 0; transition: opacity 1.5s ease-in-out; display: flex; align-items: center; justify-content: center; border-radius: 12px; margin: 5px 15px 15px; }
  .night-overlay.active { opacity: 1; pointer-events: auto; }
  .night-text { color: #cbd5e1; font-size: 2rem; font-weight: 900; text-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; gap: 10px; }

  .farming-grid { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); gap: 3px; background: #15803d; padding: 4px; border-radius: 12px; width: 100%; aspect-ratio: 1 / 1; border: 4px solid #14532d; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
  .cell { background: #4ade80; border-radius: 4px; position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: filter 0.2s; overflow: hidden; }
  .cell:active { filter: brightness(0.9); }
  .cell.busy { cursor: not-allowed; filter: brightness(0.85); }
  .cell.fog { background: #94a3b8; cursor: not-allowed; box-shadow: inset 0 0 15px rgba(0,0,0,0.1); animation: fogPulse 4s infinite alternate; }
  @keyframes fogPulse { 0% { filter: brightness(1); } 100% { filter: brightness(1.15); } }
  .cell.plowed { background: repeating-linear-gradient(180deg, #92400e, #92400e 20%, #78350f 20%, #78350f 25%); }
  .cell.water { background: #0ea5e9; box-shadow: inset 0 0 10px rgba(2, 132, 199, 0.5); }
  .cell.wild_animal { background: #86efac; }
  .cell.wolf { background: #e2e8f0; box-shadow: inset 0 0 10px rgba(0,0,0,0.2); }

  .progress-container { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
  .progress-bar-bg { position: absolute; bottom: 4px; width: 80%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); z-index: 20; }
  .progress-bar-fill { height: 100%; transition: width 0.1s linear; }

  @keyframes strikeAnim { 0% { transform: rotate(-40deg); } 100% { transform: rotate(30deg); } }
  @keyframes farmAnim { 0% { transform: rotate(-10deg) translateY(-2px); } 100% { transform: rotate(25deg) translateY(4px); } }
  @keyframes huntAnim { 0% { transform: translateX(0) rotate(0deg); } 40% { transform: translateX(-5px) rotate(-15deg); } 100% { transform: translateX(12px) rotate(20deg); } }
  .anim-strike { animation: strikeAnim 0.3s infinite alternate ease-in-out; }
  .anim-farm { animation: farmAnim 0.4s infinite alternate ease-in-out; }
  .anim-hunt { animation: huntAnim 0.5s infinite alternate cubic-bezier(0.25, 0.46, 0.45, 0.94); }

  .action-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 50; backdrop-filter: blur(2px); }
  .action-modal { background: white; width: 100%; max-width: 600px; border-radius: 24px 24px 0 0; padding: 25px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; max-height: 85vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; position: sticky; top: 0; background: white; z-index: 5; }

  .action-btn { width: 100%; padding: 14px; border-radius: 16px; border: none; font-weight: 800; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: transform 0.1s; margin-bottom: 10px; position: relative; }
  .action-btn:active { transform: scale(0.98); }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(0.5); }
  .action-badge { position: absolute; right: 15px; background: rgba(0,0,0,0.2); font-size: 11px; padding: 4px 8px; border-radius: 8px; color: white; display:flex; align-items:center; gap: 4px; }

  .btn-plow { background: #92400e; color: white; }
  .btn-harvest { background: #fbbf24; color: #713f12; }
  .btn-chop { background: #475569; color: white; }
  .btn-build { background: #1e293b; color: white; }
  .btn-plant-forest { background: #14532d; color: white; }
  .btn-sell-direct { background: #eab308; color: white; }
  .btn-fishing { background: #0284c7; color: white; }
  .btn-port { background: #1e3a8a; color: white; }

  .market-section-title { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 15px 0 10px; }
  .market-item { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 8px; }
  .market-item-info { display: flex; align-items: center; gap: 12px; }
  .btn-buy, .btn-sell, .btn-sell-all { padding: 8px 12px; margin: 0; font-size: 13px; width: auto; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; color: white; }
  .btn-buy { background: #10b981; } .btn-sell { background: #eab308; } .btn-sell-all { background: #f59e0b; }

  .fullscreen-menu { position: fixed; inset: 0; background: #0f172a; z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 20px; }
  .fullscreen-menu h1 { font-size: 3rem; color: #4ade80; margin-bottom: 10px; font-weight: 900; letter-spacing: -1px; }
  .fullscreen-menu p { color: #94a3b8; font-size: 1.1rem; max-width: 500px; margin-bottom: 40px; line-height: 1.5; }
  .btn-start { background: #3b82f6; color: white; padding: 18px 40px; font-size: 1.4rem; font-weight: 800; border: none; border-radius: 50px; cursor: pointer; transition: transform 0.2s, background 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4); width: 100%; max-width: 300px;}
  .btn-start:hover { background: #2563eb; transform: scale(1.05); }
  .game-over-title { color: #ef4444 !important; }

  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }

  .elder-chat-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; gap: 15px; align-items: flex-start; }
  .elder-avatar { background: #8b5cf6; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4); }
  .elder-text { font-size: 15px; color: #1e293b; line-height: 1.5; font-style: italic; }
  .loading-dots:after { content: '.'; animation: dots 1.5s steps(5, end) infinite; }
  @keyframes dots { 0%, 20% { color: rgba(0,0,0,0); text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); } 40% { color: #1e293b; text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); } 60% { text-shadow: .25em 0 0 #1e293b, .5em 0 0 rgba(0,0,0,0); } 80%, 100% { text-shadow: .25em 0 0 #1e293b, .5em 0 0 #1e293b; } }
`;

declare var __initial_auth_token: string | undefined;

const Game: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>('start');
  const [user, setUser] = useState<any>(null);
  const [hasSave, setHasSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [dayCount, setDayCount] = useState(1);
  const [isNight, setIsNight] = useState(false);
  const [actionsUsedToday, setActionsUsedToday] = useState(0);

  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [unlocked, setUnlocked] = useState<UnlockedBuildings>(INITIAL_UNLOCKED);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);

  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [unreadQuests, setUnreadQuests] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [grid, setGrid] = useState<Cell[]>(generateInitialGrid);
  const [now, setNow] = useState(Date.now());
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [respawningFarmers, setRespawningFarmers] = useState<number[]>([]);

  const gridRef = useRef(grid);
  const respawningRef = useRef(respawningFarmers);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stateRef = useRef({ inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday });

  useEffect(() => {
    stateRef.current = { inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday };
  }, [inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday]);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { respawningRef.current = respawningFarmers; }, [respawningFarmers]);

  // --- CSS injection ---
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = GAME_CSS;
    document.head.appendChild(styleTag);
    return () => { document.head.removeChild(styleTag); };
  }, []);

  // --- FIREBASE AUTH ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error('Auth error', e); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- DERIVED STATE ---
  const totalPorts = grid.filter(c => c.type === 'port').length;
  const baseFarmers = BASE_INITIAL_FARMERS +
    grid.filter(c => c.type === 'house').length * 1 +
    grid.filter(c => c.type === 'village').length * 6 +
    grid.filter(c => c.type === 'city').length * 30 +
    grid.filter(c => c.type === 'county').length * 100;

  const totalFarmers = Math.max(0, baseFarmers - (totalPorts * COSTS.port.farmers) - respawningFarmers.length);

  const busyFarmers = grid.reduce((sum, c) => {
    if (c.pendingAction && !['growing', 'active_mine', 'fishing', 'active_forest'].includes(c.pendingAction)) {
      return sum + (c.farmersUsed || 1);
    }
    return sum;
  }, 0);

  const actionsLeft = Math.max(0, totalFarmers - actionsUsedToday);
  const totalAnimals = grid.reduce((sum, cell) => sum + (cell.animalCount || 0), 0);
  const busyShips = grid.filter(c => c.pendingAction === 'fishing').length;
  const availableShips = totalPorts - busyShips;

  // --- GAME OVER ---
  useEffect(() => {
    if (gameState === 'playing' && totalFarmers <= 0) setGameState('gameover');
  }, [totalFarmers, gameState]);

  // --- REACHABLE CELLS ---
  const reachableCells = useMemo(() => {
    const reachable = new Set<number>();
    const queue = [27];
    reachable.add(27);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = [];
      if (curr >= 8) neighbors.push(curr - 8);
      if (curr < 56) neighbors.push(curr + 8);
      if (curr % 8 !== 0) neighbors.push(curr - 1);
      if ((curr + 1) % 8 !== 0) neighbors.push(curr + 1);
      for (const n of neighbors) {
        if (!reachable.has(n)) {
          reachable.add(n);
          if (grid[n].type !== 'water' || totalPorts > 0) queue.push(n);
        }
      }
    }
    return reachable;
  }, [grid, totalPorts]);

  // --- QUESTS ---
  const ALL_QUESTS = useMemo((): QuestDefinition[] => [
    { id: 'q1', icon: Axe, title: 'Sopravvivenza Base', desc: "Clicca sugli alberi e sulle rocce verdi della mappa per raccogliere i materiali primari.", goal: 'Ottieni 10 Legna e 10 Pietra.', isDone: () => inventory.wood >= 10 && inventory.stone >= 10 },
    { id: 'q2', icon: Home, title: 'Un Tetto Sopra la Testa', desc: "Clicca su un prato verde e costruisci una Casa.", goal: 'Costruisci la tua prima nuova Casa.', isDone: () => grid.filter(c => c.type === 'house').length > 1 || grid.some(c => ['village','city','county'].includes(c.type)) },
    { id: 'q3', icon: Wheat, title: 'I Frutti della Terra', desc: "Ara un terreno, pianta dei semi di Grano e attendi la crescita.", goal: "Ottieni del Grano nell'inventario.", isDone: () => inventory.wheat > 0 },
    { id: 'q4', icon: Factory, title: "L'Età dell'Industria", desc: "Costruisci una Segheria e usala per trasformare la legna.", goal: 'Costruisci una Segheria e crea la tua prima Asse.', isDone: () => inventory.planks > 0 },
    { id: 'q5', icon: Anchor, title: "Verso l'Ignoto", desc: "Costruisci un Porto sull'erba vicino all'acqua.", goal: 'Costruisci un Porto per diradare la nebbia.', isDone: () => totalPorts > 0 },
    { id: 'q6', icon: Hammer, title: 'Profondità Oscure', desc: "Trasforma una Roccia in una Miniera permanente.", goal: 'Costruisci una Miniera.', isDone: () => grid.some(c => c.type === 'mine') },
    { id: 'q7', icon: Tent, title: 'Urbanistica', desc: "Metti 4 Case vicine a formare un quadrato 2x2.", goal: 'Fonda un Villaggio.', isDone: () => grid.some(c => ['village','city','county'].includes(c.type)) },
    { id: 'q8', icon: Landmark, title: "L'Impero", desc: "Continua a fondere i tuoi insediamenti.", goal: 'Fonda la gloriosa Contea.', isDone: () => grid.some(c => c.type === 'county') },
  ], [inventory, grid, totalPorts]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const activeQuestIndex = ALL_QUESTS.findIndex(q => !completedQuests.includes(q.id));
    if (activeQuestIndex !== -1) {
      const quest = ALL_QUESTS[activeQuestIndex];
      if (quest.isDone()) {
        setCompletedQuests(prev => [...prev, quest.id]);
        setUnreadQuests(prev => prev + 1);
        const toastId = 'q-' + quest.id;
        setToasts(prev => [...prev, { id: toastId, title: quest.title, type: 'success' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000);
      }
    }
  }, [ALL_QUESTS, completedQuests, gameState]);

  // --- UNLOCK BUILDINGS ---
  useEffect(() => {
    setUnlocked(prev => {
      let changed = false;
      const next = { ...prev };
      const checkUnlock = (key: keyof UnlockedBuildings, condition: boolean) => {
        if (!next[key] && condition) { next[key] = true; changed = true; }
      };
      checkUnlock('tree', inventory.coins >= COSTS.tree.coins && totalFarmers >= COSTS.tree.farmers);
      checkUnlock('forest', inventory.coins >= COSTS.forest.coins && inventory.stone >= COSTS.forest.stone && totalFarmers >= COSTS.forest.farmers);
      checkUnlock('house', inventory.wood >= COSTS.house.wood && inventory.stone >= COSTS.house.stone);
      checkUnlock('animal_farm', inventory.wheat >= COSTS.animal_farm.wheat && inventory.wood >= COSTS.animal_farm.wood && inventory.stone >= COSTS.animal_farm.stone && inventory.coins >= COSTS.animal_farm.coins && totalFarmers >= COSTS.animal_farm.farmers);
      checkUnlock('lumber_mill', inventory.wood >= COSTS.lumber_mill.wood && inventory.stone >= COSTS.lumber_mill.stone && inventory.coins >= COSTS.lumber_mill.coins && totalFarmers >= COSTS.lumber_mill.farmers);
      checkUnlock('stone_mason', inventory.wood >= COSTS.stone_mason.wood && inventory.stone >= COSTS.stone_mason.stone && inventory.coins >= COSTS.stone_mason.coins && totalFarmers >= COSTS.stone_mason.farmers);
      checkUnlock('mine', inventory.wood >= COSTS.mine.wood && inventory.coins >= COSTS.mine.coins && totalFarmers >= COSTS.mine.farmers);
      checkUnlock('port', inventory.wood >= COSTS.port.wood && inventory.stone >= COSTS.port.stone && inventory.coins >= COSTS.port.coins && totalFarmers >= COSTS.port.farmers);
      checkUnlock('rock', inventory.coins >= COSTS.rock.coins && totalFarmers >= COSTS.rock.farmers);
      checkUnlock('village', inventory.coins >= COSTS.village.coins && totalFarmers >= COSTS.village.farmers);
      checkUnlock('city', inventory.coins >= COSTS.city.coins && totalFarmers >= COSTS.city.farmers);
      checkUnlock('county', inventory.coins >= COSTS.county.coins && totalFarmers >= COSTS.county.farmers);
      return changed ? next : prev;
    });
  }, [inventory, totalFarmers]);

  // --- DAY/NIGHT ---
  const endDay = () => {
    setIsNight(true);
    setSelectedCell(null);
    setGrid(prev => prev.map(c => {
      if (c.busyUntil && c.pendingAction !== 'fishing' && c.pendingAction !== 'active_forest' && c.pendingAction !== 'active_mine' && c.pendingAction !== 'growing') {
        return { ...c, busyUntil: Date.now() };
      }
      return c;
    }));
    setTimeout(() => {
      setIsNight(false);
      setDayCount(d => d + 1);
      setActionsUsedToday(0);
    }, 5000);
  };

  useEffect(() => {
    if (actionsLeft <= 0 && busyFarmers === 0 && !isNight && totalFarmers > 0 && gameState === 'playing') {
      const t = setTimeout(() => endDay(), 1500);
      return () => clearTimeout(t);
    }
  }, [actionsLeft, busyFarmers, isNight, totalFarmers, gameState]);

  // --- EVENTI NOTTURNI ---
  useEffect(() => {
    if (!isNight || gameState !== 'playing') return;
    setGrid(prevGrid => {
      let newGrid = [...prevGrid];
      let gridChanged = false;
      const movedTo = new Set<number>();

      const getNeighbors = (i: number) => {
        const n = [];
        if (i >= 8) n.push(i - 8);
        if (i < 56) n.push(i + 8);
        if (i % 8 !== 0) n.push(i - 1);
        if ((i + 1) % 8 !== 0) n.push(i + 1);
        return n;
      };

      const getWolvesPos = () => newGrid.map((c, idx) => c.type === 'wolf' ? idx : -1).filter(idx => idx !== -1);

      // 1. MOVIMENTO E FUGA CONIGLI
      for (let i = 0; i < newGrid.length; i++) {
        const cell = newGrid[i];
        if (cell.type === 'wild_animal' && !movedTo.has(i) && !cell.busyUntil && cell.pendingAction === null) {
          const neighbors = getNeighbors(i);

          const mergeTarget = neighbors.find(n => newGrid[n].type === 'wild_animal' && !movedTo.has(n));
          if (mergeTarget !== undefined) {
            const totalCount = Math.min(10, (cell.wildAnimalCount || 1) + (newGrid[mergeTarget].wildAnimalCount || 1));
            newGrid[mergeTarget] = { ...newGrid[mergeTarget], wildAnimalCount: totalCount };
            newGrid[i] = { ...newGrid[i], type: 'grass', wildAnimalCount: undefined, wildReproductionTargetTime: undefined };
            movedTo.add(mergeTarget); movedTo.add(i); gridChanged = true;
            continue;
          }

          const validGrass = neighbors.filter(n => newGrid[n].type === 'grass' && !newGrid[n].busyUntil && newGrid[n].pendingAction === null);
          if (validGrass.length > 0) {
            const currentWolves = getWolvesPos();
            let target = validGrass[Math.floor(Math.random() * validGrass.length)];
            if (currentWolves.length > 0) {
              let bestTiles = [target];
              let maxMinDist = -1;
              for (const move of validGrass) {
                let minDistToWolf = 999;
                for (const w of currentWolves) {
                  const dist = Math.abs((w % 8) - (move % 8)) + Math.abs(Math.floor(w / 8) - Math.floor(move / 8));
                  if (dist < minDistToWolf) minDistToWolf = dist;
                }
                if (minDistToWolf > maxMinDist) { maxMinDist = minDistToWolf; bestTiles = [move]; }
                else if (minDistToWolf === maxMinDist) bestTiles.push(move);
              }
              target = bestTiles[Math.floor(Math.random() * bestTiles.length)];
            }
            newGrid[target] = { ...newGrid[target], type: 'wild_animal', wildAnimalCount: cell.wildAnimalCount, wildReproductionTargetTime: cell.wildReproductionTargetTime };
            newGrid[i] = { ...newGrid[i], type: 'grass', wildAnimalCount: undefined, wildReproductionTargetTime: undefined };
            movedTo.add(target); movedTo.add(i); gridChanged = true;
          }
        }
      }

      // 2. MOVIMENTO E CACCIA LUPI (ogni 3 notti)
      if (dayCount % 2 === 0) {
        for (let i = 0; i < newGrid.length; i++) {
          const cell = newGrid[i];
          if (cell.type === 'wolf' && !movedTo.has(i) && !cell.busyUntil && cell.pendingAction === null) {
            const neighbors = getNeighbors(i);

            // Attacca conigli adiacenti
            const adjRabbits = neighbors.filter(n => newGrid[n].type === 'wild_animal');
            if (adjRabbits.length > 0) {
              const targetRabbit = adjRabbits[0];
              const rCount = newGrid[targetRabbit].wildAnimalCount || 1;
              const wCount = cell.wolfCount || 1;
              if (wCount >= rCount) {
                newGrid[targetRabbit] = { ...newGrid[targetRabbit], type: 'grass', wildAnimalCount: undefined, wildReproductionTargetTime: undefined };
              } else {
                newGrid[targetRabbit] = { ...newGrid[targetRabbit], wildAnimalCount: rCount - 1 };
              }
              movedTo.add(i); gridChanged = true;
              continue;
            }

            // Fusione lupi
            const mergeTarget = neighbors.find(n => newGrid[n].type === 'wolf' && !movedTo.has(n));
            if (mergeTarget !== undefined) {
              const totalCount = Math.min(10, (cell.wolfCount || 1) + (newGrid[mergeTarget].wolfCount || 1));
              newGrid[mergeTarget] = { ...newGrid[mergeTarget], wolfCount: totalCount };
              newGrid[i] = { ...newGrid[i], type: 'grass', wolfCount: undefined };
              movedTo.add(mergeTarget); movedTo.add(i); gridChanged = true;
              continue;
            }

            // Movimento verso conigli
            const validGrass = neighbors.filter(n => newGrid[n].type === 'grass' && !newGrid[n].busyUntil && newGrid[n].pendingAction === null);
            if (validGrass.length > 0) {
              const currentRabbits = newGrid.map((c, idx) => c.type === 'wild_animal' ? idx : -1).filter(idx => idx !== -1);
              let target = validGrass[Math.floor(Math.random() * validGrass.length)];
              if (currentRabbits.length > 0) {
                let bestTiles = [target];
                let minMinDist = 999;
                for (const move of validGrass) {
                  let minDistToRabbit = 999;
                  for (const r of currentRabbits) {
                    const dist = Math.abs((r % 8) - (move % 8)) + Math.abs(Math.floor(r / 8) - Math.floor(move / 8));
                    if (dist < minDistToRabbit) minDistToRabbit = dist;
                  }
                  if (minDistToRabbit < minMinDist) { minMinDist = minDistToRabbit; bestTiles = [move]; }
                  else if (minDistToRabbit === minMinDist) bestTiles.push(move);
                }
                target = bestTiles[Math.floor(Math.random() * bestTiles.length)];
              }
              newGrid[target] = { ...newGrid[target], type: 'wolf', wolfCount: cell.wolfCount };
              newGrid[i] = { ...newGrid[i], type: 'grass', wolfCount: undefined };
              movedTo.add(target); movedTo.add(i); gridChanged = true;
            }
          }
        }
      }

      // Spawn alberi
      const emptyGrass = newGrid.map((c, idx) => c.type === 'grass' && !c.busyUntil && c.pendingAction === null ? idx : -1).filter(idx => idx !== -1);
      if (emptyGrass.length > 0) {
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        for (let k = 0; k < spawnCount; k++) {
          if (emptyGrass.length === 0) break;
          const randIndex = Math.floor(Math.random() * emptyGrass.length);
          const cellId = emptyGrass[randIndex];
          newGrid[cellId] = { ...newGrid[cellId], type: 'tree' };
          emptyGrass.splice(randIndex, 1);
          gridChanged = true;
        }
      }

      // Auto-merge alberi in foresta (2x2)
      for (let i = 0; i < newGrid.length; i++) {
        if (newGrid[i].type === 'tree' && !newGrid[i].busyUntil && newGrid[i].pendingAction === null) {
          const col = i % 8; const row = Math.floor(i / 8);
          if (col < 7 && row < 7) {
            const [tl, tr, bl, br] = [i, i + 1, i + 8, i + 9];
            const isIdleTree = (idx: number) => newGrid[idx].type === 'tree' && !newGrid[idx].busyUntil && newGrid[idx].pendingAction === null;
            if (isIdleTree(tr) && isIdleTree(bl) && isIdleTree(br)) {
              newGrid[tl] = { ...newGrid[tl], type: 'forest', pendingAction: null, busyUntil: null, busyTotalDuration: null };
              newGrid[tr] = { ...newGrid[tr], type: 'grass' };
              newGrid[bl] = { ...newGrid[bl], type: 'grass' };
              newGrid[br] = { ...newGrid[br], type: 'grass' };
              gridChanged = true;
            }
          }
        }
      }

      return gridChanged ? newGrid : prevGrid;
    });
  }, [isNight, gameState, dayCount]);

  // --- HOOKS ---
  useGameLoop({ gameState, setGrid, setInventory, setNow, setRespawningFarmers, respawningRef });
  useGameEvents({ gameState, gridRef, respawningRef, setGrid, setRespawningFarmers, setToasts });

  const { handleSaveGame, handleLoadGame, handleExportSave, handleImportSave } = useSave({
    gameState, user, stateRef, isSaving, setIsSaving, setHasSave, setToasts,
    setInventory, setUnlocked, setGrid, setCompletedQuests,
    setRespawningFarmers, setDayCount, setActionsUsedToday, setIsNight, setGameState,
  });

  const { showElderModal, setShowElderModal, elderMessage, isElderThinking, askVillageElder } = useVillageElder();

  // --- CHECK SAVE ON LOAD (locale + cloud) ---
  useEffect(() => {
    const localSave = localStorage.getItem('fattoria_avanzata_save');
    if (localSave) setHasSave(true);

    if (!user || !db) return;
    const checkCloudSave = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'savegame', 'data');
        const snap = await getDoc(docRef);
        if (snap.exists()) setHasSave(true);
      } catch (e) {
        console.error('Check Save Error', e);
      }
    };
    checkCloudSave();
  }, [user]);

  // --- ACTIONS ---
  const startNewGame = () => {
    setInventory(INITIAL_INVENTORY);
    setUnlocked(INITIAL_UNLOCKED);
    setGrid(generateInitialGrid());
    setRespawningFarmers([]);
    setCompletedQuests([]);
    setUnreadQuests(0);
    setDayCount(1);
    setActionsUsedToday(0);
    setIsNight(false);
    setToasts([]);
    setSelectedCell(null);
    setGameState('playing');
  };

  const startAction = (cellId: number, action: ActionType) => {
    if (isNight) return;
    const cell = grid.find(c => c.id === cellId);
    if (!cell) return;

    // Azione speciale: vendi animale direttamente dalla cella
    if (action === 'sell_animal') {
      setGrid(prev => {
        const nextGrid = [...prev];
        const idx = nextGrid.findIndex(c => c.id === cellId);
        if (idx !== -1 && nextGrid[idx].animalCount! > 0) {
          nextGrid[idx] = { ...nextGrid[idx], animalCount: nextGrid[idx].animalCount! - 1 };
        }
        return nextGrid;
      });
      setInventory(prev => ({ ...prev, coins: prev.coins + 100 }));
      setSelectedCell(null);
      return;
    }

    if (action === 'fishing') {
      if (availableShips < 1) return;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, pendingAction: action, lastTickTime: Date.now(), fishingTicks: 0 } : c));
      setSelectedCell(null);
      return;
    }

    let costFarmers = 1;
    if (action === 'hunting') costFarmers = 2;
    else if (action === 'hunting_wolf') costFarmers = 3;
    else if (action === 'start_active_forest') costFarmers = 3;
    else if (action?.startsWith('building_')) costFarmers = COSTS[action.replace('building_', '') as keyof typeof COSTS]?.farmers || 1;
    else if (action === 'planting_tree') costFarmers = COSTS.tree.farmers;
    else if (action === 'planting_forest') costFarmers = COSTS.forest.farmers;
    else if (action === 'spawn_rock') costFarmers = COSTS.rock.farmers;

    if (actionsLeft < costFarmers) return;

    if (action === 'start_active_forest') {
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, pendingAction: 'active_forest', lastTickTime: Date.now(), forestTicks: 0, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'hunting') {
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.hunting, busyTotalDuration: ACTION_TIMES.hunting, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'hunting_wolf') {
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.hunting_wolf, busyTotalDuration: ACTION_TIMES.hunting_wolf, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    const buildingCosts: Record<string, () => boolean> = {
      building_house: () => inventory.wood >= COSTS.house.wood && inventory.stone >= COSTS.house.stone,
      building_port: () => inventory.wood >= COSTS.port.wood && inventory.stone >= COSTS.port.stone && inventory.coins >= COSTS.port.coins && (baseFarmers - ((totalPorts + 1) * COSTS.port.farmers) - respawningFarmers.length) >= 1,
      building_lumber_mill: () => inventory.wood >= COSTS.lumber_mill.wood && inventory.stone >= COSTS.lumber_mill.stone && inventory.coins >= COSTS.lumber_mill.coins,
      building_stone_mason: () => inventory.wood >= COSTS.stone_mason.wood && inventory.stone >= COSTS.stone_mason.stone && inventory.coins >= COSTS.stone_mason.coins,
      building_mine: () => inventory.wood >= COSTS.mine.wood && inventory.coins >= COSTS.mine.coins,
      building_animal_farm: () => inventory.wheat >= COSTS.animal_farm.wheat && inventory.wood >= COSTS.animal_farm.wood && inventory.stone >= COSTS.animal_farm.stone && inventory.coins >= COSTS.animal_farm.coins,
    };

    const buildingInventoryUpdates: Record<string, () => Partial<Inventory>> = {
      building_house: () => ({ wood: inventory.wood - COSTS.house.wood, stone: inventory.stone - COSTS.house.stone }),
      building_port: () => ({ wood: inventory.wood - COSTS.port.wood, stone: inventory.stone - COSTS.port.stone, coins: inventory.coins - COSTS.port.coins }),
      building_lumber_mill: () => ({ wood: inventory.wood - COSTS.lumber_mill.wood, stone: inventory.stone - COSTS.lumber_mill.stone, coins: inventory.coins - COSTS.lumber_mill.coins }),
      building_stone_mason: () => ({ wood: inventory.wood - COSTS.stone_mason.wood, stone: inventory.stone - COSTS.stone_mason.stone, coins: inventory.coins - COSTS.stone_mason.coins }),
      building_mine: () => ({ wood: inventory.wood - COSTS.mine.wood, coins: inventory.coins - COSTS.mine.coins }),
      building_animal_farm: () => ({ wheat: inventory.wheat - COSTS.animal_farm.wheat, wood: inventory.wood - COSTS.animal_farm.wood, stone: inventory.stone - COSTS.animal_farm.stone, coins: inventory.coins - COSTS.animal_farm.coins }),
    };

    if (action && action in buildingCosts) {
      if (!buildingCosts[action]()) return;
      setInventory(prev => ({ ...prev, ...buildingInventoryUpdates[action]() }));
      const duration = ACTION_TIMES[action as keyof typeof ACTION_TIMES] || 15000;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    const mergeActions: Record<string, { sourceType: CellType; cost: keyof typeof COSTS }> = {
      building_village: { sourceType: 'house', cost: 'village' },
      building_city: { sourceType: 'village', cost: 'city' },
      building_county: { sourceType: 'city', cost: 'county' },
    };

    if (action && action in mergeActions) {
      const { sourceType, cost } = mergeActions[action as keyof typeof mergeActions];
      const targetCells = getMergeableCells(cellId, sourceType, grid);
      const costCoins = (COSTS[cost] as any).coins;
      if (!targetCells || inventory.coins < costCoins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - costCoins }));
      const duration = ACTION_TIMES[action as keyof typeof ACTION_TIMES] || 20000;
      setGrid(prev => prev.map(c => {
        if (c.id === cellId) return { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers };
        if (targetCells.includes(c.id)) return { ...c, type: 'grass', pendingAction: null, busyUntil: null, busyTotalDuration: null, farmersUsed: undefined };
        return c;
      }));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'crafting_planks') {
      if (inventory.wood < 2) return;
      setInventory(prev => ({ ...prev, wood: prev.wood - 2 }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.crafting, busyTotalDuration: ACTION_TIMES.crafting, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'crafting_bricks') {
      if (inventory.stone < 2) return;
      setInventory(prev => ({ ...prev, stone: prev.stone - 2 }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.crafting, busyTotalDuration: ACTION_TIMES.crafting, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'planting_tree') {
      if (inventory.coins < COSTS.tree.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.tree.coins }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.planting_tree, busyTotalDuration: ACTION_TIMES.planting_tree, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'planting_forest') {
      if (inventory.coins < COSTS.forest.coins || inventory.stone < COSTS.forest.stone) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.forest.coins, stone: prev.stone - COSTS.forest.stone }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.planting_forest, busyTotalDuration: ACTION_TIMES.planting_forest, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'spawn_rock') {
      if (inventory.coins < COSTS.rock.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.rock.coins }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.spawn_rock, busyTotalDuration: ACTION_TIMES.spawn_rock, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action?.startsWith('planting_') && action !== 'planting_forest' && action !== 'planting_tree') {
      const cropId = action.split('_')[1] as CropId;
      const seedKey = `${cropId}Seeds` as keyof Inventory;
      if ((inventory[seedKey] as number) < 1) return;
      setInventory(prev => ({ ...prev, [seedKey]: (prev[seedKey] as number) - 1 }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.planting, busyTotalDuration: ACTION_TIMES.planting, pendingAction: action, cropType: cropId, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (['plowing', 'chopping', 'mining', 'harvesting'].includes(action as string)) {
      const duration = ACTION_TIMES[action as keyof typeof ACTION_TIMES];
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
    }

    setSelectedCell(null);
  };

  const buySeed = (cropId: CropId) => {
    const cost = CROPS[cropId].seedCost;
    if (inventory.coins >= cost) setInventory(prev => ({ ...prev, coins: prev.coins - cost, [`${cropId}Seeds`]: (prev[`${cropId}Seeds` as keyof Inventory] as number) + 1 }));
  };

  const sellResource = (itemKey: keyof Inventory, amount: number, pricePerUnit: number) => {
    if ((inventory[itemKey] as number) >= amount) setInventory(prev => ({ ...prev, coins: prev.coins + (amount * pricePerUnit), [itemKey]: (prev[itemKey] as number) - amount }));
  };

  const sellAnimals = (amount: number, pricePerUnit: number) => {
    let remainingToSell = amount;
    setGrid(prev => {
      const nextGrid = [...prev];
      for (let i = 0; i < nextGrid.length; i++) {
        if (remainingToSell <= 0) break;
        if (nextGrid[i].type === 'animal_farm' && nextGrid[i].animalCount! > 0) {
          const available = nextGrid[i].animalCount!;
          const toTake = Math.min(available, remainingToSell);
          nextGrid[i] = { ...nextGrid[i], animalCount: available - toTake };
          remainingToSell -= toTake;
        }
      }
      return nextGrid;
    });
    setInventory(prev => ({ ...prev, coins: prev.coins + (amount * pricePerUnit) }));
  };

  // --- RENDER ---
  if (gameState === 'start') {
    return <StartScreen hasSave={hasSave} onNewGame={startNewGame} onLoadGame={handleLoadGame} />;
  }

  if (gameState === 'gameover') {
    return <GameOverScreen onRestart={startNewGame} />;
  }

  const activeCell = selectedCell !== null ? grid.find(c => c.id === selectedCell) : null;
  const isReachable = activeCell ? reachableCells.has(activeCell.id) : false;

  const isAdjacentToWater = activeCell
    ? [activeCell.id - 8, activeCell.id + 8,
       activeCell.id % 8 !== 0 ? activeCell.id - 1 : -1,
       (activeCell.id + 1) % 8 !== 0 ? activeCell.id + 1 : -1]
        .filter(n => n >= 0 && n < 64)
        .some(n => grid[n].type === 'water')
    : false;

  return (
    <div className="game-container">
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportSave} style={{ display: 'none' }} />

      <ToastContainer toasts={toasts} />

      <HUD
        coins={inventory.coins}
        totalFarmers={totalFarmers}
        respawningCount={respawningFarmers.length}
        actionsLeft={actionsLeft}
        dayCount={dayCount}
        isNight={isNight}
      />

      <FloatingButtons
        actionsLeft={actionsLeft}
        isNight={isNight}
        unreadQuests={unreadQuests}
        onOpenDiary={() => { setShowDiaryModal(true); setUnreadQuests(0); }}
        onOpenInventory={() => setShowInventoryModal(true)}
        onOpenMarket={() => setShowMarketModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onSleep={endDay}
        onAskElder={() => askVillageElder({ inventory, totalFarmers, availableShips, totalPorts, dayCount, allQuests: ALL_QUESTS, completedQuests })}
      />

      <GameGrid
        grid={grid}
        reachableCells={reachableCells}
        isNight={isNight}
        now={now}
        onCellClick={setSelectedCell}
      />

      {showElderModal && (
        <ElderModal isThinking={isElderThinking} message={elderMessage} onClose={() => setShowElderModal(false)} />
      )}

      {showSettingsModal && (
        <SettingsModal
          isSaving={isSaving}
          onSave={() => handleSaveGame(false)}
          onExport={handleExportSave}
          onImportClick={() => fileInputRef.current?.click()}
          onMainMenu={() => setGameState('start')}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showDiaryModal && (
        <DiaryModal quests={ALL_QUESTS} completedQuests={completedQuests} onClose={() => setShowDiaryModal(false)} />
      )}

      {showInventoryModal && (
        <InventoryModal inventory={inventory} totalAnimals={totalAnimals} onClose={() => setShowInventoryModal(false)} />
      )}

      {showMarketModal && (
        <MarketModal
          inventory={inventory}
          totalAnimals={totalAnimals}
          onBuySeed={buySeed}
          onSellResource={sellResource}
          onSellAnimals={sellAnimals}
          onClose={() => setShowMarketModal(false)}
        />
      )}

      {activeCell && (
        <CellActionModal
          cell={activeCell}
          isReachable={isReachable}
          isAdjacentToWater={isAdjacentToWater}
          inventory={inventory}
          unlocked={unlocked}
          actionsLeft={actionsLeft}
          availableShips={availableShips}
          totalPorts={totalPorts}
          baseFarmers={baseFarmers}
          respawningCount={respawningFarmers.length}
          getMergeableCells={(cellId, targetType) => getMergeableCells(cellId, targetType, grid)}
          onAction={startAction}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
};

export default Game;