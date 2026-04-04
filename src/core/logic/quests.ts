// Definizioni e controllo quest — pure, nessuna dipendenza UI o React.
// iconId è una stringa: la UI risolve l'icona (Axe → lucide / RN icon).

import type { Cell, Inventory, QuestDefinition } from '../types/game.types';

// ─── Definizioni ─────────────────────────────────────────────────────────────

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'q1',
    iconId: 'axe',
    title: 'Sopravvivenza Base',
    desc: 'Clicca sugli alberi e sulle rocce verdi della mappa per raccogliere i materiali primari.',
    goal: 'Ottieni 10 Legna e 10 Pietra.',
  },
  {
    id: 'q2',
    iconId: 'home',
    title: 'Un Tetto Sopra la Testa',
    desc: 'Clicca su un prato verde e costruisci una Casa.',
    goal: 'Costruisci la tua prima nuova Casa.',
  },
  {
    id: 'q3',
    iconId: 'wheat',
    title: 'I Frutti della Terra',
    desc: 'Ara un terreno, pianta dei semi di Grano e attendi la crescita.',
    goal: "Ottieni del Grano nell'inventario.",
  },
  {
    id: 'q4',
    iconId: 'factory',
    title: "L'Età dell'Industria",
    desc: 'Costruisci una Segheria e usala per trasformare la legna.',
    goal: 'Costruisci una Segheria e crea la tua prima Asse.',
  },
  {
    id: 'q5',
    iconId: 'anchor',
    title: "Verso l'Ignoto",
    desc: "Costruisci un Porto sull'erba vicino all'acqua.",
    goal: 'Costruisci un Porto per diradare la nebbia.',
  },
  {
    id: 'q6',
    iconId: 'hammer',
    title: 'Profondità Oscure',
    desc: 'Trasforma una Roccia in una Miniera permanente.',
    goal: 'Costruisci una Miniera.',
  },
  {
    id: 'q7',
    iconId: 'tent',
    title: 'Urbanistica',
    desc: 'Metti 4 Case vicine a formare un quadrato 2×2.',
    goal: 'Fonda un Villaggio.',
  },
  {
    id: 'q8',
    iconId: 'landmark',
    title: "L'Impero",
    desc: 'Continua a fondere i tuoi insediamenti.',
    goal: 'Fonda la gloriosa Contea.',
  },
];

// ─── Stato per il check ───────────────────────────────────────────────────────

export interface QuestCheckState {
  inventory: Inventory;
  grid: Cell[];
  totalPorts: number;
}

const questIsDone: Record<string, (s: QuestCheckState) => boolean> = {
  q1: s => s.inventory.wood >= 10 && s.inventory.stone >= 10,
  q2: s => s.grid.filter(c => c.type === 'house').length > 1 || s.grid.some(c => ['village', 'city', 'county'].includes(c.type)),
  q3: s => s.inventory.wheat > 0,
  q4: s => s.inventory.planks > 0,
  q5: s => s.totalPorts > 0,
  q6: s => s.grid.some(c => c.type === 'mine'),
  q7: s => s.grid.some(c => ['village', 'city', 'county'].includes(c.type)),
  q8: s => s.grid.some(c => c.type === 'county'),
};

/**
 * Controlla se la quest attiva (la prima non completata) è stata completata.
 * Restituisce la quest completata oppure null.
 */
export const checkActiveQuest = (
  completedQuests: string[],
  state: QuestCheckState,
): { id: string; title: string } | null => {
  const quest = QUEST_DEFINITIONS.find(q => !completedQuests.includes(q.id));
  if (!quest) return null;
  if (questIsDone[quest.id]?.(state)) {
    return { id: quest.id, title: quest.title };
  }
  return null;
};
