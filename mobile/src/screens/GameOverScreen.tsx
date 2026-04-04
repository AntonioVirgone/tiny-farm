import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  dayCount: number;
  coins: number;
  onRestart: () => void;
}

const GameOverScreen: React.FC<Props> = ({ dayCount, coins, onRestart }) => (
  <LinearGradient colors={['#1a0000', '#3b0000', '#0a0a0a']} style={styles.gradient}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.skull}>💀</Text>
        <Text style={styles.title}>Fine del Viaggio</Text>
        <Text style={styles.subtitle}>La tua fattoria è andata in rovina</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="sunny-outline" size={28} color="#fbbf24" />
            <Text style={styles.statValue}>{dayCount}</Text>
            <Text style={styles.statLabel}>Giorni</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statEmoji}>🪙</Text>
            <Text style={styles.statValue}>{coins}</Text>
            <Text style={styles.statLabel}>Monete</Text>
          </View>
        </View>

        <Pressable style={styles.btn} onPress={onRestart}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.btnText}>Ricomincia</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  skull: { fontSize: 80 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fca5a5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
    marginVertical: 20,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: { fontSize: 28 },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GameOverScreen;
