import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Inventory } from '@core/types/game.types';
import { CROPS } from '@core/constants/game.constants';
import { INVENTORY_EMOJI, CROP_EMOJI } from '../../icons/iconMap';
import { colors } from '../../styles/colors';

interface Props {
  visible: boolean;
  inventory: Inventory;
  onSell: (resource: keyof Inventory, amount: number, coins: number) => void;
  onBuySeed: (cropId: string, cost: number) => void;
  onClose: () => void;
}

interface SellRowProps {
  emoji: string;
  label: string;
  amount: number;
  price: number;
  onSell1: () => void;
  onSellAll: () => void;
}

const SellRow: React.FC<SellRowProps> = ({ emoji, label, amount, price, onSell1, onSellAll }) => (
  <View style={styles.row}>
    <Text style={styles.emoji}>{emoji}</Text>
    <View style={styles.rowInfo}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowStock}>In magazzino: {amount}</Text>
    </View>
    <Text style={styles.price}>{price}🪙</Text>
    <Pressable style={[styles.smallBtn, amount < 1 && styles.disabledBtn]} onPress={onSell1} disabled={amount < 1}>
      <Text style={styles.smallBtnText}>×1</Text>
    </Pressable>
    <Pressable style={[styles.smallBtn, styles.allBtn, amount < 1 && styles.disabledBtn]} onPress={onSellAll} disabled={amount < 1}>
      <Text style={styles.smallBtnText}>Tutto</Text>
    </Pressable>
  </View>
);

const SELL_ITEMS: Array<{ key: keyof Inventory; label: string; price: number }> = [
  { key: 'wheat', label: 'Grano', price: 30 },
  { key: 'tomato', label: 'Pomodoro', price: 20 },
  { key: 'carrot', label: 'Carota', price: 40 },
  { key: 'eggplant', label: 'Melanzana', price: 120 },
  { key: 'wood', label: 'Legno', price: 10 },
  { key: 'stone', label: 'Pietra', price: 15 },
  { key: 'fish', label: 'Pesce', price: 25 },
  { key: 'berries', label: 'Bacche', price: 8 },
  { key: 'planks', label: 'Asse di Legno', price: 35 },
  { key: 'bricks', label: 'Mattoni', price: 50 },
  { key: 'iron', label: 'Ferro', price: 60 },
  { key: 'copper', label: 'Rame', price: 80 },
  { key: 'gold', label: 'Oro', price: 200 },
  { key: 'wildMeat', label: 'Carne Selvatica', price: 40 },
];

const MarketModal: React.FC<Props> = ({ visible, inventory, onSell, onBuySeed, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.header}>
          <Text style={styles.title}>🏪 Mercato</Text>
          <Text style={styles.coins}>🪙 {inventory.coins}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#94a3b8" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {/* SELL */}
          <Text style={styles.sectionTitle}>📤 Vendi Risorse</Text>
          <View style={styles.card}>
            {SELL_ITEMS.map(({ key, label, price }) => (
              <SellRow
                key={key}
                emoji={INVENTORY_EMOJI[key] ?? '❓'}
                label={label}
                amount={inventory[key] as number}
                price={price}
                onSell1={() => onSell(key, 1, price)}
                onSellAll={() => onSell(key, inventory[key] as number, price)}
              />
            ))}
          </View>

          {/* BUY SEEDS */}
          <Text style={styles.sectionTitle}>🌱 Compra Semi</Text>
          <View style={styles.card}>
            {Object.values(CROPS).map(crop => {
              const seedKey = `${crop.id}Seeds` as keyof Inventory;
              const canAfford = inventory.coins >= crop.seedCost;
              return (
                <View key={crop.id} style={styles.row}>
                  <Text style={styles.emoji}>{CROP_EMOJI[crop.id]}</Text>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowLabel}>Seme {crop.name}</Text>
                    <Text style={styles.rowStock}>In magazzino: {inventory[seedKey] as number}</Text>
                  </View>
                  <Text style={styles.price}>{crop.seedCost}🪙</Text>
                  <Pressable
                    style={[styles.smallBtn, styles.buyBtn, !canAfford && styles.disabledBtn]}
                    onPress={() => onBuySeed(crop.id, crop.seedCost)}
                    disabled={!canAfford}
                  >
                    <Text style={styles.smallBtnText}>Compra</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0f172a' },
  coins: { fontSize: 15, fontWeight: '700', color: '#ca8a04' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  emoji: { fontSize: 18, width: 24, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  rowStock: { fontSize: 10, color: '#94a3b8' },
  price: { fontSize: 12, fontWeight: '700', color: '#ca8a04', minWidth: 42, textAlign: 'right' },
  smallBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  allBtn: { backgroundColor: '#ef4444' },
  buyBtn: { backgroundColor: colors.success },
  disabledBtn: { opacity: 0.4 },
  smallBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default MarketModal;
