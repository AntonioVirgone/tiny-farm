export const colors = {
  // Backgrounds
  bgDark:    '#0a1f10',
  bgMedium:  '#1a4028',
  bgLight:   '#2d5a3d',
  surface:   '#f8fafc',
  surfaceDim:'#f1f5f9',

  // Text
  textPrimary:   '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',
  textOnDark:    '#e2e8f0',

  // Accents
  primary:  '#3b82f6',
  success:  '#10b981',
  danger:   '#ef4444',
  warning:  '#f59e0b',
  purple:   '#8b5cf6',

  // Cell backgrounds
  cellGrass:    '#4ade80',
  cellWater:    '#60a5fa',
  cellPlowed:   '#a16207',
  cellGrowing:  '#86efac',
  cellReady:    '#fbbf24',
  cellTree:     '#15803d',
  cellForest:   '#166534',
  cellRock:     '#64748b',
  cellBush:     '#86efac',
  cellHouse:    '#c084fc',
  cellVillage:  '#818cf8',
  cellCity:     '#6366f1',
  cellCounty:   '#7c3aed',
  cellMine:     '#78716c',
  cellFarm:     '#f472b6',
  cellMill:     '#d97706',
  cellMason:    '#94a3b8',
  cellPort:     '#0ea5e9',
  cellAnimal:   '#fca5a5',
  cellWolf:     '#475569',
  cellFog:      '#1e293b',

  // UI
  border:    '#e2e8f0',
  overlay:   'rgba(0,0,0,0.5)',
  nightBg:   'rgba(15,23,42,0.7)',
};

export const cellBgColor = (type: string): string => {
  const map: Record<string, string> = {
    grass:       colors.cellGrass,
    water:       colors.cellWater,
    plowed:      colors.cellPlowed,
    growing:     colors.cellGrowing,
    ready:       colors.cellReady,
    tree:        colors.cellTree,
    forest:      colors.cellForest,
    rock:        colors.cellRock,
    bush:        colors.cellBush,
    house:       colors.cellHouse,
    village:     colors.cellVillage,
    city:        colors.cellCity,
    county:      colors.cellCounty,
    mine:        colors.cellMine,
    animal_farm: colors.cellFarm,
    lumber_mill: colors.cellMill,
    stone_mason: colors.cellMason,
    port:        colors.cellPort,
    wild_animal: colors.cellAnimal,
    wolf:        colors.cellWolf,
  };
  return map[type] ?? colors.bgDark;
};
