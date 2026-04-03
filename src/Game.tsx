import React, { useEffect, useMemo, useRef, useState } from 'react';
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
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Nunito', system-ui, sans-serif;
  background: linear-gradient(160deg, #0a1f10 0%, #1a4028 50%, #0b2414 100%);
  min-height: 100vh;
  color: #1e293b;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.game-container {
  max-width: 500px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f0e8;
  position: relative;
  padding-bottom: 80px;
  box-shadow: 0 0 0 3px rgba(124,74,30,0.4), 0 0 80px rgba(0,0,0,0.5);
}

/* ── HUD ──────────────────────────────────────────── */
.hud-wrapper {
  background: linear-gradient(180deg, #1a3319 0%, #1f3d1e 100%);
  color: #f0fdf4;
  border-bottom: 2px solid #2d5a27;
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  transition: background 2s, border-color 2s;
}
.hud-wrapper.night {
  background: linear-gradient(180deg, #050c14 0%, #0a1628 100%);
  border-bottom-color: #1e3a5f;
}

.hud-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.hud-game-title {
  font-size: 15px;
  font-weight: 900;
  color: #4ade80;
  letter-spacing: 0.5px;
  text-shadow: 0 0 20px rgba(74,222,128,0.4);
}
.hud-day-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 800;
  color: #f0fdf4;
}

.hud-main-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.stat-card {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  padding: 9px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-weight: 800;
  font-size: 15px;
  transition: all 0.2s ease;
}
.stat-card.highlight {
  background: rgba(251,191,36,0.12);
  border-color: rgba(251,191,36,0.35);
  box-shadow: 0 0 14px rgba(251,191,36,0.12);
}
.stat-card.gold {
  background: rgba(251,191,36,0.1);
  border-color: rgba(251,191,36,0.3);
  color: #fde68a;
}
.stat-card-label {
  font-size: 9px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 700;
}
.stat-card-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #f8fafc;
}

