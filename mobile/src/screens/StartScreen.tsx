import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  hasSave: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onConfig: () => void;
}

const StartScreen: React.FC<Props> = ({ hasSave, onNewGame, onContinue, onConfig }) => (
  <LinearGradient colors={['#052e16', '#064e3b', '#0a1f10']} style={styles.gradient}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>🌾</Text>
          <Text style={styles.logoTitle}>Tiny Farm</Text>
          <Text style={styles.logoSub}>Costruisci la tua fattoria medievale</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {hasSave && (
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onContinue}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.btnText}>Continua Partita</Text>
            </Pressable>
          )}

          <Pressable style={[styles.btn, hasSave ? styles.btnSecondary : styles.btnPrimary]} onPress={onNewGame}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.btnText}>{hasSave ? 'Nuova Partita' : 'Inizia a Giocare'}</Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.btnConfig]} onPress={onConfig}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.btnText}>Configura Gioco</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>v1.0 — React Native</Text>
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
    padding: 24,
    gap: 48,
  },
  logoArea: {
    alignItems: 'center',
    gap: 8,
  },
  logoEmoji: { fontSize: 72 },
  logoTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#f0fdf4',
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 14,
    color: '#86efac',
    fontWeight: '500',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnPrimary: { backgroundColor: '#16a34a' },
  btnSecondary: { backgroundColor: '#374151' },
  btnConfig: { backgroundColor: '#7c3aed' },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#4b5563',
    fontSize: 11,
  },
});

export default StartScreen;
