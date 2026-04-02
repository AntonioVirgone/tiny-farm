import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Coins, TreePine, Mountain, Axe, Pickaxe,
  Sprout, Wheat, Apple, Carrot, X, Tractor, Store,
  Home, Users, Hammer, Warehouse, PawPrint, Tent,
  Droplets, Fish, Factory, Box, Layers, Rabbit, Crosshair, Bone, Gem,
  Ship, Anchor, Lock, Castle, Landmark, Skull, CloudFog, Package,
  BookMarked, CheckCircle, AlertTriangle, Play, Leaf, Save, Info, Download, Upload,
  Settings, LogOut, Sun, Moon, CalendarDays, Zap, Sparkles
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// --- CONFIGURAZIONE FIREBASE (Per il Salvataggio Cloud & Locale) ---
declare var __firebase_config: string | undefined;
declare var __app_id: string | undefined;
declare var __initial_auth_token: string | undefined;

let app: any = null;
let auth: any = null;
let db: any = null;
let appId = 'local-dev-app'; // ID di default per l'ambiente locale

// Configurazione Firebase locale fornita
const localFirebaseConfig = {
  apiKey: "AIzaSyBI4uaGf4XvlnFJcVDq5lcmQPueD0rJmCo",
  authDomain: "tiny-farm-be44a.firebaseapp.com",
  projectId: "tiny-farm-be44a",
  storageBucket: "tiny-farm-be44a.firebasestorage.app",
  messagingSenderId: "1097896561514",
  appId: "1:1097896561514:web:dbdf4147ccdded6f82b313"
};

try {
  let firebaseConfig = localFirebaseConfig;

  // Se siamo in un ambiente in cui viene iniettata una config diversa, usiamo quella
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof __app_id !== 'undefined' && __app_id) {
    appId = __app_id;
  }
} catch (e) {
  console.warn("Firebase non inizializzato. Il salvataggio cloud potrebbe non essere disponibile.", e);
}

// --- TIPI E CONFIGURAZIONE DELLE PIANTE ---
type CropId = 'wheat' | 'tomato' | 'carrot' | 'eggplant';

interface CropConfig {
  id: CropId;
  name: string;
  seedCost: number;
  growthTime: number;
  minYield: number;
  maxYield: number;
  minSeeds: number;
  maxSeeds: number;
  sellPrice: number;
  icon: React.ElementType;
  color: string;
}

const CROPS: Record<CropId, CropConfig> = {
  wheat: {
    id: 'wheat', name: 'Grano', seedCost: 20, growthTime: 10000,
    minYield: 1, maxYield: 2, minSeeds: 0, maxSeeds: 1, sellPrice: 30,
    icon: Wheat, color: '#ca8a04'
  },
  tomato: {
    id: 'tomato', name: 'Pomodoro', seedCost: 50, growthTime: 20000,
    minYield: 8, maxYield: 12, minSeeds: 2, maxSeeds: 4, sellPrice: 20,
    icon: Apple, color: '#ef4444'
  },
  carrot: {
    id: 'carrot', name: 'Carota', seedCost: 35, growthTime: 15000,
    minYield: 3, maxYield: 5, minSeeds: 1, maxSeeds: 2, sellPrice: 40,
    icon: Carrot, color: '#f97316'
  },
  eggplant: {
    id: 'eggplant', name: 'Melanzana', seedCost: 70, growthTime: 35000,
    minYield: 2, maxYield: 5, minSeeds: 0, maxSeeds: 2, sellPrice: 120,
    icon: Leaf, color: '#481570' // Sostituito Eggplant mancante in Lucide con Leaf
  }
};

// --- ALTRI TIPI E INTERFACCE ---
type CellType = 'grass' | 'water' | 'plowed' | 'growing' | 'ready' | 'tree' | 'forest' | 'rock' | 'house' | 'mine' | 'animal_farm' | 'village' | 'city' | 'county' | 'lumber_mill' | 'stone_mason' | 'wild_animal' | 'port';
type ActionType = 'plowing' | 'chopping' | 'mining' | 'building_house' | 'building_mine' | 'building_animal_farm' | 'planting_tree' | 'planting_forest' | 'building_village' | 'building_city' | 'building_county' | 'building_lumber_mill' | 'building_stone_mason' | 'building_port' | 'active_mine' | 'active_forest' | 'harvesting' | 'growing' | 'fishing' | 'hunting' | 'crafting_planks' | 'crafting_bricks' | 'spawn_rock' | string | null;

interface Inventory {
  coins: number;
  wood: number;
  stone: number;
  wheat: number;
  wheatSeeds: number;
  tomato: number;
  tomatoSeeds: number;
  carrot: number;
  carrotSeeds: number;
  eggplant: number;
  eggplantSeeds: number;
  fish: number;
  planks: number;
  bricks: number;
  wildMeat: number;
  iron: number;
  copper: number;
  gold: number;
}

interface UnlockedBuildings {
  house: boolean;
  animal_farm: boolean;
  lumber_mill: boolean;
  stone_mason: boolean;
  mine: boolean;
  port: boolean;
  village: boolean;
  city: boolean;
  county: boolean;
  tree: boolean;
  forest: boolean;
  rock: boolean;
}

interface Cell {
  id: number;
  type: CellType;
  cropType?: CropId;
  busyUntil: number | null;
  busyTotalDuration: number | null;
  pendingAction: ActionType;
  farmersUsed?: number;
  mineTicks?: number;
  forestTicks?: number;
  lastTickTime?: number;
  animalCount?: number;
  reproductionTargetTime?: number | null;
  fishingTicks?: number;
  wildAnimalCount?: number;
  wildReproductionTargetTime?: number | null;
}

// --- STATI INIZIALI ---
const INITIAL_INVENTORY: Inventory = {
  coins: 1000, wood: 0, stone: 0,
  wheat: 0, wheatSeeds: 3,
  tomato: 0, tomatoSeeds: 0,
  carrot: 0, carrotSeeds: 0,
  eggplant: 0, eggplantSeeds: 0,
  fish: 0, planks: 0, bricks: 0, wildMeat: 0,
  iron: 0, copper: 0, gold: 0
};

const INITIAL_UNLOCKED: UnlockedBuildings = {
  house: false, animal_farm: false, lumber_mill: false,
  stone_mason: false, mine: false, port: false,
  village: false, city: false, county: false,
  tree: false, forest: false, rock: false
};

// --- CONFIGURAZIONE GIOCO ---
const GRID_SIZE = 8;
const ACTION_TIMES = {
  plowing: 3000,
  planting: 2000,
  harvesting: 2000,
  chopping: 5000,
  mining: 8000,
  building_house: 15000,
  building_mine: 10000,
  planting_tree: 5000,
  planting_forest: 10000,
  building_animal_farm: 15000,
  spawn_rock: 10000,
  building_village: 20000,
  building_city: 30000,
  building_county: 40000,
  building_lumber_mill: 12000,
  building_stone_mason: 12000,
  building_port: 15000,
  crafting: 5000,
  hunting: 5000
};

const COSTS = {
  house: { wood: 3, stone: 6, farmers: 1 },
  mine: { wood: 10, coins: 100, farmers: 3 },
  tree: { coins: 50, farmers: 1 },
  forest: { coins: 300, stone: 5, farmers: 2 },
  animal_farm: { wheat: 5, wood: 5, stone: 5, coins: 100, farmers: 2 },
  rock: { coins: 50, farmers: 1 },
  village: { coins: 100, farmers: 2 },
  city: { coins: 500, farmers: 4 },
  county: { coins: 2000, farmers: 8 },
  lumber_mill: { wood: 15, stone: 5, coins: 150, farmers: 2 },
  stone_mason: { wood: 10, stone: 15, coins: 150, farmers: 2 },
  port: { wood: 20, stone: 10, coins: 200, farmers: 5 }
};

// --- COMPONENTE STICKMAN ANIMATO ---
const AnimatedStickman = ({ action }: { action: ActionType }) => {
  if (!action) return null;
  const isStriking = ['chopping', 'mining', 'spawn_rock'].includes(action) || action.startsWith('building_');
  const isFarming = ['plowing', 'harvesting', 'crafting_planks', 'crafting_bricks'].includes(action) || action.startsWith('planting_');
  const isHunting = action === 'hunting';

  return (
      <svg viewBox="0 0 100 100" style={{ width: '42px', height: '42px', position: 'absolute', top: '0', zIndex: 10, pointerEvents: 'none' }}>
        <circle cx="50" cy="25" r="9" fill="#fcd34d" stroke="#b45309" strokeWidth="2" />
        <path d="M 35 20 Q 50 10 65 20" stroke="#d97706" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="50" y1="34" x2="50" y2="60" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="58" x2="38" y2="85" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
        <line x1="50" y1="58" x2="62" y2="85" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
        <line x1="50" y1="40" x2="38" y2="55" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        <g className={isStriking ? "anim-strike" : isHunting ? "anim-hunt" : "anim-farm"} style={{ transformOrigin: '50px 40px' }}>
          <line x1="50" y1="40" x2="68" y2="48" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          {isStriking && (
              <g transform="translate(68, 48) rotate(20)">
                <line x1="0" y1="-15" x2="0" y2="20" stroke="#78350f" strokeWidth="3" strokeLinecap="round"/>
                {action === 'chopping' ? (
                    <path d="M -5 -10 L 12 -15 L 12 5 L -5 0 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                ) : action === 'mining' || action === 'spawn_rock' ? (
                    <path d="M -12 -5 Q 0 -15 12 -5 L 0 5 Z" fill="#94a3b8" stroke="#475569" strokeWidth="1"/>
                ) : (
                    <rect x="-8" y="-12" width="16" height="8" rx="2" fill="#64748b" />
                )}
              </g>
          )}
          {isFarming && (
              <g transform="translate(68, 48) rotate(0)">
                <line x1="0" y1="-10" x2="0" y2="25" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                {action === 'plowing' ? (
                    <path d="M -5 20 L 8 20 L 8 25 L -5 25 Z" fill="#64748b" />
                ) : action === 'harvesting' ? (
                    <path d="M 0 -5 C 15 -5 15 15 0 20 C 5 10 5 0 0 -5 Z" fill="#cbd5e1" />
                ) : (
                    <circle cx="0" cy="25" r="3" fill="#4ade80" />
                )}
              </g>
          )}
          {isHunting && (
              <g transform="translate(68, 48) rotate(-45)">
                <line x1="0" y1="-25" x2="0" y2="25" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
                <polygon points="-4,-25 4,-25 0,-35" fill="#cbd5e1" />
              </g>
          )}
        </g>
      </svg>
  );
};

