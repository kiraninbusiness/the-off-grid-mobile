import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FREE_SHIPPING_THRESHOLD} from '../lib/config';

// Short trust strip for the product page. Only states policies that exist today:
// free shipping threshold (config), 10-day returns and exchanges (returns policy), COD at checkout.
const ITEMS: {icon: keyof typeof Ionicons.glyphMap; title: string; sub: string}[] = [
  {icon: 'car-outline', title: 'FREE SHIPPING', sub: `Above ₹${FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}`},
  {icon: 'refresh-outline', title: '10-DAY RETURNS', sub: 'Returns & exchanges'},
  {icon: 'cash-outline', title: 'PAY ON DELIVERY', sub: 'COD where available'},
];

export default function Assurances() {
  return (
    <View style={s.row} accessible accessibilityLabel={`Free shipping above ${FREE_SHIPPING_THRESHOLD} rupees. 10-day returns and exchanges. Cash on delivery where available.`}>
      {ITEMS.map(i => (
        <View key={i.title} style={s.item}>
          <Ionicons name={i.icon} size={20} color="#111" />
          <Text style={s.title}>{i.title}</Text>
          <Text style={s.sub}>{i.sub}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e5e5e5', marginTop: 22},
  item: {flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 5},
  title: {fontSize: 8, fontWeight: '900', letterSpacing: 1, textAlign: 'center'},
  sub: {fontSize: 9, color: '#777', textAlign: 'center'},
});
