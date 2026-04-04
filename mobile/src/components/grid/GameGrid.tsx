import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import type { Cell } from '@core/types/game.types';
import GameCell from './GameCell';

interface Props {
  grid: Cell[];
  reachableCells: Set<number>;
  selectedCell: number | null;
  now: number;
  onCellPress: (id: number) => void;
}

const GRID_COLS = 8;
const PADDING   = 4;

const GameGrid: React.FC<Props> = ({ grid, reachableCells, selectedCell, now, onCellPress }) => (
  <View style={styles.container}>
    <FlatList
      data={grid}
      numColumns={GRID_COLS}
      keyExtractor={item => String(item.id)}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <GameCell
          cell={item}
          isReachable={reachableCells.has(item.id)}
          isSelected={selectedCell === item.id}
          now={now}
          onPress={onCellPress}
        />
      )}
      contentContainerStyle={styles.grid}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: PADDING,
  },
  grid: {
    gap: 0,
  },
});

export default React.memo(GameGrid);
