import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_GAME_CONFIG, mergeWithDefaults } from '@core/constants/config.defaults';
import type { GameConfig } from '@core/types/config.types';
import { colors } from '../styles/colors';

interface Props {
  visible: boolean;
  config: GameConfig;
  onSave: (config: GameConfig) => void;
  onClose: () => void;
}

type TabId = 'raccolta' | 'colture' | 'tempi' | 'partenza';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'raccolta', label: 'Raccolta' },
  { id: 'colture', label: 'Colture' },
  { id: 'tempi', label: 'Tempi' },
  { id: 'partenza', label: 'Partenza' },
];

interface NumFieldProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  onChange: (v: number) => void;
}

const NumField: React.FC<NumFieldProps> = ({ label, value, step = 1, min = 0, onChange }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldControl}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <TextInput
        style={styles.fieldInput}
        keyboardType="numeric"
        value={String(value)}
        onChangeText={t => { const n = Number(t); if (!isNaN(n)) onChange(Math.max(min, n)); }}
      />
      <Pressable style={styles.stepBtn} onPress={() => onChange(value + step)}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  </View>
);

const ConfigScreen: React.FC<Props> = ({ visible, config, onSave, onClose }) => {
  const [draft, setDraft] = useState<GameConfig>(mergeWithDefaults(config));
  const [tab, setTab] = useState<TabId>('raccolta');

  const set = (patch: Partial<GameConfig>) => setDraft(prev => ({ ...prev, ...patch }));
  const setAt = (key: string, value: number) =>
    setDraft(prev => ({ ...prev, actionTimes: { ...prev.actionTimes, [key]: value } }));
  const setCrop = (crop: keyof GameConfig['crops'], key: string, value: number) =>
    setDraft(prev => ({ ...prev, crops: { ...prev.crops, [crop]: { ...prev.crops[crop], [key]: value } } }));

  const handleSave = () => { onSave(draft); onClose(); };
  const handleReset = () => setDraft(mergeWithDefaults(DEFAULT_GAME_CONFIG));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#64748b" />
          </Pressable>
          <Text style={styles.title}>⚙️ Configura Gioco</Text>
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <Pressable
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 32 }}>
          {tab === 'partenza' && (
            <>
              <Text style={styles.groupTitle}>Risorse Iniziali</Text>
              <NumField label="Monete iniziali" value={draft.initialCoins} step={100} onChange={v => set({ initialCoins: v })} />
              <NumField label="Semi di grano iniziali" value={draft.initialWheatSeeds} onChange={v => set({ initialWheatSeeds: v })} />
            </>
          )}

          {tab === 'raccolta' && (
            <>
              <Text style={styles.groupTitle}>Legno</Text>
              <NumField label="Legno min (taglio albero)" value={draft.choppingWoodMin} onChange={v => set({ choppingWoodMin: v })} />
              <NumField label="Legno max (taglio albero)" value={draft.choppingWoodMax} onChange={v => set({ choppingWoodMax: v })} />
              <NumField label="Legno per tick foresta" value={draft.forestWoodPerTick} onChange={v => set({ forestWoodPerTick: v })} />
              <Text style={styles.groupTitle}>Cespuglio</Text>
              <NumField label="Bacche per raccolta" value={draft.bushBerriesAmount} onChange={v => set({ bushBerriesAmount: v })} />
              <NumField label="Semi per raccolta" value={draft.bushSeedsAmount} onChange={v => set({ bushSeedsAmount: v })} />
              <Text style={styles.groupTitle}>Pesca</Text>
              <NumField label="Pesci per tick" value={draft.fishPerTick} onChange={v => set({ fishPerTick: v })} />
            </>
          )}

          {tab === 'colture' && (
            <>
              {(['wheat', 'tomato', 'carrot', 'eggplant'] as const).map(crop => {
                const names = { wheat: '🌾 Grano', tomato: '🍅 Pomodoro', carrot: '🥕 Carota', eggplant: '🍆 Melanzana' };
                const c = draft.crops[crop];
                return (
                  <React.Fragment key={crop}>
                    <Text style={styles.groupTitle}>{names[crop]}</Text>
                    <NumField label="Tempo crescita (ms)" value={c.growthTime} step={1000} onChange={v => setCrop(crop, 'growthTime', v)} />
                    <NumField label="Resa minima" value={c.minYield} onChange={v => setCrop(crop, 'minYield', v)} />
                    <NumField label="Resa massima" value={c.maxYield} onChange={v => setCrop(crop, 'maxYield', v)} />
                    <NumField label="Prezzo vendita" value={c.sellPrice} step={5} onChange={v => setCrop(crop, 'sellPrice', v)} />
                    <NumField label="Costo seme" value={c.seedCost} step={5} onChange={v => setCrop(crop, 'seedCost', v)} />
                  </React.Fragment>
                );
              })}
            </>
          )}

          {tab === 'tempi' && (
            <>
              <Text style={styles.groupTitle}>Azioni (ms)</Text>
              {([
                ['plowing', 'Aratura'],
                ['planting', 'Semina'],
                ['harvesting', 'Raccolta'],
                ['chopping', 'Taglio Albero'],
                ['mining', 'Estrazione'],
                ['building_house', 'Costruzione Casa'],
                ['hunting', 'Caccia'],
                ['hunting_wolf', 'Caccia al Lupo'],
                ['harvesting_bush', 'Raccolta Cespuglio'],
                ['planting_bush', 'Pianta Cespuglio'],
                ['planting_tree', 'Pianta Albero'],
                ['crafting', 'Artigianato'],
                ['planting_forest', 'Pianta Bosco'],
                ['spawn_rock', 'Cerca Filone'],
              ] as [string, string][]).map(([key, label]) => (
                <NumField
                  key={key}
                  label={label}
                  value={(draft.actionTimes as Record<string, number>)[key] ?? 5000}
                  step={500}
                  min={500}
                  onChange={v => setAt(key, v)}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Salva Configurazione</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#0f172a' },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  resetText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: colors.primary },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  fieldLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  fieldControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, color: '#374151', lineHeight: 22 },
  fieldInput: {
    width: 64,
    height: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 13,
    color: '#0f172a',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ConfigScreen;
