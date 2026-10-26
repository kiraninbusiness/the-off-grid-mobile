import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {api, listFrom} from '../lib/api';
import {computeBundles} from '../lib/bundles';
import type {Combo} from '../lib/bundles';

type Item = {product_id: number; price: number; quantity: number};
const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Bag banner: shows the bundle saving you have, or how many more pieces unlock one.
export default function BundleOffer({items, onSaving}: {items: Item[]; onSaving?: (saving: number) => void}) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api.combos(), api.products()]).then(([c, p]) => {
      if (!alive) return;
      if (c.status === 'fulfilled') setCombos(listFrom<Combo>(c.value, ['items', 'combos', 'data']));
      if (p.status === 'fulfilled') {
        const map: Record<string, string> = {};
        for (const x of listFrom<any>(p.value, ['items', 'products', 'data'])) map[String(x.id)] = String(x.category ?? '');
        setCategories(map);
      }
    });
    return () => { alive = false; };
  }, []);

  const result = useMemo(
    () => computeBundles(items.map(i => ({category: categories[String(i.product_id)], price: Number(i.price) || 0, quantity: Number(i.quantity) || 0})), combos),
    [items, categories, combos],
  );

  useEffect(() => { onSaving?.(result.saving); }, [result.saving, onSaving]);

  if (!result.deal && !result.next) return null;
  return (
    <View style={s.wrap} accessibilityLiveRegion="polite">
      {result.deal ? <Text style={s.win}>✓ {result.deal.title} applied — you save {money(result.saving)}</Text> : null}
      {result.next ? (
        <Text style={s.nudge}>
          Add {result.next.needed} more {result.next.deal.category.toLowerCase()} to get {result.next.deal.quantity} for {money(result.next.deal.bundle_price)}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {borderWidth: 1, borderColor: '#111', padding: 12, marginBottom: 12, gap: 4},
  win: {fontSize: 11, fontWeight: '900', letterSpacing: 0.6, color: '#176b37'},
  nudge: {fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color: '#111'},
});
