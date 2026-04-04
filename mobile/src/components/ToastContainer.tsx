import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import type { Toast } from '@core/types/game.types';
import { colors } from '../styles/colors';

interface ToastItemProps { toast: Toast }

const ToastItem: React.FC<ToastItemProps> = ({ toast }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const bg = toast.type === 'danger' ? '#fee2e2' : '#dcfce7';
  const border = toast.type === 'danger' ? colors.danger : colors.success;
  const textColor = toast.type === 'danger' ? '#991b1b' : '#166534';
  const icon = toast.type === 'danger' ? '⚠️' : '✅';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, borderLeftColor: border, opacity }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.text, { color: textColor }]}>{toast.title}</Text>
    </Animated.View>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => (
  <View style={styles.container} pointerEvents="none">
    {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 12,
    right: 12,
    gap: 6,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 13, fontWeight: '600' },
});

export default ToastContainer;