// --- INIZIALIZZAZIONE GRIGLIA ---
const generateInitialGrid = (): Cell[] => {
  const grid: Cell[] = Array(GRID_SIZE * GRID_SIZE).fill(null) as Cell[];

  let waterCells = new Set<number>();
  let currentCol = Math.floor(Math.random() * GRID_SIZE);

  for(let row = 0; row < GRID_SIZE; row++) {
    waterCells.add(row * GRID_SIZE + currentCol);
    if (Math.random() > 0.4) {
      currentCol += (Math.random() > 0.5 ? 1 : -1);
      currentCol = Math.max(0, Math.min(GRID_SIZE - 1, currentCol));
      waterCells.add(row * GRID_SIZE + currentCol);
    }
  }

  let emptyGrassCells: number[] = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    if (i === 27) {
      grid[i] = { id: i, type: 'house', busyUntil: null, busyTotalDuration: null, pendingAction: null };
      waterCells.delete(i);
      continue;
    }

    let type: CellType = 'grass';
    if (waterCells.has(i)) {
      type = 'water';
    } else {
      const rand = Math.random();
      if (rand < 0.15) type = 'tree';
      else if (rand < 0.25) type = 'rock';
    }

    grid[i] = { id: i, type, busyUntil: null, busyTotalDuration: null, pendingAction: null };

    if (type === 'grass') emptyGrassCells.push(i);
  }

  // Inizializza gli animali in unità singole
  for (let k = 0; k < 8; k++) {
    if (emptyGrassCells.length === 0) break;
    const randIndex = Math.floor(Math.random() * emptyGrassCells.length);
    const cellId = emptyGrassCells[randIndex];
    grid[cellId].type = 'wild_animal';
    grid[cellId].wildAnimalCount = 1;
    emptyGrassCells.splice(randIndex, 1);
  }

  return grid;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [user, setUser] = useState<any>(null);
  const [hasSave, setHasSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // STATI PER IL GIORNO/NOTTE E AZIONI
  const [dayCount, setDayCount] = useState<number>(1);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [actionsUsedToday, setActionsUsedToday] = useState<number>(0);

  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [unlocked, setUnlocked] = useState<UnlockedBuildings>(INITIAL_UNLOCKED);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // STATI PER L'INTEGRAZIONE GEMINI (L'ANZIANO DEL VILLAGGIO)
  const [showElderModal, setShowElderModal] = useState(false);
  const [elderMessage, setElderMessage] = useState("");
  const [isElderThinking, setIsElderThinking] = useState(false);

  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const [unreadQuests, setUnreadQuests] = useState(0);
  const [toasts, setToasts] = useState<{id: string, title: string, type?: 'success' | 'danger'}[]>([]);
  const [grid, setGrid] = useState<Cell[]>(generateInitialGrid());
  const [now, setNow] = useState<number>(Date.now());
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const [respawningFarmers, setRespawningFarmers] = useState<number[]>([]);

  const gridRef = useRef(grid);
  const respawningRef = useRef(respawningFarmers);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Salva lo stato completo in un ref per il salvataggio automatico senza dipendenze continue
  const stateRef = useRef({ inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday });
  useEffect(() => {
    stateRef.current = { inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday };
  }, [inventory, unlocked, grid, completedQuests, respawningFarmers, dayCount, actionsUsedToday]);

  // --- GESTIONE FIREBASE (AUTENTICAZIONE) ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e: any) {
        console.error("Auth error", e);
        if (e.code === 'auth/configuration-not-found' || e.code === 'auth/operation-not-allowed') {
          console.warn("⚠️ Attenzione: Autenticazione Anonima non abilitata nella tua console Firebase! Si userà il salvataggio locale.");
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- RICERCA SALVATAGGIO (Cloud + Locale fallback) ---
  useEffect(() => {
    const localSave = localStorage.getItem('fattoria_avanzata_save');
    if (localSave) {
      setHasSave(true);
    }

    if (!user || !db) return;
    const checkCloudSave = async () => {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'savegame', 'data');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setHasSave(true);
        }
      } catch (e) {
        console.error("Check Save Error", e);
      }
    };
    checkCloudSave();
  }, [user]);

  // --- LOGICA CITTADINI E AZIONI DISPONIBILI ---
  const totalPorts = grid.filter(c => c.type === 'port').length;
  const baseFarmers =
      grid.filter(c => c.type === 'house').length * 1 +
      grid.filter(c => c.type === 'village').length * 6 +
      grid.filter(c => c.type === 'city').length * 30 +
      grid.filter(c => c.type === 'county').length * 100;

  const totalFarmers = Math.max(0, baseFarmers - (totalPorts * COSTS.port.farmers) - respawningFarmers.length);

  const busyFarmers = grid.reduce((sum, c) => {
    if (c.pendingAction && c.pendingAction !== 'growing' && c.pendingAction !== 'active_mine' && c.pendingAction !== 'fishing' && c.pendingAction !== 'active_forest') {
      return sum + (c.farmersUsed || 1);
    }
    return sum;
  }, 0);

  const availableFarmers = totalFarmers - busyFarmers;

  // AZIONI RIMANENTI OGGI
  const actionsLeft = Math.max(0, totalFarmers - actionsUsedToday);
  const totalAnimals = grid.reduce((sum, cell) => sum + (cell.animalCount || 0), 0);
  const busyShips = grid.filter(c => c.pendingAction === 'fishing').length;
  const availableShips = totalPorts - busyShips;

  // Gestione del Game Over
  useEffect(() => {
    if (gameState === 'playing' && totalFarmers <= 0) {
      setGameState('gameover');
    }
  }, [totalFarmers, gameState]);

  // --- INTEGRAZIONE LLM GEMINI: L'ANZIANO DEL VILLAGGIO ---
  const askVillageElder = async () => {
    setElderMessage("");
    setIsElderThinking(true);
    setShowElderModal(true);

    const apiKey = ""; // La chiave API viene iniettata a runtime

    const systemPrompt =
        "Sei il saggio e antico Anziano del villaggio in un videogioco gestionale di agricoltura e costruzione città. " +
        "Il giocatore è il capo del villaggio che ha bisogno di un consiglio su cosa fare dopo. " +
        "Parla in prima persona, con un tono calmo, misterioso e molto immersivo (come in un gioco di ruolo). " +
        "Analizza i dati che ti verranno forniti sull'inventario e sullo stato del villaggio e dai un singolo e breve consiglio strategico su quale dovrebbe essere il prossimo passo. " +
        "Se il giocatore ha poche risorse di base (legna, pietra), suggerisci di raccoglierle. Se ha molte risorse, suggerisci di espandere costruendo case, villaggi, o esplorando il mare con un porto. " +
        "Sii breve e conciso, massimo 2 o 3 frasi. Usa 1 o 2 emoji adatte per rendere il testo più carino.";

    // Raccogli i dati correnti per fornire contesto all'LLM
    const activeQuestIndex = ALL_QUESTS.findIndex(q => !completedQuests.includes(q.id));
    const currentQuestStr = activeQuestIndex !== -1 ? ALL_QUESTS[activeQuestIndex].title : "Dominio totale";

    const userQuery =
        `Giorno corrente: ${dayCount}. Popolazione totale: ${totalFarmers}. ` +
        `Inventario attuale: Monete:${inventory.coins}, Legna:${inventory.wood}, Pietra:${inventory.stone}, Grano:${inventory.wheat}. ` +
        `Flotta navale disponibile: ${availableShips}/${totalPorts}. ` +
        `Obiettivo attuale del diario: ${currentQuestStr}. ` +
        `Dammi il tuo consiglio saggio.`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const fetchWithRetry = async (retries = 5, delay = 1000): Promise<string> => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Mmm... I venti non portano notizie oggi.";
      } catch (err) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, delay));
          return fetchWithRetry(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    try {
      const text = await fetchWithRetry();
      setElderMessage(text);
    } catch (error) {
      setElderMessage("Hmm... le nebbie del fato sono troppo fitte oggi. Riprova più tardi, giovane capo.");
    } finally {
      setIsElderThinking(false);
    }
  };


  // --- SALVATAGGIO (Cloud + Locale Fallback) ---
  const handleSaveGame = async (isAuto = false) => {
    if (!isAuto) setIsSaving(true);

    const saveData = {
      inventory: stateRef.current.inventory,
      unlocked: stateRef.current.unlocked,
      grid: JSON.stringify(stateRef.current.grid),
      completedQuests: stateRef.current.completedQuests,
      respawningFarmers: JSON.stringify(stateRef.current.respawningFarmers),
      dayCount: stateRef.current.dayCount,
      actionsUsedToday: stateRef.current.actionsUsedToday
    };

    // Salva sempre in locale come backup
    try {
      localStorage.setItem('fattoria_avanzata_save', JSON.stringify(saveData));
      setHasSave(true);
    } catch(e) {
      console.error("Errore salvataggio locale", e);
    }

    if (user && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'savegame', 'data');
        await setDoc(docRef, saveData);
        const msg = isAuto ? 'Autosalvataggio cloud completato' : 'Partita salvata nel Cloud!';
        setToasts(prev => [...prev, { id: 'save-' + Date.now(), title: msg, type: 'success' }]);
      } catch (e) {
        console.error("Save Game Error", e);
        if (!isAuto) setToasts(prev => [...prev, { id: 'err-save', title: 'Salvataggio Cloud fallito (salvato in locale)', type: 'danger' }]);
      }
    } else {
      const msg = isAuto ? 'Autosalvataggio locale completato' : 'Partita salvata in locale (Cloud disconnesso)';
      setToasts(prev => [...prev, { id: 'save-' + Date.now(), title: msg, type: 'success' }]);
    }

    if (!isAuto) setIsSaving(false);
    setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('save-'))), 3000);
  };

  const handleLoadGame = async () => {
    let loadedData: any = null;

    // Prova prima dal cloud se utente connesso
    if (user && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'savegame', 'data');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          loadedData = snap.data();
        }
      } catch (e) {
        console.error("Load Game Error", e);
      }
    }

    // Fallback al localStorage se non trovato o cloud in errore
    if (!loadedData) {
      const localSave = localStorage.getItem('fattoria_avanzata_save');
      if (localSave) {
        loadedData = JSON.parse(localSave);
        setToasts(prev => [...prev, { id: 'load-local', title: 'Caricato salvataggio locale', type: 'success' }]);
      }
    }

    if (loadedData) {
      setInventory(loadedData.inventory);
      setUnlocked(loadedData.unlocked);
      setGrid(JSON.parse(loadedData.grid));
      setCompletedQuests(loadedData.completedQuests || []);
      setRespawningFarmers(JSON.parse(loadedData.respawningFarmers || '[]'));
      setDayCount(loadedData.dayCount || 1);
      setActionsUsedToday(loadedData.actionsUsedToday || 0);
      setIsNight(false);
      setGameState('playing');
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== 'load-local')), 3000);
    } else {
      setToasts(prev => [...prev, { id: 'err-load', title: 'Nessun salvataggio trovato', type: 'danger' }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== 'err-load')), 3000);
    }
  };

  const handleExportSave = () => {
    const saveData = {
      inventory: stateRef.current.inventory,
      unlocked: stateRef.current.unlocked,
      grid: JSON.stringify(stateRef.current.grid),
      completedQuests: stateRef.current.completedQuests,
      respawningFarmers: JSON.stringify(stateRef.current.respawningFarmers),
      dayCount: stateRef.current.dayCount,
      actionsUsedToday: stateRef.current.actionsUsedToday
    };
    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fattoria_save_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToasts(prev => [...prev, { id: 'export-' + Date.now(), title: 'File di salvataggio esportato!', type: 'success' }]);
    setTimeout(() => setToasts(prev => prev.filter(t => !t.id.startsWith('export-'))), 3000);
  };

  const handleImportSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedData = JSON.parse(content);

        if (!loadedData.inventory || !loadedData.grid) throw new Error("File JSON non valido");

        setInventory(loadedData.inventory);
        setUnlocked(loadedData.unlocked);
        setGrid(JSON.parse(loadedData.grid));
        setCompletedQuests(loadedData.completedQuests || []);
        setRespawningFarmers(JSON.parse(loadedData.respawningFarmers || '[]'));
        setDayCount(loadedData.dayCount || 1);
        setActionsUsedToday(loadedData.actionsUsedToday || 0);
        setIsNight(false);

        // Aggiorna anche il salvataggio locale per comodità
        localStorage.setItem('fattoria_avanzata_save', JSON.stringify(loadedData));
        setHasSave(true);

        // Se eravamo nel menu, avviamo il gioco
        setGameState('playing');

        setToasts(prev => [...prev, { id: 'load-file', title: 'Partita caricata dal file!', type: 'success' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== 'load-file')), 3000);
      } catch (err) {
        console.error(err);
        alert("Errore nell'importazione del file di salvataggio. Assicurati che sia un file JSON valido generato dal gioco.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Autosalvataggio ogni 60 secondi
  useEffect(() => {
    if (gameState !== 'playing') return;
    const autoSaveInterval = setInterval(() => {
      handleSaveGame(true);
    }, 60000);
    return () => clearInterval(autoSaveInterval);
  }, [gameState, user]);

  // --- TRANSIZIONE GIORNO/NOTTE ---
  const endDay = () => {
    setIsNight(true);
    setSelectedCell(null);
    setTimeout(() => {
      setIsNight(false);
      setDayCount(d => d + 1);
      setActionsUsedToday(0);
    }, 5000); // La notte dura 5 secondi
  };

  // Auto-Notte quando finiscono le azioni
  useEffect(() => {
    if (actionsLeft <= 0 && !isNight && totalFarmers > 0 && gameState === 'playing') {
      const t = setTimeout(() => {
        endDay();
      }, 1500); // Piccola pausa prima che cali la notte
      return () => clearTimeout(t);
    }
  }, [actionsLeft, isNight, totalFarmers, gameState]);

  // Logica Eventi Casuali Bilanciati
  useEffect(() => {
    if (gameState !== 'playing') return;

    const eventInterval = setInterval(() => {
      const currentGrid = gridRef.current;
      const currentRespawning = respawningRef.current;

      const currentPorts = currentGrid.filter(c => c.type === 'port').length;
      const currentBaseFarmers =
          currentGrid.filter(c => c.type === 'house').length * 1 +
          currentGrid.filter(c => c.type === 'village').length * 6 +
          currentGrid.filter(c => c.type === 'city').length * 30 +
          currentGrid.filter(c => c.type === 'county').length * 100;

      const currentTotalFarmers = Math.max(0, currentBaseFarmers - (currentPorts * COSTS.port.farmers) - currentRespawning.length);

      if (currentTotalFarmers <= 0) return;

      let eventTriggered = false;
      let eventMessage = "";

      const diseaseProb = Math.min(0.90, 0.05 + (currentTotalFarmers - 1) * 0.0447);
      const hasWildAnimals = currentGrid.some(c => c.type === 'wild_animal');
      const wolvesProb = !hasWildAnimals ? 0.40 : 0;
      const banditsProb = currentPorts > 0 ? 0.30 : 0;

      if (Math.random() < diseaseProb) {
        eventTriggered = true;
        eventMessage = "Un'improvvisa malattia ha colpito un cittadino!";
      } else if (wolvesProb > 0 && Math.random() < wolvesProb) {
        eventTriggered = true;
        eventMessage = "Senza più prede nella foresta, i lupi hanno attaccato la fattoria!";
      } else if (banditsProb > 0 && Math.random() < banditsProb) {
        eventTriggered = true;
        eventMessage = "Dei banditi giunti via mare hanno assalito l'insediamento!";
      }

      if (eventTriggered) {
        setRespawningFarmers(prev => [...prev, Date.now() + 40000]);

        const eventId = 'evt-' + Date.now();
        setToasts(prev => [...prev, { id: eventId, title: eventMessage, type: 'danger' }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== eventId));
        }, 5000);
      }
    }, 45000);

    return () => clearInterval(eventInterval);
  }, [gameState]);

  // --- EVENTI NOTTURNI (Movimento, Spawn Alberi, Auto-Merge Foresta) ---
  useEffect(() => {
    if (isNight && gameState === 'playing') {
      setGrid(prevGrid => {
        let newGrid = [...prevGrid];
        let gridChanged = false;

        // 1. MOVIMENTO E FUSIONE ANIMALI
        const movedTo = new Set<number>();
        for (let i = 0; i < newGrid.length; i++) {
          const cell = newGrid[i];
          if (cell.type === 'wild_animal' && !movedTo.has(i) && !cell.busyUntil && cell.pendingAction === null) {
            const neighbors = [];
            if (i >= 8) neighbors.push(i - 8);
            if (i < 56) neighbors.push(i + 8);
            if (i % 8 !== 0) neighbors.push(i - 1);
            if ((i + 1) % 8 !== 0) neighbors.push(i + 1);

            // Controlla fusione
            const mergeTarget = neighbors.find(n => newGrid[n].type === 'wild_animal' && !movedTo.has(n));

            if (mergeTarget !== undefined) {
              const totalCount = Math.min(10, (cell.wildAnimalCount || 1) + (newGrid[mergeTarget].wildAnimalCount || 1));
              newGrid[mergeTarget] = {
                ...newGrid[mergeTarget],
                wildAnimalCount: totalCount
              };
              newGrid[i] = {
                ...newGrid[i],
                type: 'grass',
                wildAnimalCount: undefined,
                wildReproductionTargetTime: undefined
              };
              movedTo.add(mergeTarget);
              movedTo.add(i);
              gridChanged = true;
              continue;
            }

            // Movimento semplice
            const validGrass = neighbors.filter(n => newGrid[n].type === 'grass' && !newGrid[n].busyUntil && newGrid[n].pendingAction === null);

            if (validGrass.length > 0) {
              const target = validGrass[Math.floor(Math.random() * validGrass.length)];
              newGrid[target] = {
                ...newGrid[target],
                type: 'wild_animal',
                wildAnimalCount: cell.wildAnimalCount,
                wildReproductionTargetTime: cell.wildReproductionTargetTime
              };
              newGrid[i] = {
                ...newGrid[i],
                type: 'grass',
                wildAnimalCount: undefined,
                wildReproductionTargetTime: undefined
              };
              movedTo.add(target);
              movedTo.add(i);
              gridChanged = true;
            }
          }
        }

        // 2. SPAWN NUOVI ALBERI (da 1 a 3 alberi a notte)
        const emptyGrass = newGrid.map((c, idx) => c.type === 'grass' && !c.busyUntil && c.pendingAction === null ? idx : -1).filter(idx => idx !== -1);
        if (emptyGrass.length > 0) {
          const spawnCount = Math.floor(Math.random() * 3) + 1; // 1-3 alberi
          for (let k = 0; k < spawnCount; k++) {
            if (emptyGrass.length === 0) break;
            const randIndex = Math.floor(Math.random() * emptyGrass.length);
            const cellId = emptyGrass[randIndex];
            newGrid[cellId] = { ...newGrid[cellId], type: 'tree' };
            emptyGrass.splice(randIndex, 1);
            gridChanged = true;
          }
        }

        // 3. AUTO-MERGE ALBERI IN FORESTA (2x2)
        for (let i = 0; i < newGrid.length; i++) {
          if (newGrid[i].type === 'tree' && !newGrid[i].busyUntil && newGrid[i].pendingAction === null) {
            const col = i % 8;
            const row = Math.floor(i / 8);
            if (col < 7 && row < 7) {
              const tl = i;
              const tr = i + 1;
              const bl = i + 8;
              const br = i + 9;

              const isIdleTree = (idx: number) => newGrid[idx].type === 'tree' && !newGrid[idx].busyUntil && newGrid[idx].pendingAction === null;

              if (isIdleTree(tr) && isIdleTree(bl) && isIdleTree(br)) {
                // Fonde in foresta attiva
                newGrid[tl] = { ...newGrid[tl], type: 'forest', pendingAction: 'active_forest', lastTickTime: Date.now(), forestTicks: 0 };
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
    }
  }, [isNight, gameState]);

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

  useEffect(() => {
    setUnlocked(prev => {
      let changed = false;
      const next = { ...prev };

      const checkUnlock = (key: keyof UnlockedBuildings, condition: boolean) => {
        if (!next[key] && condition) {
          next[key] = true;
          changed = true;
        }
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

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    respawningRef.current = respawningFarmers;
  }, [respawningFarmers]);

  // --- ALGORITMO DI ESPLORAZIONE CON NEBBIA ---
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
          const isWater = grid[n].type === 'water';
          if (!isWater || totalPorts > 0) {
            queue.push(n);
          }
        }
      }
    }
    return reachable;
  }, [grid, totalPorts]);

  const getMergeableCells = (cellId: number, targetType: CellType): number[] | null => {
    const isIdleType = (id: number) => {
      const c = grid.find(cell => cell.id === id);
      return c && c.type === targetType && !c.busyUntil && c.pendingAction === null;
    };

    const possibleTopLefts = [cellId, cellId - 1, cellId - 8, cellId - 9];
    for (const tl of possibleTopLefts) {
      if (tl < 0 || tl > 63) continue;
      const col = tl % 8;
      const row = Math.floor(tl / 8);
      if (col >= 7 || row >= 7) continue;
      const group = [tl, tl + 1, tl + 8, tl + 9];
      if (group.includes(cellId) && group.every(isIdleType)) return group;
    }
    return null;
  };

  // --- SISTEMA DI MISSIONI (DIARIO) ---
  const ALL_QUESTS = useMemo(() => [
    {
      id: 'q1',
      icon: Axe,
      title: 'Sopravvivenza Base',
      desc: "Clicca sugli alberi e sulle rocce verdi della mappa per raccogliere i materiali primari. Se non hai alberi usa 50 Monete per piantarli nell'erba libera.",
      goal: 'Ottieni 10 Legna e 10 Pietra.',
      isDone: () => inventory.wood >= 10 && inventory.stone >= 10
    },
    {
      id: 'q2',
      icon: Home,
      title: 'Un Tetto Sopra la Testa',
      desc: "Clicca su un prato verde e costruisci una Casa. Espanderà la tua popolazione lavorativa.",
      goal: 'Costruisci la tua prima nuova Casa.',
      isDone: () => grid.filter(c => c.type === 'house').length > 1 || grid.some(c => ['village','city','county'].includes(c.type))
    },
    {
      id: 'q3',
      icon: Wheat,
      title: 'I Frutti della Terra',
      desc: "Ara un terreno, pianta dei semi di Grano (comprali al Mercato se serve) e attendi la crescita per raccoglierli.",
      goal: 'Ottieni del Grano nell\'inventario.',
      isDone: () => inventory.wheat > 0
    },
    {
      id: 'q4',
      icon: Factory,
      title: 'L\'Età dell\'Industria',
      desc: "Costruisci una Segheria su un terreno e usala per trasformare la legna in materiale da costruzione.",
      goal: 'Costruisci una Segheria e crea la tua prima Asse.',
      isDone: () => inventory.planks > 0
    },
    {
      id: 'q5',
      icon: Anchor,
      title: 'Verso l\'Ignoto',
      desc: "La nebbia nasconde tesori. Costruisci un Porto sull'erba vicino all'acqua. Attenzione: richiede 5 cittadini permanenti come equipaggio!",
      goal: 'Costruisci un Porto per diradare la nebbia.',
      isDone: () => totalPorts > 0
    },
    {
      id: 'q6',
      icon: Hammer,
      title: 'Profondità Oscure',
      desc: "Trasforma una Roccia in una Miniera permanente. Estrarrà automaticamente pietre e metalli preziosi.",
      goal: 'Costruisci una Miniera.',
      isDone: () => grid.some(c => c.type === 'mine')
    },
    {
      id: 'q7',
      icon: Tent,
      title: 'Urbanistica',
      desc: "Metti 4 Case vicine a formare un quadrato 2x2. Clicca su una di esse per unirle in un Villaggio.",
      goal: 'Fonda un Villaggio.',
      isDone: () => grid.some(c => ['village','city','county'].includes(c.type))
    },
    {
      id: 'q8',
      icon: Landmark,
      title: 'L\'Impero',
      desc: "Continua a fondere i tuoi insediamenti: 4 Villaggi creano una Città. 4 Città creano l'insediamento definitivo.",
      goal: 'Fonda la gloriosa Contea.',
      isDone: () => grid.some(c => c.type === 'county')
    }
  ], [inventory, grid, totalPorts]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const activeQuestIndex = ALL_QUESTS.findIndex(q => !completedQuests.includes(q.id));

    if (activeQuestIndex !== -1) {
      const activeQuest = ALL_QUESTS[activeQuestIndex];

      if (activeQuest.isDone()) {
        setCompletedQuests(prev => [...prev, activeQuest.id]);
        setUnreadQuests(prev => prev + 1);

        const toastId = 'q-' + activeQuest.id;
        setToasts(prev => [...prev, { id: toastId, title: activeQuest.title, type: 'success' }]);

        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 4000);
      }
    }
  }, [ALL_QUESTS, completedQuests, gameState]);

  // --- GAME LOOP (Esecuzione Continua Azioni in Sospeso) ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      let gridChanged = false;
      let newRewards: Partial<Inventory> = {};
      let newlyDeadFarmers = 0;

      const addReward = (key: keyof Inventory, amount: number) => {
        newRewards[key] = (newRewards[key] || 0) + amount;
      };

      const newGrid = gridRef.current.map(cell => {
        let updatedCell = cell;
        let cellModified = false;

        // 1. GESTIONE MINIERA PASSIVA
        if (updatedCell.type === 'mine' && updatedCell.pendingAction === 'active_mine') {
          const timeSinceLastTick = currentTime - (updatedCell.lastTickTime || currentTime);
          if (timeSinceLastTick >= 5000) {
            cellModified = true;
            const dropRoll = Math.random() * 100;
            if (dropRoll < 7) addReward('gold', 1);
            else if (dropRoll < 14) addReward('copper', 1);
            else if (dropRoll < 21) addReward('iron', 1);
            else                     addReward('stone', 1);

            const newTicks = (updatedCell.mineTicks || 0) + 1;
            if (newTicks >= 12) {
              updatedCell = { ...updatedCell, type: 'rock', pendingAction: null, lastTickTime: undefined, mineTicks: undefined, farmersUsed: undefined };
            } else {
              updatedCell = { ...updatedCell, lastTickTime: currentTime, mineTicks: newTicks };
            }
          }
        }

        // 1.5 GESTIONE BOSCO PASSIVO
        if (updatedCell.type === 'forest' && updatedCell.pendingAction === 'active_forest') {
          const timeSinceLastTick = currentTime - (updatedCell.lastTickTime || currentTime);
          if (timeSinceLastTick >= 15000) {
            cellModified = true;
            addReward('wood', 2);

            const newTicks = (updatedCell.forestTicks || 0) + 1;
            if (newTicks >= 4) {
              updatedCell = { ...updatedCell, type: 'grass', pendingAction: null, lastTickTime: undefined, forestTicks: undefined };
            } else {
              updatedCell = { ...updatedCell, lastTickTime: currentTime, forestTicks: newTicks };
            }
          }
        }

        // 2. GESTIONE FATTORIA ANIMALI
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

        // 3. GESTIONE ANIMALI SELVATICI (RIPRODUZIONE)
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

        // 4. GESTIONE PESCA
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

        // 5. GESTIONE AZIONI COMPLETATE
        if (updatedCell.busyUntil && currentTime >= updatedCell.busyUntil && updatedCell.pendingAction !== 'fishing') {
          cellModified = true;
          let newType = updatedCell.type;
          let newPendingAction: ActionType = null;
          let busyUntil = null;
          let busyTotalDuration = null;
          let lastTickTime = undefined;
          let mineTicks = undefined;
          let forestTicks = undefined;
          let animalCount = updatedCell.animalCount;
          let wildAnimalCount = updatedCell.wildAnimalCount;

          if (updatedCell.pendingAction === 'plowing') newType = 'plowed';
          else if (updatedCell.pendingAction === 'planting_tree') newType = 'tree';
          else if (updatedCell.pendingAction === 'planting_forest') {
            newType = 'forest'; newPendingAction = 'active_forest'; lastTickTime = currentTime; forestTicks = 0;
          }
          else if (updatedCell.pendingAction === 'spawn_rock') newType = 'rock';
          else if (updatedCell.pendingAction === 'building_village') newType = 'village';
          else if (updatedCell.pendingAction === 'building_city') newType = 'city';
          else if (updatedCell.pendingAction === 'building_county') newType = 'county';
          else if (updatedCell.pendingAction === 'building_lumber_mill') newType = 'lumber_mill';
          else if (updatedCell.pendingAction === 'building_stone_mason') newType = 'stone_mason';
          else if (updatedCell.pendingAction === 'building_port') newType = 'port';
          else if (updatedCell.pendingAction === 'building_mine') {
            newType = 'mine'; newPendingAction = 'active_mine'; lastTickTime = currentTime; mineTicks = 0;
          }
          else if (updatedCell.pendingAction === 'building_animal_farm') {
            newType = 'animal_farm'; animalCount = 2;
          }
          else if (updatedCell.pendingAction?.startsWith('planting_') && updatedCell.pendingAction !== 'planting_forest' && updatedCell.pendingAction !== 'planting_tree') {
            newType = 'growing';
            const cropType = updatedCell.cropType!;
            busyUntil = currentTime + CROPS[cropType].growthTime;
            busyTotalDuration = CROPS[cropType].growthTime;
            newPendingAction = 'growing';
          }
          else if (updatedCell.pendingAction === 'growing') newType = 'ready';
          else if (updatedCell.pendingAction === 'harvesting') {
            newType = 'grass';
            const crop = CROPS[updatedCell.cropType!];
            const yieldFruits = crop.minYield + Math.floor(Math.random() * (crop.maxYield - crop.minYield + 1));
            const yieldSeeds = crop.minSeeds + Math.floor(Math.random() * (crop.maxSeeds - crop.minSeeds + 1));
            addReward(crop.id, yieldFruits);
            addReward(`${crop.id}Seeds` as keyof Inventory, yieldSeeds);
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
            const roll = Math.random() * 100;
            if (roll < 15) {
              newlyDeadFarmers += 1;
            } else if (roll < 35) {
              addReward('wildMeat', 1);
              wildCount -= 1;
            }

            if (wildCount <= 0) {
              newType = 'grass';
              wildAnimalCount = undefined;
              updatedCell.wildReproductionTargetTime = undefined;
            } else {
              wildAnimalCount = wildCount;
            }
          }

          updatedCell = {
            ...updatedCell, type: newType, busyUntil, busyTotalDuration, pendingAction: newPendingAction,
            cropType: newType === 'grass' ? undefined : updatedCell.cropType,
            lastTickTime, mineTicks, forestTicks, animalCount, wildAnimalCount, farmersUsed: undefined
          };
        }

        if (cellModified) gridChanged = true;
        return updatedCell;
      });

      if (gridChanged) {
        setGrid(newGrid);
        if (Object.keys(newRewards).length > 0) {
          setInventory(prev => {
            const next = { ...prev };
            (Object.keys(newRewards) as Array<keyof Inventory>).forEach(k => {
              next[k] = (next[k] as number) + (newRewards[k] as number);
            });
            return next;
          });
        }
      }

      let respawnChanged = false;
      let nextRespawning = [...respawningRef.current];

      if (newlyDeadFarmers > 0) {
        respawnChanged = true;
        for (let i = 0; i < newlyDeadFarmers; i++) {
          nextRespawning.push(currentTime + 40000);
        }
      }

      const filteredRespawning = nextRespawning.filter(time => {
        if (currentTime >= time) {
          respawnChanged = true;
          return false;
        }
        return true;
      });

      if (respawnChanged) {
        setRespawningFarmers(filteredRespawning);
      }

    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  // --- AZIONI GIOCATORE ---
  const startAction = (cellId: number, action: ActionType) => {
    if (isNight) return;

    const cell = grid.find(c => c.id === cellId);
    if (!cell) return;

    // Le navi non consumano azioni dei cittadini
    if (action === 'fishing') {
      if (availableShips < 1) return;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, pendingAction: action, lastTickTime: Date.now(), fishingTicks: 0 } : c));
      setSelectedCell(null);
      return;
    }

    if (availableFarmers < 1) return;

    // Determina il costo in azioni (uguale al numero di cittadini richiesti)
    let costFarmers = 1;
    if (action === 'hunting') costFarmers = 2;
    else if (action?.startsWith('building_')) {
      const buildingType = action.replace('building_', '');
      costFarmers = COSTS[buildingType as keyof typeof COSTS]?.farmers || 1;
    }
    else if (action === 'planting_tree') costFarmers = COSTS.tree.farmers;
    else if (action === 'planting_forest') costFarmers = COSTS.forest.farmers;
    else if (action === 'spawn_rock') costFarmers = COSTS.rock.farmers;

    if (actionsLeft < costFarmers) return;

    if (action === 'hunting') {
      const duration = ACTION_TIMES.hunting;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_house') {
      if (inventory.wood < COSTS.house.wood || inventory.stone < COSTS.house.stone) return;
      setInventory(prev => ({ ...prev, wood: prev.wood - COSTS.house.wood, stone: prev.stone - COSTS.house.stone }));
      const duration = ACTION_TIMES.building_house;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_port') {
      const futureTotalFarmers = baseFarmers - ((totalPorts + 1) * COSTS.port.farmers) - respawningFarmers.length;
      if (inventory.wood < COSTS.port.wood || inventory.stone < COSTS.port.stone || inventory.coins < COSTS.port.coins || futureTotalFarmers < 1) return;

      setInventory(prev => ({ ...prev, wood: prev.wood - COSTS.port.wood, stone: prev.stone - COSTS.port.stone, coins: prev.coins - COSTS.port.coins }));
      const duration = ACTION_TIMES.building_port;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_lumber_mill') {
      if (inventory.wood < COSTS.lumber_mill.wood || inventory.stone < COSTS.lumber_mill.stone || inventory.coins < COSTS.lumber_mill.coins) return;
      setInventory(prev => ({ ...prev, wood: prev.wood - COSTS.lumber_mill.wood, stone: prev.stone - COSTS.lumber_mill.stone, coins: prev.coins - COSTS.lumber_mill.coins }));
      const duration = ACTION_TIMES.building_lumber_mill;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_stone_mason') {
      if (inventory.wood < COSTS.stone_mason.wood || inventory.stone < COSTS.stone_mason.stone || inventory.coins < COSTS.stone_mason.coins) return;
      setInventory(prev => ({ ...prev, wood: prev.wood - COSTS.stone_mason.wood, stone: prev.stone - COSTS.stone_mason.stone, coins: prev.coins - COSTS.stone_mason.coins }));
      const duration = ACTION_TIMES.building_stone_mason;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'crafting_planks') {
      if (inventory.wood < 2) return;
      setInventory(prev => ({ ...prev, wood: prev.wood - 2 }));
      const duration = ACTION_TIMES.crafting;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'crafting_bricks') {
      if (inventory.stone < 2) return;
      setInventory(prev => ({ ...prev, stone: prev.stone - 2 }));
      const duration = ACTION_TIMES.crafting;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_mine') {
      if (inventory.wood < COSTS.mine.wood || inventory.coins < COSTS.mine.coins) return;
      setInventory(prev => ({ ...prev, wood: prev.wood - COSTS.mine.wood, coins: prev.coins - COSTS.mine.coins }));
      const duration = ACTION_TIMES.building_mine;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_animal_farm') {
      if (inventory.wheat < COSTS.animal_farm.wheat || inventory.wood < COSTS.animal_farm.wood || inventory.stone < COSTS.animal_farm.stone || inventory.coins < COSTS.animal_farm.coins) return;
      setInventory(prev => ({ ...prev, wheat: prev.wheat - COSTS.animal_farm.wheat, wood: prev.wood - COSTS.animal_farm.wood, stone: prev.stone - COSTS.animal_farm.stone, coins: prev.coins - COSTS.animal_farm.coins }));
      const duration = ACTION_TIMES.building_animal_farm;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_village') {
      const targetCells = getMergeableCells(cellId, 'house');
      if (!targetCells || inventory.coins < COSTS.village.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.village.coins }));
      const duration = ACTION_TIMES.building_village;
      setGrid(prev => prev.map(c => {
        if (c.id === cellId) {
          return { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers };
        } else if (targetCells.includes(c.id)) {
          return { ...c, type: 'grass', pendingAction: null, busyUntil: null, busyTotalDuration: null, farmersUsed: undefined };
        }
        return c;
      }));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_city') {
      const targetCells = getMergeableCells(cellId, 'village');
      if (!targetCells || inventory.coins < COSTS.city.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.city.coins }));
      const duration = ACTION_TIMES.building_city;
      setGrid(prev => prev.map(c => {
        if (c.id === cellId) {
          return { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers };
        } else if (targetCells.includes(c.id)) {
          return { ...c, type: 'grass', pendingAction: null, busyUntil: null, busyTotalDuration: null, farmersUsed: undefined };
        }
        return c;
      }));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'building_county') {
      const targetCells = getMergeableCells(cellId, 'city');
      if (!targetCells || inventory.coins < COSTS.county.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.county.coins }));
      const duration = ACTION_TIMES.building_county;
      setGrid(prev => prev.map(c => {
        if (c.id === cellId) {
          return { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers };
        } else if (targetCells.includes(c.id)) {
          return { ...c, type: 'grass', pendingAction: null, busyUntil: null, busyTotalDuration: null, farmersUsed: undefined };
        }
        return c;
      }));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'planting_tree') {
      if (inventory.coins < COSTS.tree.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.tree.coins }));
      const duration = ACTION_TIMES.planting_tree;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'planting_forest') {
      if (inventory.coins < COSTS.forest.coins || inventory.stone < COSTS.forest.stone) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.forest.coins, stone: prev.stone - COSTS.forest.stone }));
      const duration = ACTION_TIMES.planting_forest;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action === 'spawn_rock') {
      if (inventory.coins < COSTS.rock.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.rock.coins }));
      const duration = ACTION_TIMES.spawn_rock;
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (action?.startsWith('planting_') && action !== 'planting_forest' && action !== 'planting_tree') {
      const cropId = action.split('_')[1] as CropId;
      const seedKey = `${cropId}Seeds` as keyof Inventory;
      if (inventory[seedKey] < 1) return;

      setInventory(prev => ({ ...prev, [seedKey]: (prev[seedKey] as number) - 1 }));
      const duration = ACTION_TIMES.planting;

      setGrid(prev => prev.map(c => c.id === cellId ? {
        ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, cropType: cropId, farmersUsed: costFarmers
      } : c));
      setActionsUsedToday(prev => prev + costFarmers);
      setSelectedCell(null);
      return;
    }

    if (['plowing', 'chopping', 'mining', 'harvesting'].includes(action as string)) {
      const duration = ACTION_TIMES[action as keyof typeof ACTION_TIMES];
      setGrid(prev => prev.map(c => c.id === cellId ? {
        ...c, busyUntil: Date.now() + duration, busyTotalDuration: duration, pendingAction: action, farmersUsed: costFarmers
      } : c));
      setActionsUsedToday(prev => prev + costFarmers);
    }

    setSelectedCell(null);
  };

  // --- RENDERIZZAZIONE CELLE ---
  const renderCellContent = (cell: Cell) => {
    if (cell.type === 'mine' && cell.pendingAction === 'active_mine') {
      const progress = ((cell.mineTicks || 0) / 12) * 100;
      return (
          <div className="progress-container">
            <div style={{ position: 'relative', marginTop: '-5px' }}>
              <Mountain size={28} color="#475569" fill="#334155" />
              <Pickaxe size={16} color="#fbbf24" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#3b82f6' }}></div>
            </div>
          </div>
      );
    }

    if (cell.type === 'forest' && cell.pendingAction === 'active_forest') {
      const progress = ((cell.forestTicks || 0) / 4) * 100;
      return (
          <div className="progress-container">
            <div style={{ position: 'relative', marginTop: '-5px', display: 'flex', gap: '-5px' }}>
              <TreePine size={28} color="#14532d" fill="#166534" />
              <TreePine size={28} color="#14532d" fill="#166534" style={{marginLeft: '-10px'}} />
              <Axe size={16} color="#fbbf24" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 }} />
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#4ade80' }}></div>
            </div>
          </div>
      );
    }

    if (cell.type === 'water' && cell.pendingAction === 'fishing') {
      const timeSinceLastTick = now - (cell.lastTickTime || now);
      const progress = Math.min(100, (timeSinceLastTick / 10000) * 100);
      return (
          <div className="progress-container">
            <Fish size={20} color="#0284c7" className="animate-bounce-slow" style={{marginTop: '-5px'}}/>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#fbbf24' }}></div>
            </div>
          </div>
      );
    }

    if (cell.type === 'animal_farm') {
      const isReproducing = cell.reproductionTargetTime != null;
      const progress = isReproducing ? 100 - Math.max(0, Math.min(100, ((cell.reproductionTargetTime! - now) / 20000) * 100)) : 0;
      return (
          <div className="progress-container">
            <div style={{ position: 'relative', marginTop: '-5px' }}>
              <Warehouse size={28} color="#991b1b" fill="#b91c1c" />
              <div style={{position:'absolute', bottom: -5, right: -5, background: 'white', borderRadius: '50%', padding: '2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold', border:'1px solid #ccc', color: '#fb7185', width: '16px', height: '16px'}}>
                {cell.animalCount}
              </div>
            </div>
            {isReproducing && (
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#fb7185' }}></div>
                </div>
            )}
          </div>
      );
    }

    if (cell.busyUntil && cell.busyTotalDuration) {
      const timeLeft = cell.busyUntil - now;
      const progress = 100 - Math.max(0, Math.min(100, (timeLeft / cell.busyTotalDuration) * 100));
      const isPassive = cell.pendingAction === 'growing';
      const isPlayerAction = cell.pendingAction && !['growing', 'fishing', 'active_mine', 'active_forest'].includes(cell.pendingAction);

      return (
          <div className="progress-container">
            {isPlayerAction && <AnimatedStickman action={cell.pendingAction} />}
            <div style={{ position: 'absolute', top: '15px', zIndex: 1, opacity: isPlayerAction ? 0.25 : 0.8, transform: isPlayerAction ? 'scale(1.4)' : 'scale(1)' }}>
              {cell.pendingAction === 'plowing' && <Tractor size={24} color="#78350f" />}
              {cell.pendingAction?.startsWith('planting_') && cell.pendingAction !== 'planting_forest' && cell.pendingAction !== 'planting_tree' && <Sprout size={24} color="#15803d" />}
              {cell.pendingAction === 'planting_tree' && <TreePine size={24} color="#14532d" />}
              {cell.pendingAction === 'planting_forest' && <div style={{display:'flex'}}><TreePine size={18} color="#14532d" /><TreePine size={18} color="#14532d" style={{marginLeft:'-5px'}} /></div>}
              {cell.pendingAction === 'spawn_rock' && <Mountain size={24} color="#475569" />}
              {cell.pendingAction === 'harvesting' && cell.cropType && React.createElement(CROPS[cell.cropType].icon, { size: 24, color: '#1e293b' })}
              {cell.pendingAction === 'chopping' && <Axe size={24} color="#475569" />}
              {cell.pendingAction === 'mining' && <Pickaxe size={24} color="#475569" />}
              {cell.pendingAction === 'building_house' && <Home size={24} color="#1e293b" />}
              {cell.pendingAction === 'building_village' && <Tent size={24} color="#1e40af" />}
              {cell.pendingAction === 'building_city' && <Castle size={24} color="#581c87" />}
              {cell.pendingAction === 'building_county' && <Landmark size={24} color="#831843" />}
              {cell.pendingAction === 'building_mine' && <Hammer size={24} color="#fbbf24" />}
              {cell.pendingAction === 'building_animal_farm' && <Warehouse size={24} color="#b91c1c" />}
              {cell.pendingAction === 'building_lumber_mill' && <Factory size={24} color="#451a03" />}
              {cell.pendingAction === 'building_stone_mason' && <Factory size={24} color="#334155" />}
              {cell.pendingAction === 'building_port' && <Anchor size={24} color="#1e3a8a" />}
              {cell.pendingAction === 'crafting_planks' && <Box size={24} color="#d97706" />}
              {cell.pendingAction === 'crafting_bricks' && <Layers size={24} color="#cbd5e1" />}
              {cell.pendingAction === 'hunting' && <Crosshair size={24} color="#c2410c" />}

              {isPassive && cell.cropType && React.createElement(CROPS[cell.cropType].icon, { size: 24, color: CROPS[cell.cropType].color })}
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%`, background: isPassive ? '#4ade80' : '#fbbf24' }}></div>
            </div>
          </div>
      );
    }

    switch (cell.type) {
      case 'grass': return null;
      case 'water': return <Droplets size={26} color="#38bdf8" fill="#7dd3fc" opacity={0.6}/>;
      case 'tree': return <TreePine size={28} color="#14532d" fill="#166534" />;
      case 'forest': return (
          <div style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
            <TreePine size={28} color="#14532d" fill="#166534" />
            <TreePine size={28} color="#14532d" fill="#166534" style={{marginLeft: '-10px'}} />
          </div>
      );
      case 'rock': return <Mountain size={26} color="#475569" fill="#64748b" />;
      case 'house': return <Home size={30} color="#0f172a" fill="#1e293b" />;
      case 'village': return <Tent size={32} color="#1e3a8a" fill="#3b82f6" />;
      case 'city': return <Castle size={32} color="#4c1d95" fill="#7c3aed" />;
      case 'county': return <Landmark size={32} color="#701a75" fill="#db2777" />;
      case 'lumber_mill': return <Factory size={28} color="#78350f" fill="#92400e" />;
      case 'stone_mason': return <Factory size={28} color="#334155" fill="#475569" />;
      case 'port': return <Anchor size={30} color="#1e3a8a" fill="#3b82f6" />;
      case 'plowed': return null;
      case 'ready':
        if (!cell.cropType) return null;
        const CropIcon = CROPS[cell.cropType].icon;
        return <CropIcon size={28} color={CROPS[cell.cropType].color} className="animate-bounce-slow" />;
      case 'wild_animal':
        return (
            <div style={{ position: 'relative' }}>
              <Rabbit size={28} color="#78350f" fill="#b45309" />
              {cell.wildAnimalCount! > 1 && (
                  <div style={{position:'absolute', bottom: -5, right: -5, background: 'white', borderRadius: '50%', padding: '2px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold', border:'1px solid #ccc', color: '#b45309', width: '16px', height: '16px'}}>
                    {cell.wildAnimalCount}
                  </div>
              )}
            </div>
        );
      default: return null;
    }
  };

  const activeCell = selectedCell !== null ? grid.find(c => c.id === selectedCell) : null;
  const isReachable = activeCell ? reachableCells.has(activeCell.id) : false;

  const canBuildHouse = inventory.wood >= COSTS.house.wood && inventory.stone >= COSTS.house.stone;
  const canBuildMine = inventory.wood >= COSTS.mine.wood && inventory.coins >= COSTS.mine.coins;
  const canPlantTree = inventory.coins >= COSTS.tree.coins;
  const canPlantForest = inventory.coins >= COSTS.forest.coins && inventory.stone >= COSTS.forest.stone;
  const canSpawnRock = inventory.coins >= COSTS.rock.coins;
  const canBuildAnimalFarm = inventory.wheat >= COSTS.animal_farm.wheat && inventory.wood >= COSTS.animal_farm.wood && inventory.stone >= COSTS.animal_farm.stone && inventory.coins >= COSTS.animal_farm.coins;
  const canBuildLumberMill = inventory.wood >= COSTS.lumber_mill.wood && inventory.stone >= COSTS.lumber_mill.stone && inventory.coins >= COSTS.lumber_mill.coins;
  const canBuildStoneMason = inventory.wood >= COSTS.stone_mason.wood && inventory.stone >= COSTS.stone_mason.stone && inventory.coins >= COSTS.stone_mason.coins;

  const futureTotalFarmersAfterPort = baseFarmers - ((totalPorts + 1) * COSTS.port.farmers) - respawningFarmers.length;
  const canBuildPort = inventory.wood >= COSTS.port.wood && inventory.stone >= COSTS.port.stone && inventory.coins >= COSTS.port.coins && futureTotalFarmersAfterPort >= 1;

  const isAdjacentToWater = activeCell ? [activeCell.id - 8, activeCell.id + 8, activeCell.id % 8 !== 0 ? activeCell.id - 1 : -1, (activeCell.id + 1) % 8 !== 0 ? activeCell.id + 1 : -1]
      .filter(n => n >= 0 && n < 64)
      .some(n => grid[n].type === 'water') : false;

  // --- MERCATO ---
  const buySeed = (cropId: CropId) => {
    const cost = CROPS[cropId].seedCost;
    if (inventory.coins >= cost) setInventory(prev => ({ ...prev, coins: prev.coins - cost, [`${cropId}Seeds`]: (prev[`${cropId}Seeds` as keyof Inventory] as number) + 1 }));
  };

  const sellResource = (itemKey: keyof Inventory, amount: number, pricePerUnit: number) => {
    if (inventory[itemKey] >= amount) setInventory(prev => ({ ...prev, coins: prev.coins + (amount * pricePerUnit), [itemKey]: (prev[itemKey] as number) - amount }));
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

  // --- INIEZIONE CSS ---
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
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
      
      .progress-container { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
      .progress-bar-bg { position: absolute; bottom: 4px; width: 80%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); z-index: 20; }
      .progress-bar-fill { height: 100%; transition: width 0.1s linear; }
      
      @keyframes strikeAnim {
          0% { transform: rotate(-40deg); }
          100% { transform: rotate(30deg); }
      }
      @keyframes farmAnim {
          0% { transform: rotate(-10deg) translateY(-2px); }
          100% { transform: rotate(25deg) translateY(4px); }
      }
      @keyframes huntAnim {
          0% { transform: translateX(0) rotate(0deg); }
          40% { transform: translateX(-5px) rotate(-15deg); }
          100% { transform: translateX(12px) rotate(20deg); }
      }
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

      /* SCHERMATE MENU (START E GAME OVER) */
      .fullscreen-menu { position: fixed; inset: 0; background: #0f172a; z-index: 100; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 20px; }
      .fullscreen-menu h1 { font-size: 3rem; color: #4ade80; margin-bottom: 10px; font-weight: 900; letter-spacing: -1px; }
      .fullscreen-menu p { color: #94a3b8; font-size: 1.1rem; max-width: 500px; margin-bottom: 40px; line-height: 1.5; }
      .btn-start { background: #3b82f6; color: white; padding: 18px 40px; font-size: 1.4rem; font-weight: 800; border: none; border-radius: 50px; cursor: pointer; transition: transform 0.2s, background 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4); width: 100%; max-width: 300px;}
      .btn-start:hover { background: #2563eb; transform: scale(1.05); }
      .game-over-title { color: #ef4444 !important; }

      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }

      /* ELDER MODAL */
      .elder-chat-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; gap: 15px; align-items: flex-start; }
      .elder-avatar { background: #8b5cf6; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.4); }
      .elder-text { font-size: 15px; color: #1e293b; line-height: 1.5; font-style: italic; }
      .loading-dots:after { content: '.'; animation: dots 1.5s steps(5, end) infinite; }
      @keyframes dots { 0%, 20% { color: rgba(0,0,0,0); text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); } 40% { color: #1e293b; text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); } 60% { text-shadow: .25em 0 0 #1e293b, .5em 0 0 rgba(0,0,0,0); } 80%, 100% { text-shadow: .25em 0 0 #1e293b, .5em 0 0 #1e293b; } }
    `;
    document.head.appendChild(styleTag);
    return () => { document.head.removeChild(styleTag); };
  }, []);

  const firstIncompleteQuestIndex = ALL_QUESTS.findIndex(q => !completedQuests.includes(q.id));

  if (gameState === 'start') {
    return (
        <div className="fullscreen-menu">
          <h1>Fattoria Avanzata</h1>
          <p>
            Espandi il tuo insediamento, estrai minerali preziosi, commercia nel mercato e affronta l'ignoto costruendo porti.
            <br/><br/>
            <strong>Attenzione:</strong> Le tue decisioni contano. Il gioco include eventi casuali pericolosi. Se perdi tutti i tuoi cittadini, la partita terminerà!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
            {hasSave && (
                <button className="btn-start" style={{ background: '#10b981' }} onClick={handleLoadGame}>
                  <Play size={28} /> Continua Partita
                </button>
            )}
            <button className="btn-start" onClick={startNewGame}>
              <Play size={28} /> {hasSave ? 'Nuova Partita' : 'Inizia Partita'}
            </button>
            <button className="btn-start" style={{ background: '#64748b' }} onClick={() => setShowTutorialModal(true)}>
              <BookMarked size={28} /> Tutorial & Regole
            </button>
          </div>

          {showTutorialModal && (
              <div className="action-modal-overlay" style={{zIndex: 110}} onClick={() => setShowTutorialModal(false)}>
                <div className="action-modal" style={{color: '#1e293b', textAlign: 'left'}} onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Info color="#3b82f6" /> Tutorial & Regole
                    </h3>
                    <button onClick={() => setShowTutorialModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                      <X size={20} color="#64748b" />
                    </button>
                  </div>
                  <div className="modal-body" style={{fontSize: '14px', lineHeight: '1.6'}}>
                    <h4 style={{color: '#3b82f6', marginTop: 0}}>👥 Cittadini e Azioni (Giorno e Notte)</h4>
                    <p>Ogni tuo cittadino rappresenta <strong>1 Azione</strong> al giorno. Costruire un edificio o lavorare la terra consuma le azioni. Se esaurisci tutte le azioni disponibili scenderà automaticamente la notte, costringendo i cittadini a riposare prima del giorno successivo.</p>

                    <h4 style={{color: '#10b981'}}>🏗️ Progressione e Sblocchi</h4>
                    <p>Raccogli materiali di base (Legna e Pietra) per sbloccare nuove strutture. Quando raggiungi i requisiti di risorse e popolazione per la prima volta, l'edificio si sbloccherà permanentemente.</p>

                    <h4 style={{color: '#fbbf24'}}>🌫️ Esplorazione e Navigazione</h4>
                    <p>Il mare è avvolto dalla nebbia di guerra. Costruisci un <strong>Porto</strong> (che necessita di 5 cittadini come equipaggio fisso) per diradare la nebbia e sbloccare le navi da pesca per il sostentamento.</p>

                    <h4 style={{color: '#ef4444'}}>⚠️ Eventi Casuali e Sopravvivenza</h4>
                    <p>Fai molta attenzione! Malattie, branchi di lupi affamati (se stermini gli animali selvatici) e banditi via nave (dopo aver costruito il porto) possono colpire il tuo insediamento. Se la popolazione scende a zero, sarà <strong>Game Over</strong>.</p>
                  </div>
                </div>
              </div>
          )}
        </div>
    );
  }

  if (gameState === 'gameover') {
    return (
        <div className="fullscreen-menu">
          <Skull size={80} color="#ef4444" style={{marginBottom: '20px'}} />
          <h1 className="game-over-title">Game Over</h1>
          <p>
            L'ultimo dei tuoi cittadini ha perso la vita.
            Il tuo insediamento è ora solo una rovina abbandonata, destinata ad essere consumata dalla natura.
          </p>
          <button className="btn-start" onClick={startNewGame}>
            Ricomincia Nuova Partita
          </button>
        </div>
    );
  }

  return (
      <div className="game-container">
        {/* Input file nascosto per l'upload */}
        <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportSave}
            style={{ display: 'none' }}
        />

        <div className="toast-container">
          {toasts.map(t => (
              <div key={t.id} className={`toast ${t.type === 'danger' ? 'toast-danger' : ''}`}>
                {t.type === 'danger' ? <AlertTriangle size={24} /> : <CheckCircle size={24} color="#064e3b" />}
                <div>
                  <div style={{fontSize: '10px', textTransform: 'uppercase', opacity: 0.8}}>
                    {t.type === 'danger' ? 'Avviso Pericolo' : 'Notifica'}
                  </div>
                  <div>{t.title}</div>
                </div>
              </div>
          ))}
        </div>

        <div className={`hud-wrapper ${isNight ? 'night' : ''}`}>
          <div className="hud-main-stats">
            <div className="stat-card gold">
              <span className="stat-card-label">Finanze</span>
              <div className="stat-card-value"><Coins size={16} /> {inventory.coins}</div>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Popolazione</span>
              <div className="stat-card-value">
                <Users size={16} color="#60a5fa" /> {totalFarmers}
                {respawningFarmers.length > 0 && (
                    <span style={{marginLeft: '4px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '2px'}} title="Cittadini in recupero">
                                    <Skull size={12} /> {respawningFarmers.length}
                                </span>
                )}
              </div>
            </div>
            <div className={`stat-card ${actionsLeft > 0 && !isNight ? 'highlight' : ''}`}>
              <span className="stat-card-label">Azioni Oggi</span>
              <div className="stat-card-value">
                <Zap size={16} color={isNight ? '#64748b' : '#fbbf24'} />
                <span style={{color: isNight ? '#64748b' : 'inherit'}}>{actionsLeft} / {totalFarmers}</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Giorno</span>
              <div className="stat-card-value">
                {isNight ? <Moon size={16} color="#94a3b8" /> : <Sun size={16} color="#fde047" />}
                {dayCount}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTONE L'ANZIANO DEL VILLAGGIO */}
        <button className="floating-btn btn-elder pointer-events-auto" onClick={askVillageElder}>
          <Sparkles size={20} /> Anziano
        </button>

        <div className="floating-btn-container">
          <button className="floating-btn btn-diary" style={{position: 'relative'}} onClick={() => { setShowDiaryModal(true); setUnreadQuests(0); }}>
            <BookMarked size={16} /> Diario
            {unreadQuests > 0 && (
                <span className="badge-notification">{unreadQuests}</span>
            )}
          </button>
          <button className="floating-btn btn-inventory" onClick={() => setShowInventoryModal(true)}>
            <Package size={16} /> Zaino
          </button>
          <button className="floating-btn btn-market" onClick={() => setShowMarketModal(true)}>
            <Store size={16} /> Mercato
          </button>
          <button className="floating-btn btn-settings" onClick={() => setShowSettingsModal(true)}>
            <Settings size={16} /> Opzioni
          </button>
          {actionsLeft > 0 && !isNight && (
              <button className="floating-btn btn-sleep" onClick={endDay}>
                <Moon size={16} /> Dormi
              </button>
          )}
        </div>

        <div className="grid-wrapper">
          <div className={`night-overlay ${isNight ? 'active' : ''}`}>
            <div className="night-text">
              <Moon size={48} color="#cbd5e1" />
              Notte in corso...
            </div>
          </div>
          <div className="farming-grid">
            {grid.map(cell => {
              const isReachableCell = reachableCells.has(cell.id);
              return (
                  <div
                      key={cell.id}
                      className={`cell ${!isReachableCell ? 'fog' : cell.type} ${cell.busyUntil || cell.pendingAction ? 'busy' : ''}`}
                      onClick={() => { if (!cell.busyUntil && !cell.pendingAction && !isNight) setSelectedCell(cell.id); }}
                  >
                    {!isReachableCell ? <CloudFog size={28} color="#f8fafc" opacity={0.8} /> : renderCellContent(cell)}
                  </div>
              );
            })}
          </div>
        </div>

        {/* MODAL L'ANZIANO DEL VILLAGGIO (GEMINI API) */}
        {showElderModal && (
            <div className="action-modal-overlay" style={{zIndex: 100}} onClick={() => setShowElderModal(false)}>
              <div className="action-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles color="#8b5cf6" /> L'Anziano del Villaggio
                  </h3>
                  <button onClick={() => setShowElderModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={20} color="#64748b" />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="elder-chat-box">
                    <div className="elder-avatar">
                      <Users size={32} />
                    </div>
                    <div className="elder-text">
                      {isElderThinking ? (
                          <span className="loading-dots">L'Anziano sta scrutando i presagi</span>
                      ) : (
                          <p style={{ margin: 0 }}>"{elderMessage}"</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* MODAL MENU OPZIONI */}
        {showSettingsModal && (
            <div className="action-modal-overlay" style={{zIndex: 60}} onClick={() => setShowSettingsModal(false)}>
              <div className="action-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings color="#475569" /> Menu di Gioco
                  </h3>
                  <button onClick={() => setShowSettingsModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={20} color="#64748b" />
                  </button>
                </div>
                <div className="modal-body">
                  <button className="action-btn" style={{background: '#10b981', color: 'white'}} onClick={() => { handleSaveGame(false); setShowSettingsModal(false); }}>
                    <Save size={20} /> Salva Partita
                  </button>
                  <button className="action-btn" style={{background: '#3b82f6', color: 'white'}} onClick={() => { handleExportSave(); setShowSettingsModal(false); }}>
                    <Download size={20} /> Esporta Salvataggio (.json)
                  </button>
                  <button className="action-btn" style={{background: '#f59e0b', color: 'white'}} onClick={() => { fileInputRef.current?.click(); setShowSettingsModal(false); }}>
                    <Upload size={20} /> Importa Salvataggio (.json)
                  </button>
                  <button className="action-btn" style={{background: '#ef4444', color: 'white'}} onClick={() => { setGameState('start'); setShowSettingsModal(false); }}>
                    <LogOut size={20} /> Torna al Menu Principale
                  </button>
                </div>
              </div>
            </div>
        )}

        {showDiaryModal && (
            <div className="action-modal-overlay" style={{zIndex: 60}} onClick={() => setShowDiaryModal(false)}>
              <div className="action-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookMarked color="#a855f7" /> Diario di Viaggio
                  </h3>
                  <button onClick={() => setShowDiaryModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={20} color="#64748b" />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{fontSize: '14px', color: '#64748b', marginBottom: '20px'}}>Segui queste indicazioni per espandere il tuo impero. Progredisci sbloccando nuove conoscenze.</p>

                  {ALL_QUESTS.map((quest, idx) => {
                    const isCompleted = completedQuests.includes(quest.id);
                    const isActive = idx === firstIncompleteQuestIndex;
                    const isLocked = idx > firstIncompleteQuestIndex;

                    let statusClass = 'locked';
                    if (isCompleted) statusClass = 'done';
                    else if (isActive) statusClass = 'active';

                    return (
                        <div key={quest.id} className={`diary-item ${statusClass}`}>
                          <div className="diary-icon-wrap">
                            {isLocked ? <Lock size={24} /> : <quest.icon size={24} />}
                          </div>
                          <div className="diary-content">
                            <div className="diary-title">
                              {isLocked ? 'Obiettivo Sconosciuto' : quest.title}
                              {isCompleted && <CheckCircle size={16} color="#15803d" style={{marginLeft: 'auto'}}/>}
                            </div>
                            {!isLocked && (
                                <>
                                  <div className="diary-desc">{quest.desc}</div>
                                  <div className="diary-goal">{quest.goal}</div>
                                </>
                            )}
                            {isLocked && <div className="diary-desc">Completa gli obiettivi precedenti per sbloccare.</div>}
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
            </div>
        )}

        {showInventoryModal && (
            <div className="action-modal-overlay" style={{zIndex: 60}} onClick={() => setShowInventoryModal(false)}>
              <div className="action-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package color="#3b82f6" /> Il Tuo Zaino
                  </h3>
                  <button onClick={() => setShowInventoryModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
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
        )}

        {activeCell && (
            <div className="action-modal-overlay" onClick={() => setSelectedCell(null)}>
              <div className="action-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                    {!isReachable ? (
                        <><CloudFog size={20} style={{display:'inline', marginRight:'8px', verticalAlign:'middle', color:'#94a3b8'}}/> Zona Inesplorata</>
                    ) : (
                        <>
                          {activeCell.type === 'grass' && "Terreno Libero"}
                          {activeCell.type === 'water' && "Fiume / Lago"}
                          {activeCell.type === 'plowed' && "Terreno Arato"}
                          {activeCell.type === 'tree' && "Albero Alto"}
                          {activeCell.type === 'forest' && "Bosco Rigoglioso"}
                          {activeCell.type === 'rock' && "Roccia Solida"}
                          {activeCell.type === 'wild_animal' && "Animali Selvatici"}
                          {activeCell.type === 'ready' && "Raccolto Pronto!"}
                          {activeCell.type === 'growing' && "Coltura in crescita..."}
                          {activeCell.type === 'mine' && "Miniera Attiva"}
                          {activeCell.type === 'animal_farm' && "Fattoria Animali"}
                          {activeCell.type === 'house' && "Casa del Cittadino"}
                          {activeCell.type === 'village' && "Villaggio"}
                          {activeCell.type === 'city' && "Città"}
                          {activeCell.type === 'county' && "Contea"}
                          {activeCell.type === 'lumber_mill' && "Segheria"}
                          {activeCell.type === 'stone_mason' && "Tagliapietre"}
                          {activeCell.type === 'port' && "Porto"}
                        </>
                    )}
                  </h3>
                  <button onClick={() => setSelectedCell(null)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                    <X size={20} color="#64748b" />
                  </button>
                </div>

                <div className="modal-body">
                  {!isReachable ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                        <CloudFog size={50} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                        <div style={{fontSize: '18px', fontWeight: 'bold', color: '#1e293b'}}>Nebbia Fitta</div>
                        <p>Il mare ti blocca il passaggio e la visuale. Costruisci un <b>Porto</b> sulla terraferma adiacente all'acqua per sbloccare la navigazione, diradare la nebbia ed esplorare l'ignoto.</p>
                      </div>
                  ) : (
                      <>
                        {actionsLeft <= 0 && !['growing', 'mine', 'forest', 'animal_farm', 'water'].includes(activeCell.type) && (
                            <div style={{ padding: '10px', background: '#fef2f2', color: '#ef4444', textAlign: 'center', borderRadius: '12px', marginBottom: '15px', fontWeight: 'bold' }}>
                              Azioni esaurite per oggi!
                            </div>
                        )}

                        {activeCell.type === 'wild_animal' && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                              <Rabbit size={40} color="#b45309" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '18px', fontWeight: 'bold', color: '#1e293b'}}>
                                {activeCell.wildAnimalCount === 1 ? 'Animale Solitario' : `Branco Selvatico: ${activeCell.wildAnimalCount} / 10`}
                              </div>
                              <div style={{fontSize: '13px', margin: '10px 0 20px'}}>
                                {activeCell.wildAnimalCount === 1 ? "Cerca un compagno per riprodursi..." :
                                    activeCell.wildAnimalCount! >= 2 && activeCell.wildAnimalCount! < 10 ? "Si stanno riproducendo passivamente (50s)..." : "Capacità massima del branco raggiunta!"}
                              </div>
                              <button className="action-btn" style={{background: '#c2410c', color: 'white'}} disabled={actionsLeft < 2} onClick={() => startAction(activeCell.id, 'hunting')}>
                                <Crosshair size={20} /> Caccia ({(ACTION_TIMES.hunting/1000)}s)
                                <span className="action-badge" style={{background: actionsLeft >= 2 ? 'rgba(255,255,255,0.2)' : '#ef4444', padding: '4px 6px'}}>
                          2<Zap size={10} style={{display:'inline', verticalAlign:'middle'}}/> | 20% 🎯 | 15% <Skull size={10} style={{display:'inline', verticalAlign:'middle'}}/>
                        </span>
                              </button>
                            </div>
                        )}

                        {activeCell.type === 'water' && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                              {totalPorts > 0 ? (
                                  <>
                                    <button className="action-btn btn-fishing" disabled={availableShips < 1} onClick={() => startAction(activeCell.id, 'fishing')}>
                                      <Ship size={20} /> Invia Nave a Pescare (30s)
                                      <span className="action-badge" style={{background: availableShips >= 1 ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                              1<Ship size={10} />
                            </span>
                                    </button>
                                    <p style={{fontSize: '11px', color: '#64748b', marginTop: '8px'}}>Genera 3 Pesci ogni 10 secondi per un massimo di 30 secondi.</p>
                                  </>
                              ) : (
                                  <div style={{ padding: '15px', background: '#f0f9ff', color: '#0284c7', borderRadius: '12px', fontWeight: 'bold' }}>
                                    Costruisci un Porto per poter pescare e navigare in queste acque!
                                  </div>
                              )}
                            </div>
                        )}

                        {activeCell.type === 'grass' && (
                            <>
                              <button className="action-btn btn-plow" disabled={actionsLeft < 1} onClick={() => startAction(activeCell.id, 'plowing')}>
                                <Tractor size={20} /> Ara Terreno ({(ACTION_TIMES.plowing/1000)}s)
                              </button>

                              {isAdjacentToWater && unlocked.port && (
                                  <>
                                    <button className="action-btn btn-port" disabled={actionsLeft < COSTS.port.farmers || !canBuildPort} onClick={() => startAction(activeCell.id, 'building_port')}>
                                      <Anchor size={20} /> Costruisci Porto ({(ACTION_TIMES.building_port/1000)}s)
                                      <span className="action-badge" style={{background: canBuildPort && actionsLeft >= COSTS.port.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            20<TreePine size={10} /> 10<Mountain size={10} /> 200<Coins size={10} /> {COSTS.port.farmers}<Zap size={10} />
                          </span>
                                    </button>
                                    <p style={{fontSize:'10px', color:'#ef4444', textAlign:'center', marginTop:'-5px', marginBottom:'10px'}}>Attenzione: Il porto sacrificherà permanentemente {COSTS.port.farmers} cittadini per l'equipaggio!</p>
                                  </>
                              )}

                              {unlocked.house && (
                                  <button className="action-btn btn-build" disabled={actionsLeft < COSTS.house.farmers || !canBuildHouse} onClick={() => startAction(activeCell.id, 'building_house')}>
                                    <Home size={20} /> Costruisci Casa ({(ACTION_TIMES.building_house/1000)}s)
                                    <span className="action-badge" style={{background: canBuildHouse && actionsLeft >= COSTS.house.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            3<TreePine size={10} /> 6<Mountain size={10} /> {COSTS.house.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                              {unlocked.animal_farm && (
                                  <button className="action-btn btn-build" disabled={actionsLeft < COSTS.animal_farm.farmers || !canBuildAnimalFarm} onClick={() => startAction(activeCell.id, 'building_animal_farm')}>
                                    <Warehouse size={20} /> Fattoria Animali ({(ACTION_TIMES.building_animal_farm/1000)}s)
                                    <span className="action-badge" style={{background: canBuildAnimalFarm && actionsLeft >= COSTS.animal_farm.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            5<Wheat size={10} /> 5<TreePine size={10} /> 5<Mountain size={10} /> 100<Coins size={10} /> {COSTS.animal_farm.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                              {unlocked.lumber_mill && (
                                  <button className="action-btn btn-build" disabled={actionsLeft < COSTS.lumber_mill.farmers || !canBuildLumberMill} onClick={() => startAction(activeCell.id, 'building_lumber_mill')}>
                                    <Factory size={20} /> Segheria ({(ACTION_TIMES.building_lumber_mill/1000)}s)
                                    <span className="action-badge" style={{background: canBuildLumberMill && actionsLeft >= COSTS.lumber_mill.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            15<TreePine size={10} /> 5<Mountain size={10} /> 150<Coins size={10} /> {COSTS.lumber_mill.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                              {unlocked.stone_mason && (
                                  <button className="action-btn btn-build" disabled={actionsLeft < COSTS.stone_mason.farmers || !canBuildStoneMason} onClick={() => startAction(activeCell.id, 'building_stone_mason')}>
                                    <Factory size={20} /> Tagliapietre ({(ACTION_TIMES.building_stone_mason/1000)}s)
                                    <span className="action-badge" style={{background: canBuildStoneMason && actionsLeft >= COSTS.stone_mason.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            10<TreePine size={10} /> 15<Mountain size={10} /> 150<Coins size={10} /> {COSTS.stone_mason.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                              {unlocked.tree && (
                                  <button className="action-btn btn-plant-forest" disabled={actionsLeft < COSTS.tree.farmers || !canPlantTree} onClick={() => startAction(activeCell.id, 'planting_tree')}>
                                    <TreePine size={20} /> Pianta Albero ({(ACTION_TIMES.planting_tree/1000)}s)
                                    <span className="action-badge" style={{background: canPlantTree && actionsLeft >= COSTS.tree.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            {COSTS.tree.coins}<Coins size={10} /> {COSTS.tree.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                              {unlocked.forest && (
                                  <button className="action-btn btn-plant-forest" disabled={actionsLeft < COSTS.forest.farmers || !canPlantForest} onClick={() => startAction(activeCell.id, 'planting_forest')}>
                                    <div style={{display:'flex', marginRight:'4px'}}><TreePine size={20} /><TreePine size={20} style={{marginLeft: '-10px'}}/></div> Pianta Bosco ({(ACTION_TIMES.planting_forest/1000)}s)
                                    <span className="action-badge" style={{background: canPlantForest && actionsLeft >= COSTS.forest.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            {COSTS.forest.stone}<Mountain size={10} /> {COSTS.forest.coins}<Coins size={10} /> {COSTS.forest.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                              {unlocked.rock && (
                                  <button className="action-btn" style={{background: '#475569', color: 'white'}} disabled={actionsLeft < COSTS.rock.farmers || !canSpawnRock} onClick={() => startAction(activeCell.id, 'spawn_rock')}>
                                    <Mountain size={20} /> Cerca Filone ({(ACTION_TIMES.spawn_rock/1000)}s)
                                    <span className="action-badge" style={{background: canSpawnRock && actionsLeft >= COSTS.rock.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                            50<Coins size={10} /> {COSTS.rock.farmers}<Zap size={10} />
                          </span>
                                  </button>
                              )}
                            </>
                        )}

                        {activeCell.type === 'plowed' && (
                            <>
                              <p style={{marginTop: 0, fontSize: '13px', color: '#64748b'}}>Scegli cosa piantare (Lavoro: {(ACTION_TIMES.planting/1000)}s):</p>
                              {(Object.keys(CROPS) as CropId[]).map(cropKey => {
                                const crop = CROPS[cropKey];
                                const seedCount = inventory[`${crop.id}Seeds` as keyof Inventory] as number;
                                return (
                                    <button
                                        key={crop.id} className="action-btn" style={{ background: crop.color, color: 'white' }}
                                        disabled={seedCount < 1 || actionsLeft < 1}
                                        onClick={() => startAction(activeCell.id, `planting_${crop.id}`)}
                                    >
                                      {React.createElement(crop.icon, { size: 20 })} Pianta {crop.name} <span style={{fontSize:'12px', opacity:0.8}}>- Cresce in {crop.growthTime/1000}s</span>
                                      <span className="action-badge">Semi: {seedCount}</span>
                                    </button>
                                );
                              })}
                            </>
                        )}

                        {activeCell.type === 'ready' && activeCell.cropType && (
                            <button className="action-btn btn-harvest" disabled={actionsLeft < 1} onClick={() => startAction(activeCell.id, 'harvesting')}>
                              {React.createElement(CROPS[activeCell.cropType].icon, { size: 20 })}
                              Raccogli {CROPS[activeCell.cropType].name} ({(ACTION_TIMES.harvesting/1000)}s)
                            </button>
                        )}

                        {activeCell.type === 'tree' && (
                            <button className="action-btn btn-chop" disabled={actionsLeft < 1} onClick={() => startAction(activeCell.id, 'chopping')}>
                              <Axe size={20} /> Taglia Albero ({(ACTION_TIMES.chopping/1000)}s)
                            </button>
                        )}

                        {activeCell.type === 'rock' && (
                            <>
                              <button className="action-btn btn-chop" disabled={actionsLeft < 1} onClick={() => startAction(activeCell.id, 'mining')}>
                                <Pickaxe size={20} /> Spacca Roccia ({(ACTION_TIMES.mining/1000)}s)
                              </button>
                              <p style={{fontSize: '11px', color: '#64748b', marginTop: '-5px', marginBottom: '10px', textAlign: 'center'}}>Può droppare: Pietra, Ferro, Rame o Oro.</p>
                              {unlocked.mine && (
                                  <button className="action-btn btn-build" disabled={actionsLeft < COSTS.mine.farmers || !canBuildMine} onClick={() => startAction(activeCell.id, 'building_mine')}>
                                    <Hammer size={20} /> Costruisci Miniera ({(ACTION_TIMES.building_mine/1000)}s)
                                    <span className="action-badge" style={{background: canBuildMine && actionsLeft >= COSTS.mine.farmers ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                              10<TreePine size={10} /> 100<Coins size={10} /> {COSTS.mine.farmers}<Zap size={10} />
                            </span>
                                  </button>
                              )}
                            </>
                        )}

                        {activeCell.type === 'lumber_mill' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Factory size={40} color="#78350f" fill="#92400e" style={{ margin: '0 auto 10px' }} />
                              <button className="action-btn" style={{background: '#d97706', color: 'white'}} disabled={actionsLeft < 1 || inventory.wood < 2} onClick={() => startAction(activeCell.id, 'crafting_planks')}>
                                <Box size={20} /> Crea Asse di Legno ({(ACTION_TIMES.crafting/1000)}s)
                                <span className="action-badge" style={{background: inventory.wood >= 2 && actionsLeft >= 1 ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>2<TreePine size={10} /></span>
                              </button>
                            </div>
                        )}

                        {activeCell.type === 'stone_mason' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Factory size={40} color="#334155" fill="#475569" style={{ margin: '0 auto 10px' }} />
                              <button className="action-btn" style={{background: '#cbd5e1', color: '#334155'}} disabled={actionsLeft < 1 || inventory.stone < 2} onClick={() => startAction(activeCell.id, 'crafting_bricks')}>
                                <Layers size={20} /> Crea Mattone ({(ACTION_TIMES.crafting/1000)}s)
                                <span className="action-badge" style={{background: inventory.stone >= 2 && actionsLeft >= 1 ? 'rgba(0,0,0,0.1)' : '#ef4444', color: inventory.stone >= 2 && actionsLeft >= 1 ? '#334155' : 'white'}}>2<Mountain size={10} /></span>
                              </button>
                            </div>
                        )}

                        {activeCell.type === 'house' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Home size={40} color="#0f172a" fill="#1e293b" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '13px', color: '#64748b'}}>Fornisce 1 Cittadino.</div>

                              {getMergeableCells(activeCell.id, 'house') && unlocked.village && (
                                  <div style={{marginTop: '20px'}}>
                                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.village.farmers || inventory.coins < COSTS.village.coins} onClick={() => startAction(activeCell.id, 'building_village')}>
                                      <Tent size={20} /> Crea Villaggio ({(ACTION_TIMES.building_village/1000)}s)
                                      <span className="action-badge" style={{background: actionsLeft >= COSTS.village.farmers && inventory.coins >= COSTS.village.coins ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                              {COSTS.village.coins}<Coins size={10} /> {COSTS.village.farmers}<Zap size={10} />
                            </span>
                                    </button>
                                    <p style={{fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.4'}}>
                                      Unisce 4 case adiacenti (2x2). Fornisce 6 cittadini!
                                    </p>
                                  </div>
                              )}
                            </div>
                        )}

                        {activeCell.type === 'village' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Tent size={40} color="#1e3a8a" fill="#3b82f6" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '13px', color: '#64748b'}}>Fornisce 6 Cittadini.</div>

                              {getMergeableCells(activeCell.id, 'village') && unlocked.city && (
                                  <div style={{marginTop: '20px'}}>
                                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.city.farmers || inventory.coins < COSTS.city.coins} onClick={() => startAction(activeCell.id, 'building_city')}>
                                      <Castle size={20} /> Crea Città ({(ACTION_TIMES.building_city/1000)}s)
                                      <span className="action-badge" style={{background: actionsLeft >= COSTS.city.farmers && inventory.coins >= COSTS.city.coins ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                              {COSTS.city.coins}<Coins size={10} /> {COSTS.city.farmers}<Zap size={10} />
                            </span>
                                    </button>
                                    <p style={{fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.4'}}>
                                      Unisce 4 villaggi adiacenti (2x2). Fornisce 30 cittadini!
                                    </p>
                                  </div>
                              )}
                            </div>
                        )}

                        {activeCell.type === 'city' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Castle size={40} color="#4c1d95" fill="#7c3aed" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '13px', color: '#64748b'}}>Fornisce 30 Cittadini.</div>

                              {getMergeableCells(activeCell.id, 'city') && unlocked.county && (
                                  <div style={{marginTop: '20px'}}>
                                    <button className="action-btn btn-build" disabled={actionsLeft < COSTS.county.farmers || inventory.coins < COSTS.county.coins} onClick={() => startAction(activeCell.id, 'building_county')}>
                                      <Landmark size={20} /> Crea Contea ({(ACTION_TIMES.building_county/1000)}s)
                                      <span className="action-badge" style={{background: actionsLeft >= COSTS.county.farmers && inventory.coins >= COSTS.county.coins ? 'rgba(255,255,255,0.2)' : '#ef4444'}}>
                              {COSTS.county.coins}<Coins size={10} /> {COSTS.county.farmers}<Zap size={10} />
                            </span>
                                    </button>
                                    <p style={{fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.4'}}>
                                      Unisce 4 città adiacenti (2x2). Fornisce 100 cittadini!
                                    </p>
                                  </div>
                              )}
                            </div>
                        )}

                        {activeCell.type === 'county' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Landmark size={40} color="#701a75" fill="#db2777" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '13px', color: '#64748b'}}>La Contea è l'insediamento massimo. Fornisce ben 100 Cittadini!</div>
                            </div>
                        )}

                        {activeCell.type === 'port' && (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                              <Anchor size={40} color="#1e3a8a" fill="#3b82f6" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '13px', color: '#64748b'}}>Questo porto sblocca la navigazione e funge da base per 1 Nave.</div>
                            </div>
                        )}

                        {activeCell.type === 'animal_farm' && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#64748b' }}>
                              <PawPrint size={40} color="#fb7185" style={{ margin: '0 auto 10px' }} />
                              <div style={{fontSize: '18px', fontWeight: 'bold', color: '#1e293b'}}>Animali: {activeCell.animalCount} / 5</div>
                              <div style={{fontSize: '13px', margin: '10px 0 20px'}}>
                                {activeCell.animalCount! < 2 && "Servono almeno 2 animali per riprodursi."}
                                {activeCell.animalCount! >= 2 && activeCell.animalCount! < 5 && "Cucciolo in arrivo (20s)..."}
                                {activeCell.animalCount! >= 5 && "Capacità massima raggiunta!"}
                              </div>

                              <button className="action-btn btn-sell-direct" disabled={totalAnimals <= 2} onClick={() => {
                                sellAnimals(1, 100);
                                setSelectedCell(null);
                              }}>
                                <Coins size={20} /> Vendi 1 Animale (+100 Monete)
                              </button>
                            </div>
                        )}

                        {activeCell.type === 'mine' && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                              <Hammer size={40} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
                              Miniera in funzione passivamente.<br/>Genera minerali senza usare azioni. ({activeCell.mineTicks || 0}/12)
                            </div>
                        )}

                        {activeCell.type === 'forest' && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '10px'}}>
                                <TreePine size={40} color="#15803d" />
                                <TreePine size={40} color="#15803d" style={{marginLeft: '-15px'}} />
                              </div>
                              Il bosco sta crescendo rigoglioso.<br/>I taglialegna generano automaticamente 2 legna ogni 15s. Scomparirà dopo 60s. ({activeCell.forestTicks || 0}/4)
                            </div>
                        )}

                        {activeCell.type === 'growing' && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                              <Sprout size={40} color="#4ade80" style={{ margin: '0 auto 10px' }} />
                              La pianta sta crescendo da sola.<br/>Nessuna azione necessaria!
                            </div>
                        )}
                      </>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* MODAL MERCATO */}
        {showMarketModal && (
            <div className="action-modal-overlay" style={{zIndex: 60}} onClick={() => setShowMarketModal(false)}>
              <div className="action-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Store color="#10b981" /> Mercato
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', padding: '6px 12px', borderRadius: '12px', color: '#b45309', fontWeight: '800', border: '1px solid #fde68a' }}>
                      <Coins size={16} color="#fbbf24" /> {inventory.coins}
                    </div>
                    <button onClick={() => setShowMarketModal(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
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
                              <div style={{ fontSize: '12px', color: '#64748b' }}>Cresce in {crop.growthTime/1000}s</div>
                            </div>
                          </div>
                          <button className="btn-buy" onClick={() => buySeed(crop.id)} disabled={inventory.coins < crop.seedCost}>
                            {crop.seedCost} <Coins size={12} style={{display:'inline'}}/>
                          </button>
                        </div>
                    );
                  })}

                  <div className="market-section-title">Vendi Animali & Pesce</div>
                  <div className="market-item">
                    <div className="market-item-info">
                      <Bone size={24} color="#b45309" />
                      <div>
                        <strong>Carne Selvatica ({inventory.wildMeat})</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>+250 monete/cad.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-sell" onClick={() => sellResource('wildMeat', 1, 250)} disabled={inventory.wildMeat < 1}>1x</button>
                      <button className="btn-sell-all" onClick={() => sellResource('wildMeat', inventory.wildMeat, 250)} disabled={inventory.wildMeat < 1}>Tutto</button>
                    </div>
                  </div>

                  <div className="market-item">
                    <div className="market-item-info">
                      <PawPrint size={24} color="#fb7185" />
                      <div>
                        <strong>Bestiame ({totalAnimals})</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>+100 monete/cad. <span style={{color: '#ef4444'}}>(Min. 2)</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-sell" onClick={() => sellAnimals(1, 100)} disabled={totalAnimals <= 2}>1x</button>
                      <button className="btn-sell-all" onClick={() => sellAnimals(Math.max(0, totalAnimals - 2), 100)} disabled={totalAnimals <= 2}>Tutto</button>
                    </div>
                  </div>

                  <div className="market-item">
                    <div className="market-item-info">
                      <Fish size={24} color="#7dd3fc" />
                      <div>
                        <strong>Pesce ({inventory.fish})</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>+20 monete/cad.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn-sell" onClick={() => sellResource('fish', 1, 20)} disabled={inventory.fish < 1}>1x</button>
                      <button className="btn-sell-all" onClick={() => sellResource('fish', inventory.fish, 20)} disabled={inventory.fish < 1}>Tutto</button>
                    </div>
                  </div>

                  <div className="market-section-title">Vendi Raccolto</div>
                  {(Object.keys(CROPS) as CropId[]).map(key => {
                    const crop = CROPS[key];
                    const qty = inventory[crop.id] as number;
                    return (
                        <div className="market-item" key={`sell-${crop.id}`}>
                          <div className="market-item-info">
                            {React.createElement(crop.icon, { size: 24, color: crop.color })}
                            <div>
                              <strong>{crop.name} ({qty})</strong>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>+{crop.sellPrice} monete/cad.</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="btn-sell" onClick={() => sellResource(crop.id, 1, crop.sellPrice)} disabled={qty < 1}>1x</button>
                            <button className="btn-sell-all" onClick={() => sellResource(crop.id, qty, crop.sellPrice)} disabled={qty < 1}>Tutto</button>
                          </div>
                        </div>
                    );
                  })}

                  <div className="market-section-title">Vendi Materiali</div>
                  {[
                    { id: 'planks' as keyof Inventory, name: 'Assi di Legno', icon: Box, color: '#d97706', price: 25 },
                    { id: 'bricks' as keyof Inventory, name: 'Mattoni', icon: Layers, color: '#cbd5e1', price: 35 },
                    { id: 'wood' as keyof Inventory, name: 'Legna', icon: TreePine, color: '#14532d', price: 5 },
                    { id: 'stone' as keyof Inventory, name: 'Pietra', icon: Mountain, color: '#475569', price: 8 }
                  ].map(mat => (
                      <div className="market-item" key={`sell-${mat.id}`}>
                        <div className="market-item-info">
                          <mat.icon size={24} color={mat.color} />
                          <div>
                            <strong>{mat.name} ({inventory[mat.id]})</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>+{mat.price} monete/cad.</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn-sell" onClick={() => sellResource(mat.id, 1, mat.price)} disabled={inventory[mat.id] < 1}>1x</button>
                          <button className="btn-sell-all" onClick={() => sellResource(mat.id, inventory[mat.id], mat.price)} disabled={inventory[mat.id] < 1}>Tutto</button>
                        </div>
                      </div>
                  ))}

                  <div className="market-section-title">Vendi Minerali</div>
                  {[
                    { id: 'iron' as keyof Inventory, name: 'Ferro', icon: Gem, color: '#94a3b8', price: 40 },
                    { id: 'copper' as keyof Inventory, name: 'Rame', icon: Gem, color: '#d97706', price: 80 },
                    { id: 'gold' as keyof Inventory, name: 'Oro', icon: Gem, color: '#eab308', price: 200 }
                  ].map(mat => (
                      <div className="market-item" key={`sell-${mat.id}`}>
                        <div className="market-item-info">
                          <mat.icon size={24} color={mat.color} />
                          <div>
                            <strong>{mat.name} ({inventory[mat.id]})</strong>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>+{mat.price} monete/cad.</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn-sell" onClick={() => sellResource(mat.id, 1, mat.price)} disabled={inventory[mat.id] < 1}>1x</button>
                          <button className="btn-sell-all" onClick={() => sellResource(mat.id, inventory[mat.id], mat.price)} disabled={inventory[mat.id] < 1}>Tutto</button>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default App;