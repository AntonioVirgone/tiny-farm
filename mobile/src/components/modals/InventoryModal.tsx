import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Inventory } from '@core/types/game.types';
import { INVENTORY_EMOJI } from '../../icons/iconMap';

interface Props {
  visible: boolean;
  inventory: Inventory;
  onClose: () => void;
}

interface ResourceRowProps {
  emoji: string;
  label: string;
  value: number;
}

const ResourceRow: React.FC<ResourceRowProps> = ({ emoji, label, value }) => (
  <View style={styles.row}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const SECTIONS = [
  {
    title: 'Risorse Base',
    items: [
      { key: 'coins', label: 'Monete' },
      { key: 'wood', label: 'Legno' },
      { key: 'stone', label: 'Pietra' },
      { key: 'fish', label: 'Pesce' },
      { key: 'berries', label: 'Bacche' },
    ],
  },
  {
    title: 'Coltivazioni',
    items: [
      { key: 'wheat', label: 'Grano' },
      { key: 'wheatSeeds', label: 'Semi Grano' },
      { key: 'tomato', label: 'Pomodoro' },
      { key: 'tomatoSeeds', label: 'Semi Pomodoro' },
      { key: 'carrot', label: 'Carota' },
      { key: 'carrotSeeds', label: 'Semi Carota' },
      { key: 'eggplant', label: 'Melanzana' },
      { key: 'eggplantSeeds', label: 'Semi Melanzana' },
    ],
  },
  {
    title: 'Materiali Lavorati',
    items: [
      { key: 'planks', label: 'Assi di Legno' },
      { key: 'bricks', label: 'Mattoni' },
    ],
  },
  {
    title: 'Minerali & Caccia',
    items: [
      { key: 'iron', label: 'Ferro' },
      { key: 'copper', label: 'Rame' },
      { key: 'gold', label: 'Oro' },
      { key: 'wildMeat', label: 'Carne Selvatica' },
    ],
  },
];

const InventoryModal: React.FC<Props> = ({ visible, inventory, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.header}>
          <Text style={styles.title}>🎒 Zaino</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#94a3b8" />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}>
          {SECTIONS.map(section => (
            <View key={section.title}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.card}>
                {section.items.map(({ key, label }) => (
                  <ResourceRow
                    key={key}
                    emoji={INVENTORY_EMOJI[key] ?? '❓'}
                    label={label}
                    value={inventory[key as keyof Inventory] as number}
                  />
                ))}
              </View>
            </View>
          ))}
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  emoji: { fontSize: 18, width: 24, textAlign: 'center' },
  label: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '700', color: '#0f172a', minWidth: 40, textAlign: 'right' },
});

export default InventoryModal;
