import React from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import {savedKey} from '../lib/savedForLater';
import type {SavedItem} from '../lib/savedForLater';

const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function SavedForLater({items, onMoveToBag, onRemove, busyKey}: {items: SavedItem[]; onMoveToBag: (x: SavedItem) => void; onRemove: (key: string) => void; busyKey?: string | null}) {
  if (!items.length) return null;
  return (
    <View style={s.wrap}>
      <Text style={s.title}>SAVED FOR LATER ({items.length})</Text>
      {items.map(x => {
        const key = savedKey(x);
        const busy = busyKey === key;
        return (
          <View key={key} style={s.row}>
            {x.image ? <Image source={{uri: x.image}} style={s.img} resizeMode="cover" /> : <View style={[s.img, {backgroundColor: '#eee'}]} />}
            <View style={{flex: 1}}>
              <Text style={s.name} numberOfLines={2}>{x.name || 'Product'}</Text>
              <Text style={s.variant}>{[x.selected_size ? `Size ${x.selected_size}` : '', x.selected_color || ''].filter(Boolean).join('  ·  ') || ' '}</Text>
              <Text style={s.price}>{money(x.price)}</Text>
              <View style={s.actions}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Move ${x.name || 'item'} to bag`} disabled={busy} onPress={() => onMoveToBag(x)} style={[s.move, busy && {opacity: 0.5}]}>
                  <Text style={s.moveText}>{busy ? 'MOVING…' : 'MOVE TO BAG'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${x.name || 'item'} from saved items`} disabled={busy} onPress={() => onRemove(key)} hitSlop={8}>
                  <Text style={s.remove}>REMOVE</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {marginTop: 26, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e1e1dc'},
  title: {fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 14},
  row: {flexDirection: 'row', gap: 12, marginBottom: 16},
  img: {width: 72, height: 92},
  name: {fontSize: 12, fontWeight: '800'},
  variant: {fontSize: 10, color: '#777', marginTop: 3},
  price: {fontSize: 12, fontWeight: '800', marginTop: 4},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8},
  move: {borderWidth: 1, borderColor: '#111', paddingHorizontal: 12, paddingVertical: 8},
  moveText: {fontSize: 9, fontWeight: '900', letterSpacing: 1},
  remove: {fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#777', textDecorationLine: 'underline'},
});
