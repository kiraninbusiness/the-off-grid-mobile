import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/lib/api';
import { getCompareIds, removeFromCompare, MAX_COMPARE } from '../src/lib/compare';
import { useAppTheme } from '../src/theme/ThemeProvider';

const money = (v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const text = (v: any) => (Array.isArray(v) ? v.join(', ') : String(v ?? '').trim());

const ROWS: { label: string; get: (p: any) => string }[] = [
  { label: 'PRICE', get: p => money(p.price) },
  { label: 'CATEGORY', get: p => text(p.category) },
  { label: 'FABRIC', get: p => [p.fabric_gsm ? `${p.fabric_gsm} GSM` : '', p.fabric_composition || p.material || ''].filter(Boolean).join(' · ') },
  { label: 'FIT', get: p => text(p.fit) },
  { label: 'COLOURS', get: p => text(p.colors || p.colour || p.color) },
  { label: 'SIZES', get: p => text(p.sizes) },
  { label: 'ON MODEL', get: p => [p.model_height_cm ? `${p.model_height_cm} cm` : '', p.model_wears_size ? `size ${p.model_wears_size}` : ''].filter(Boolean).join(', ') },
  { label: 'CARE', get: p => text(p.care_instructions) },
];

export default function Compare() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    const ids = await getCompareIds();
    const results = await Promise.allSettled(ids.map(id => api.product(id)));
    setItems(results.flatMap(r => (r.status === 'fulfilled' && r.value ? [r.value] : [])));
    setBusy(false);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: number) => { await removeFromCompare(id); setItems(x => x.filter(p => Number(p.id) !== id)); };
  const rows = ROWS.filter(r => items.some(p => r.get(p)));
  const colW = items.length >= 3 ? 130 : 160;

  return (
    <View style={[s.page, { backgroundColor: colors.background }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={20} color={colors.text} /><Text style={[s.backText, { color: colors.text }]}>BACK</Text>
      </Pressable>
      <Text style={[s.eyebrow, { color: colors.muted }]}>THE OFF GRID / COMPARE</Text>
      <Text style={[s.title, { color: colors.text }]}>COMPARE</Text>
      {busy ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.text} /> : items.length === 0 ? (
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: colors.muted }]}>Pick up to {MAX_COMPARE} products to compare fabric, fit and price side by side. Use COMPARE on any product page.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/shop' as any)} style={[s.cta, { backgroundColor: colors.text }]}><Text style={[s.ctaText, { color: colors.background }]}>BROWSE THE SHOP</Text></Pressable>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={s.cols}>
              {items.map(p => (
                <View key={p.id} style={[s.col, { width: colW }]}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${p.name}`} onPress={() => router.push(`/product/${p.id}` as any)}>
                    <Image source={{ uri: p.image || p.images?.[0] }} style={[s.img, { backgroundColor: colors.surface }]} contentFit="cover" />
                    <Text numberOfLines={2} style={[s.name, { color: colors.text }]}>{p.name}</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.name} from comparison`} onPress={() => remove(Number(p.id))}>
                    <Text style={s.remove}>REMOVE</Text>
                  </Pressable>
                  {rows.map(r => (
                    <View key={r.label} style={[s.cell, { borderTopColor: colors.border }]}>
                      <Text style={[s.cellLabel, { color: colors.muted }]}>{r.label}</Text>
                      <Text style={[s.cellValue, { color: colors.text }]}>{r.get(p) || '—'}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, padding: 22, paddingTop: 58 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10, marginBottom: 18 },
  backText: { fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.5 },
  eyebrow: { fontSize: 9, fontFamily: 'DMSans-Medium', letterSpacing: 2 },
  title: { fontSize: 34, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: -1, marginBottom: 18 },
  cols: { flexDirection: 'row', gap: 14, paddingBottom: 40 },
  col: {},
  img: { width: '100%', height: 170 },
  name: { fontSize: 12, fontFamily: 'SpaceGrotesk-Bold', marginTop: 8, minHeight: 32 },
  remove: { fontSize: 9, fontFamily: 'DMSans-Bold', color: '#FF6B62', letterSpacing: 1, marginVertical: 8 },
  cell: { borderTopWidth: 1, paddingVertical: 10 },
  cellLabel: { fontSize: 8, fontFamily: 'DMSans-Bold', letterSpacing: 1.5, marginBottom: 4 },
  cellValue: { fontSize: 12, fontFamily: 'DMSans-Regular', lineHeight: 17 },
  empty: { marginTop: 30 },
  emptyText: { fontSize: 13, fontFamily: 'DMSans-Regular', lineHeight: 20 },
  cta: { padding: 14, alignItems: 'center', marginTop: 22 },
  ctaText: { fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.2 },
});
