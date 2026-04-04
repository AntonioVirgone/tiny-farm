import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import type { Cell } from '@core/types/game.types';
import { CELL_EMOJI } from '../../icons/iconMap';
import { cellBgColor } from '../../styles/colors';
import { colors } from '../../styles/colors';

interface Props {
  cell: Cell;
  isReachable: boolean;
  isSelected: boolean;
  now: number;
  onPress: (id: number) => void;
}

const GRID_COLS = 8;
const PADDING   = 4;

const GameCell: React.FC<Props> = ({ cell, isReachable, isSelected, now, onPress }) => {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - PADDING * 2) / GRID_COLS);

  const progress = useMemo(() => {
    if (!cell.busyUntil || !cell.busyTotalDuration) return null;
    const elapsed = cell.busyTotalDuration - (cell.busyUntil - now);
    return Math.min(1, Math.max(0, elapsed / cell.busyTotalDuration));
  }, [cell.busyUntil, cell.busyTotalDuration, now]);

  const isHidden = !isReachable;
  const bg = isHidden ? colors.cellFog : cellBgColor(cell.type);

  const emoji = isHidden
    ? CELL_EMOJI.fog
    : CELL_EMOJI[cell.type] ?? '?';

  const countLabel = useMemo(() => {
    if (cell.type === 'wild_animal' && cell.wildAnimalCount && cell.wildAnimalCount > 1)
      return `×${cell.wildAnimalCount}`;
    if (cell.type === 'wolf' && cell.wolfCount && cell.wolfCount > 1)
      return `×${cell.wolfCount}`;
    if (cell.type === 'animal_farm' && cell.animalCount)
      return `×${cell.animalCount}`;
    if (cell.type === 'mine')
      return `${cell.mineTicks ?? 0}/12`;
    return null;
  }, [cell]);

  const s = StyleSheet.create({
    cell: {
      width: cellSize,
      height: cellSize,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: isSelected ? 2 : 0.5,
      borderColor: isSelected ? '#fbbf24' : 'rgba(0,0,0,0.15)',
    },
  });

  return (
    <Pressable
      style={s.cell}
      onPress={() => !isHidden && onPress(cell.id)}
    >
      {!isHidden && (
        <>
          <Text style={[styles.emoji, { fontSize: cellSize * 0.38 }]}>{emoji}</Text>
          {countLabel && (
            <Text style={[styles.count, { fontSize: cellSize * 0.22 }]}>{countLabel}</Text>
          )}
          {progress !== null && (
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
          )}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
    lineHeight: undefined,
  },
  count: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressFill: {
    height: 3,
    backgroundColor: '#fbbf24',
  },
});

export default React.memo(GameCell);
