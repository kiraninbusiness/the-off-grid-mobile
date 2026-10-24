import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {FREE_SHIPPING_THRESHOLD} from '../lib/config';

export default function FreeShippingBar({subtotal}: {subtotal: number}) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const unlocked = remaining === 0;

  return (
    <View style={s.wrap}>
      <Text style={s.text}>
        {unlocked
          ? 'FREE SHIPPING UNLOCKED'
          : `ADD ₹${remaining.toLocaleString('en-IN')} MORE FOR FREE SHIPPING`}
      </Text>
      <View style={s.track}>
        <View style={[s.fill, {width: `${pct}%`}]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {borderWidth: 1, borderColor: '#ddd', padding: 14, marginBottom: 6},
  text: {fontSize: 9, fontWeight: '900', letterSpacing: 1.1},
  track: {height: 4, backgroundColor: '#eee', marginTop: 10},
  fill: {height: 4, backgroundColor: '#111'},
});
