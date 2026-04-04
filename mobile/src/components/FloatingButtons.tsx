import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

interface Props {
  onInventory: () => void;
  onMarket: () => void;
  onQuests: () => void;
  onElderChat: () => void;
}

const FloatingButtons: React.FC<Props> = ({ onInventory, onMarket, onQuests, onElderChat }) => (
  <View style={styles.container}>
    <Pressable style={styles.btn} onPress={onInventory}>
      <Ionicons name="briefcase-outline" size={22} color="#e2e8f0" />
      <Text style={styles.label}>Zaino</Text>
    </Pressable>
    <Pressable style={styles.btn} onPress={onMarket}>
      <Ionicons name="storefront-outline" size={22} color="#e2e8f0" />
      <Text style={styles.label}>Mercato</Text>
    </Pressable>
    <Pressable style={styles.btn} onPress={onQuests}>
      <Ionicons name="trophy-outline" size={22} color="#e2e8f0" />
      <Text style={styles.label}>Missioni</Text>
    </Pressable>
    <Pressable style={[styles.btn, styles.btnEldr]} onPress={onElderChat}>
      <Text style={styles.elderEmoji}>🧙</Text>
      <Text style={styles.label}>Anziano</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 6,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  btnEldr: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  elderEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
});

export default FloatingButtons;