/* ── BOTTOM NAV ───────────────────────────────────── */
.floating-btn-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 6px 4px max(env(safe-area-inset-bottom), 8px);
  z-index: 20;
  max-width: 500px;
  margin: 0 auto;
  background: rgba(10, 18, 12, 0.94);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid rgba(74,222,128,0.12);
  box-shadow: 0 -8px 30px rgba(0,0,0,0.4);
  pointer-events: auto;
}
.floating-btn {
  pointer-events: auto;
  padding: 6px 8px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s, color 0.2s;
  flex: 1;
  max-width: 72px;
  background: transparent;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.3px;
}
.floating-btn:active { transform: scale(0.88); }
.floating-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.floating-btn.nav-active { color: #4ade80; }
.floating-btn.nav-danger { color: #fbbf24; }
.floating-btn.nav-sleep { color: #93c5fd; }

.btn-elder {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  border: none;
  box-shadow: 0 0 20px rgba(124,58,237,0.5), 0 4px 12px rgba(0,0,0,0.3);
  position: fixed;
  right: 16px;
  top: 110px;
  z-index: 30;
  padding: 10px 14px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.1s, box-shadow 0.2s;
  letter-spacing: 0.3px;
}
.btn-elder:active { transform: scale(0.93); }

.badge-notification {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 900;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(10,18,12,0.9);
  animation: bounce-strong 1s infinite;
}
@keyframes bounce-strong {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.15); }
}

/* ── TOASTS ───────────────────────────────────────── */
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
  width: 90%;
  max-width: 380px;
}
.toast {
  background: #166534;
  color: #dcfce7;
  padding: 12px 18px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(74,222,128,0.2);
  animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1), fadeOut 0.4s 3.6s forwards;
}
.toast-danger {
  background: #7f1d1d;
  color: #fecaca;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(239,68,68,0.3);
}
@keyframes slideDown {
  from { transform: translateY(-40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fadeOut { to { opacity: 0; transform: translateY(-16px); } }

/* ── GRID ─────────────────────────────────────────── */
.grid-wrapper {
  padding: 10px 10px 14px;
  flex-grow: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
}
.night-overlay {
  position: absolute;
  inset: 10px;
  background: rgba(5, 12, 25, 0.78);
  z-index: 40;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1.5s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}
.night-overlay.active { opacity: 1; pointer-events: auto; }
.night-text {
  color: #cbd5e1;
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 0 4px 10px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.5px;
}
.night-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: 16px;
}
.night-stars::before, .night-stars::after {
  content: '✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦';
  position: absolute;
  color: rgba(255,255,255,0.3);
  font-size: 12px;
  letter-spacing: 18px;
  top: 15%;
  animation: starFloat 8s ease-in-out infinite alternate;
}
.night-stars::after {
  top: 60%;
  letter-spacing: 24px;
  opacity: 0.6;
  animation-delay: -4s;
  font-size: 9px;
}
@keyframes starFloat {
  from { transform: translateX(-5%) translateY(0); }
  to { transform: translateX(5%) translateY(-8px); }
}

.farming-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 2px;
  background: #1a3a10;
  padding: 5px;
  border-radius: 16px;
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 4px solid #3a6a28;
  box-shadow:
    0 0 0 2px #1a3a10,
    0 8px 32px rgba(0,0,0,0.25),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

.cell {
  background: linear-gradient(145deg, #5fca70, #4ab55a);
  border-radius: 5px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.12s, transform 0.1s, box-shadow 0.15s;
  overflow: hidden;
}
.cell:not(.busy):hover { filter: brightness(1.12); }
.cell:active { filter: brightness(0.88); transform: scale(0.93); }
.cell.busy { cursor: default; filter: brightness(0.82); }
.cell.selected {
  box-shadow: 0 0 0 2px white, 0 0 0 4px #fbbf24;
  z-index: 2;
  animation: selectedPulse 1.2s infinite;
}
@keyframes selectedPulse {
  0%, 100% { box-shadow: 0 0 0 2px white, 0 0 0 4px #fbbf24; }
  50% { box-shadow: 0 0 0 2px white, 0 0 0 5px #f59e0b, 0 0 12px rgba(245,158,11,0.4); }
}

/* Cell type colors */
.cell.fog {
  background: linear-gradient(145deg, #64748b, #475569);
  animation: fogPulse 3s infinite alternate;
}
@keyframes fogPulse {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.18); }
}
.cell.plowed {
  background: repeating-linear-gradient(
    155deg,
    #92400e 0px, #92400e 4px,
    #7c3209 4px, #7c3209 8px
  );
}
.cell.water {
  background: linear-gradient(145deg, #38bdf8, #0284c7);
  animation: waterShimmer 4s infinite alternate;
}
@keyframes waterShimmer {
  0% { background: linear-gradient(145deg, #38bdf8, #0284c7); }
  100% { background: linear-gradient(145deg, #7dd3fc, #0ea5e9); }
}
.cell.tree { background: linear-gradient(145deg, #22c55e, #15803d); }
.cell.forest { background: linear-gradient(145deg, #16a34a, #14532d); }
.cell.rock { background: linear-gradient(145deg, #9ca3af, #6b7280); }
.cell.mine { background: linear-gradient(145deg, #52525b, #27272a); }
.cell.house { background: linear-gradient(145deg, #fde68a, #f59e0b); }
.cell.village { background: linear-gradient(145deg, #93c5fd, #3b82f6); }
.cell.city { background: linear-gradient(145deg, #c4b5fd, #8b5cf6); }
.cell.county { background: linear-gradient(145deg, #f9a8d4, #ec4899); }
.cell.lumber_mill { background: linear-gradient(145deg, #fbbf24, #d97706); }
.cell.stone_mason { background: linear-gradient(145deg, #94a3b8, #475569); }
.cell.port { background: linear-gradient(145deg, #7dd3fc, #0369a1); }
.cell.animal_farm { background: linear-gradient(145deg, #fca5a5, #ef4444); }
.cell.wild_animal { background: linear-gradient(145deg, #86efac, #22c55e); }
.cell.wolf { background: linear-gradient(145deg, #cbd5e1, #94a3b8); }
.cell.bush { background: linear-gradient(145deg, #a7f3d0, #4ade80); }
.cell.growing { background: linear-gradient(145deg, #86efac, #4ade80); }
.cell.ready {
  background: linear-gradient(145deg, #fde68a, #fbbf24);
  animation: readyPulse 1.8s infinite;
}
@keyframes readyPulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.15); box-shadow: 0 0 8px rgba(251,191,36,0.6); }
}

/* ── PROGRESS BAR ─────────────────────────────────── */
.progress-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.progress-bar-bg {
  position: absolute;
  bottom: 3px;
  width: 82%;
  height: 5px;
  background: rgba(0,0,0,0.35);
  border-radius: 3px;
  overflow: hidden;
  z-index: 20;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.1s linear;
}

/* ── STICKMAN ANIMATIONS ──────────────────────────── */
@keyframes strikeAnim { 0% { transform: rotate(-40deg); } 100% { transform: rotate(30deg); } }
@keyframes farmAnim { 0% { transform: rotate(-10deg) translateY(-2px); } 100% { transform: rotate(25deg) translateY(4px); } }
@keyframes huntAnim { 0% { transform: translateX(0) rotate(0deg); } 40% { transform: translateX(-5px) rotate(-15deg); } 100% { transform: translateX(12px) rotate(20deg); } }
.anim-strike { animation: strikeAnim 0.3s infinite alternate ease-in-out; }
.anim-farm { animation: farmAnim 0.4s infinite alternate ease-in-out; }
.anim-hunt { animation: huntAnim 0.5s infinite alternate cubic-bezier(0.25,0.46,0.45,0.94); }

/* ── ACTION MODAL ─────────────────────────────────── */
.action-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}
.action-modal {
  background: #f5f0e8;
  width: 100%;
  max-width: 500px;
  border-radius: 24px 24px 0 0;
  padding: 0 0 20px;
  animation: slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.3);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  padding: 18px 20px 14px;
  background: #f5f0e8;
  border-radius: 24px 24px 0 0;
  border-bottom: 2px solid rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 5;
}
.modal-body { padding: 16px 20px 4px; }

.action-btn {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: none;
  font-family: 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.1s, filter 0.1s;
  margin-bottom: 10px;
  position: relative;
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}
.action-btn:active { transform: scale(0.97); filter: brightness(0.92); }
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.action-badge {
  position: absolute;
  right: 12px;
  background: rgba(0,0,0,0.18);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  color: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 700;
}

.btn-plow { background: linear-gradient(135deg, #b45309, #92400e); color: white; }
.btn-harvest { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #451a03; }
.btn-chop { background: linear-gradient(135deg, #64748b, #475569); color: white; }
.btn-build { background: linear-gradient(135deg, #1e3a5f, #1e293b); color: white; }
.btn-plant-forest { background: linear-gradient(135deg, #16a34a, #14532d); color: white; }
.btn-sell-direct { background: linear-gradient(135deg, #eab308, #ca8a04); color: white; }
.btn-fishing { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; }
.btn-port { background: linear-gradient(135deg, #1e40af, #1e3a8a); color: white; }

/* ── MODALS (diary, inventory, market, settings, elder) ─ */
.diary-item {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  gap: 13px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.diary-item.done { background: #f0fdf4; border-color: #4ade80; opacity: 0.85; }
.diary-item.active { background: #eff6ff; border-color: #3b82f6; box-shadow: 0 4px 14px rgba(59,130,246,0.12); transform: translateY(-1px); }
.diary-item.locked { background: #f8fafc; border-color: #e2e8f0; opacity: 0.55; filter: grayscale(1); }
.diary-icon-wrap { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #e5e7eb; color: #6b7280; }
.diary-item.done .diary-icon-wrap { background: #4ade80; color: white; }
.diary-item.active .diary-icon-wrap { background: #3b82f6; color: white; }
.diary-content { display: flex; flex-direction: column; gap: 4px; flex-grow: 1; }
.diary-title { font-weight: 800; font-size: 15px; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.diary-desc { font-size: 12px; color: #64748b; line-height: 1.4; }
.diary-goal { font-size: 12px; font-weight: 700; color: #0f172a; background: rgba(0,0,0,0.05); padding: 5px 10px; border-radius: 8px; margin-top: 4px; display: inline-block; }
.diary-item.active .diary-goal { background: #dbeafe; color: #1d4ed8; }
.diary-item.done .diary-goal { background: #dcfce7; color: #15803d; text-decoration: line-through; }

.inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 10px; margin-bottom: 24px; }
.inventory-card { background: white; border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.inventory-val { font-size: 20px; font-weight: 900; color: #1e293b; margin-top: 3px; }
.inventory-name { font-size: 9px; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

.market-section-title { font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 8px; }
.market-item { display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 14px; border: 1px solid #e5e7eb; margin-bottom: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.market-item-info { display: flex; align-items: center; gap: 12px; }
.btn-buy, .btn-sell, .btn-sell-all { padding: 8px 12px; margin: 0; font-size: 12px; width: auto; border-radius: 10px; border: none; font-weight: 800; cursor: pointer; color: white; font-family: 'Nunito', system-ui, sans-serif; }
.btn-buy { background: #10b981; }
.btn-sell { background: #f59e0b; }
.btn-sell-all { background: #d97706; }

/* ── START / GAME OVER SCREENS ────────────────────── */
.fullscreen-menu {
  position: fixed;
  inset: 0;
  background: linear-gradient(160deg, #071a0c 0%, #0f2d18 40%, #071410 100%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 40px 24px;
  overflow: hidden;
}
.fullscreen-menu::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(74,222,128,0.06) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(34,197,94,0.08) 0%, transparent 35%);
  pointer-events: none;
}
.start-logo {
  font-size: 72px;
  line-height: 1;
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 20px rgba(74,222,128,0.3));
  animation: logoFloat 4s ease-in-out infinite alternate;
}
@keyframes logoFloat {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}
.fullscreen-menu h1 {
  font-size: 2.4rem;
  color: #4ade80;
  margin: 0 0 6px;
  font-weight: 900;
  letter-spacing: -0.5px;
  text-shadow: 0 0 30px rgba(74,222,128,0.5);
}
.fullscreen-menu .subtitle {
  color: rgba(255,255,255,0.45);
  font-size: 0.9rem;
  margin: 0 0 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.fullscreen-menu p {
  color: rgba(255,255,255,0.6);
  font-size: 1rem;
  max-width: 360px;
  margin: 0 0 36px;
  line-height: 1.6;
}
.btn-start {
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  padding: 16px 36px;
  font-size: 1.1rem;
  font-weight: 900;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(22,163,74,0.35);
  width: 100%;
  max-width: 280px;
  font-family: 'Nunito', system-ui, sans-serif;
  letter-spacing: 0.3px;
}
.btn-start:hover { transform: scale(1.04); box-shadow: 0 12px 30px rgba(22,163,74,0.45); }
.btn-start:active { transform: scale(0.97); }
.game-over-title { color: #f87171 !important; text-shadow: 0 0 30px rgba(248,113,113,0.4) !important; }

.fullscreen-menu .settings-btn-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 100%;
}

/* ── ELDER MODAL ──────────────────────────────────── */
.elder-chat-box {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
.elder-avatar {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(109,40,217,0.35);
}
.elder-text {
  font-size: 15px;
  color: #1e293b;
  line-height: 1.6;
  font-style: italic;
  font-weight: 600;
}
.loading-dots:after {
  content: '.';
  animation: dots 1.5s steps(5, end) infinite;
}
@keyframes dots {
  0%, 20% { color: rgba(0,0,0,0); text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
  40% { color: #1e293b; text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
  60% { text-shadow: .25em 0 0 #1e293b, .5em 0 0 rgba(0,0,0,0); }
  80%, 100% { text-shadow: .25em 0 0 #1e293b, .5em 0 0 #1e293b; }
}

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }
`;

const Game: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>('start');
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
      checkUnlock('bush', inventory.coins >= COSTS.bush.coins && totalFarmers >= COSTS.bush.farmers);
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

      // Spawn alberi e cespugli
      const emptyGrass = newGrid.map((c, idx) => c.type === 'grass' && !c.busyUntil && c.pendingAction === null ? idx : -1).filter(idx => idx !== -1);
      if (emptyGrass.length > 0) {
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        for (let k = 0; k < spawnCount; k++) {
          if (emptyGrass.length === 0) break;
          const randIndex = Math.floor(Math.random() * emptyGrass.length);
          const cellId = emptyGrass[randIndex];
          newGrid[cellId] = { ...newGrid[cellId], type: Math.random() < 0.3 ? 'bush' : 'tree' };
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
    gameState, stateRef, isSaving, setIsSaving, setHasSave, setToasts,
    setInventory, setUnlocked, setGrid, setCompletedQuests,
    setRespawningFarmers, setDayCount, setActionsUsedToday, setIsNight, setGameState,
  });

  const { showElderModal, setShowElderModal, elderMessage, isElderThinking, askVillageElder } = useVillageElder();

  // --- CHECK SAVE ON LOAD ---
  useEffect(() => {
    const localSave = localStorage.getItem('fattoria_avanzata_save');
    if (localSave) setHasSave(true);
  }, []);

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
    else if (action === 'planting_bush') costFarmers = COSTS.bush.farmers;

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

    if (action === 'planting_bush') {
      if (inventory.coins < COSTS.bush.coins) return;
      setInventory(prev => ({ ...prev, coins: prev.coins - COSTS.bush.coins }));
      setGrid(prev => prev.map(c => c.id === cellId ? { ...c, busyUntil: Date.now() + ACTION_TIMES.planting_bush, busyTotalDuration: ACTION_TIMES.planting_bush, pendingAction: action, farmersUsed: costFarmers } : c));
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

    if (['plowing', 'chopping', 'mining', 'harvesting', 'harvesting_bush'].includes(action as string)) {
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
        selectedCell={selectedCell}
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