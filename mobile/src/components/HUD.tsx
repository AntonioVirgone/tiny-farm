import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { INVENTORY_EMOJI } from '../icons/iconMap';
import type { Inventory } from '@core/types/game.types';

interface Props {
  dayCount: number;
  isNight: boolean;
  totalFarmers: number;
  actionsLeft: number;
  inventory: Inventory;
  onEndDay: () => void;
}

const Stat: React.FC<{ emoji: string; value: number | string; small?: boolean }> = ({ emoji, value, small }) => (
  <View style={styles.stat}>
    <Text style={small ? styles.statEmojiSm : styles.statEmoji}>{emoji}</Text>
    <Text style={small ? styles.statValueSm : styles.statValue}>{value}</Text>
  </View>
);

const HUD: React.FC<Props> = ({ dayCount, isNight, totalFarmers, actionsLeft, inventory, onEndDay }) => (
  <View style={styles.container}>
    {/* Row 1: titolo + giorno */}
    <View style={styles.row}>
      <Text style={styles.title}>🌾 Tiny Farm</Text>
      <View style={styles.dayBadge}>
        <Ionicons name={isNight ? 'moon' : 'sunny'} size={14} color={isNight ? '#818cf8' : '#fbbf24'} />
        <Text style={styles.dayText}>Giorno {dayCount}</Text>
      </View>
    </View>

    {/* Row 2: stats principali */}
    <View style={styles.row}>
      <Stat emoji={INVENTORY_EMOJI.coins}  value={inventory.coins} />
      <Stat emoji="👥" value={`${actionsLeft}/${totalFarmers}`} />
      <Stat emoji={INVENTORY_EMOJI.wood}   value={inventory.wood} />
      <Stat emoji={INVENTORY_EMOJI.stone}  value={inventory.stone} />
      <Stat emoji={INVENTORY_EMOJI.wheat}  value={inventory.wheat} small />
      <Stat emoji={INVENTORY_EMOJI.fish}   value={inventory.fish} small />

      <Pressable
        style={[styles.endDayBtn, actionsLeft === 0 && styles.endDayBtnActive]}
        onPress={onEndDay}
        disabled={isNight}
      >
        <Ionicons name="moon-outline" size={14} color="#fff" />
        <Text style={styles.endDayText}>Notte</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 15,
    flex: 1,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dayText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: {
    fontSize: 14,
  },
  statEmojiSm: {
    fontSize: 12,
  },
  statValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  statValueSm: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  endDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  endDayBtnActive: {
    backgroundColor: colors.primary,
  },
  endDayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default HUD;
