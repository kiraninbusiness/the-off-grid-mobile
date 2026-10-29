import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {api, listFrom} from '../lib/api';

type Offer = {code: string; description: string; min_order: number};

// "Available offers" the store chose to show. Tapping one fills the coupon box when onPick is given.
export default function OfferList({onPick, subtotal = 0}: {onPick?: (code: string) => void; subtotal?: number}) {
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => {
    let alive = true;
    api.publicOffers().then(v => alive && setOffers(listFrom<Offer>(v).filter(o => o && typeof o.code === 'string'))).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!offers.length) return null;
  return (
    <View style={s.wrap}>
      <Text style={s.title}>AVAILABLE OFFERS</Text>
      {offers.map(o => {
        const locked = o.min_order > subtotal && subtotal > 0;
        const body = (
          <>
            <View style={s.code}><Text style={s.codeText}>{o.code}</Text></View>
            <View style={{flex: 1}}>
              <Text style={s.desc}>{o.description}</Text>
              {locked ? <Text style={s.hint}>Add ₹{(o.min_order - subtotal).toLocaleString('en-IN')} more to unlock</Text> : null}
            </View>
            {onPick ? <Text style={s.use}>USE</Text> : null}
          </>
        );
        return onPick ? (
          <Pressable key={o.code} accessibilityRole="button" accessibilityLabel={`Use code ${o.code}: ${o.description}`} onPress={() => onPick(o.code)} style={s.row}>{body}</Pressable>
        ) : (
          <View key={o.code} style={s.row}>{body}</View>
        );
      })}
      {!onPick ? <Text style={s.foot}>Enter the code at checkout.</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {borderWidth: 1, borderColor: '#e1e1dc', padding: 14, marginBottom: 14, backgroundColor: '#fff'},
  title: {fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8},
  code: {borderWidth: 1, borderStyle: 'dashed', borderColor: '#111', paddingHorizontal: 10, paddingVertical: 6},
  codeText: {fontSize: 11, fontWeight: '900', letterSpacing: 1},
  desc: {fontSize: 12, color: '#111', fontWeight: '700'},
  hint: {fontSize: 10, color: '#8a5a00', marginTop: 2},
  use: {fontSize: 10, fontWeight: '900', letterSpacing: 1, textDecorationLine: 'underline'},
  foot: {fontSize: 10, color: '#777', marginTop: 4},
});
