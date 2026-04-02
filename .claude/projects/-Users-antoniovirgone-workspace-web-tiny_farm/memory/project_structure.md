---
name: project_structure
description: Struttura del progetto tiny_farm dopo il refactoring in pattern React
type: project
---

Il progetto è stato rifattorizzato da un monolite App.tsx (2458 righe) in una struttura modulare React.

**App.tsx** è mantenuto come file di staging per nuove funzionalità (ha `// @ts-nocheck` in cima). Le nuove feature vanno aggiunte qui e poi spostate nella struttura giusta.

**Il punto di ingresso** è `Game.tsx`, importato da `main.tsx`.

**Why:** Il refactoring è stato fatto per separare responsabilità e rendere il codice più manutenibile.

**How to apply:** Quando l'utente aggiunge nuove feature, suggerisci di aggiungerle prima in App.tsx e poi spostarle nel file più appropriato.

## Struttura
```
src/
├── App.tsx          ← STAGING (non importato, ha @ts-nocheck)
├── Game.tsx         ← componente principale, gestisce tutto lo state
├── main.tsx         ← importa Game
├── types/game.types.ts
├── constants/game.constants.ts  (CROPS, COSTS, ACTION_TIMES, ecc.)
├── config/firebase.ts
├── utils/grid.utils.ts  (generateInitialGrid, getMergeableCells)
├── hooks/
│   ├── useGameLoop.ts    (loop 100ms: mine, forest, animali, azioni)
│   ├── useGameEvents.ts  (loop 45s: malattie, lupi, banditi)
│   ├── useSave.ts        (save/load Firebase + localStorage)
│   └── useVillageElder.ts (chiamata API Gemini)
├── components/
│   ├── AnimatedStickman.tsx
│   ├── GameCell.tsx      (rendering singola cella)
│   ├── GameGrid.tsx      (griglia 8x8)
│   ├── HUD.tsx           (barra stats in alto)
│   ├── FloatingButtons.tsx
│   ├── ToastContainer.tsx
│   └── modals/
│       ├── ElderModal.tsx
│       ├── SettingsModal.tsx
│       ├── DiaryModal.tsx
│       ├── InventoryModal.tsx
│       ├── MarketModal.tsx
│       ├── CellActionModal.tsx
│       └── TutorialModal.tsx
└── screens/
    ├── StartScreen.tsx
    └── GameOverScreen.tsx
```