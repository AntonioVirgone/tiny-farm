// Mapping iconId (stringa dal core) → componente icona React Native.
// Usa @expo/vector-icons (incluso in Expo).
import React from 'react';
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type IconProps = { size?: number; color?: string };

// ── Icone celle griglia (emoji — leggibili su ogni schermo) ───────────────
export const CELL_EMOJI: Record<string, string> = {
  grass:        '🌿',
  water:        '🌊',
  plowed:       '🟫',
  growing:      '🌱',
  ready:        '✅',
  tree:         '🌲',
  forest:       '🌳',
  rock:         '🪨',
  bush:         '🫐',
  house:        '🏠',
  village:      '⛺',
  city:         '🏰',
  county:       '🏯',
  mine:         '⛏️',
  animal_farm:  '🐑',
  lumber_mill:  '🏭',
  stone_mason:  '🏗️',
  port:         '⚓',
  wild_animal:  '🐇',
  wolf:         '🐺',
  fog:          '🌫️',
};

// ── Icone inventario ──────────────────────────────────────────────────────
export const INVENTORY_EMOJI: Record<string, string> = {
  coins:       '💰',
  wood:        '🪵',
  stone:       '🪨',
  wheat:       '🌾',
  wheatSeeds:  '🌱',
  tomato:      '🍅',
  tomatoSeeds: '🌱',
  carrot:      '🥕',
  carrotSeeds: '🌱',
  eggplant:    '🍆',
  eggplantSeeds:'🌱',
  fish:        '🐟',
  berries:     '🫐',
  planks:      '📦',
  bricks:      '🧱',
  wildMeat:    '🥩',
  iron:        '⚙️',
  copper:      '🔶',
  gold:        '🌕',
};

// ── Icone colture ─────────────────────────────────────────────────────────
export const CROP_EMOJI: Record<string, string> = {
  wheat:    '🌾',
  tomato:   '🍅',
  carrot:   '🥕',
  eggplant: '🍆',
};

// ── Icone quest (iconId → componente) ─────────────────────────────────────
export const QuestIcon: React.FC<{ iconId: string } & IconProps> = ({ iconId, size = 20, color = '#3b82f6' }) => {
  const props = { size, color };
  switch (iconId) {
    case 'axe':      return <MaterialCommunityIcons name="axe" {...props} />;
    case 'home':     return <MaterialIcons name="home" {...props} />;
    case 'wheat':    return <MaterialCommunityIcons name="barley" {...props} />;
    case 'factory':  return <MaterialIcons name="factory" {...props} />;
    case 'anchor':   return <FontAwesome5 name="anchor" {...props} />;
    case 'hammer':   return <MaterialCommunityIcons name="hammer" {...props} />;
    case 'tent':     return <MaterialCommunityIcons name="tent" {...props} />;
    case 'landmark': return <FontAwesome5 name="landmark" {...props} />;
    default:         return <MaterialIcons name="star" {...props} />;
  }
};

// ── Icone azioni UI ───────────────────────────────────────────────────────
export const ActionIcon: React.FC<{ name: string } & IconProps> = ({ name, size = 20, color = '#fff' }) => {
  const props = { size, color };
  switch (name) {
    case 'save':     return <Ionicons name="save-outline" {...props} />;
    case 'book':     return <Ionicons name="book-outline" {...props} />;
    case 'bag':      return <Ionicons name="bag-outline" {...props} />;
    case 'market':   return <MaterialIcons name="storefront" {...props} />;
    case 'diary':    return <Ionicons name="journal-outline" {...props} />;
    case 'elder':    return <MaterialCommunityIcons name="wizard-hat" {...props} />;
    case 'settings': return <Ionicons name="settings-outline" {...props} />;
    case 'moon':     return <Ionicons name="moon-outline" {...props} />;
    case 'sun':      return <Ionicons name="sunny-outline" {...props} />;
    default:         return <MaterialIcons name="touch-app" {...props} />;
  }
};
