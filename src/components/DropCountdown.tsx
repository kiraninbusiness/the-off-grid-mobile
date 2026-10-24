import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useRouter} from 'expo-router';
import {countdownParts, nextDropAt} from '../lib/drop';

const pad = (n: number) => String(n).padStart(2, '0');

function Cell({value, label}: {value: number; label: string}) {
  return (
    <View style={s.cell}>
      <Text style={s.num}>{pad(value)}</Text>
      <Text style={s.unit}>{label}</Text>
    </View>
  );
}

export default function DropCountdown() {
  const router = useRouter();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = countdownParts(nextDropAt(now).getTime() - now);

  return (
    <Pressable style={s.wrap} onPress={() => router.push('/deals' as any)}>
      <View style={{flex: 1}}>
        <Text style={s.kicker}>NEXT DROP IN</Text>
        <Text style={s.sub}>Tap to see what is coming</Text>
      </View>
      <View style={s.timer}>
        <Cell value={t.d} label="D" />
        <Text style={s.colon}>:</Text>
        <Cell value={t.h} label="H" />
        <Text style={s.colon}>:</Text>
        <Cell value={t.m} label="M" />
        <Text style={s.colon}>:</Text>
        <Cell value={t.s} label="S" />
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: '#111',
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kicker: {color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.6},
  sub: {color: '#999', fontSize: 9, marginTop: 4, letterSpacing: 0.4},
  timer: {flexDirection: 'row', alignItems: 'center', gap: 4},
  cell: {alignItems: 'center', minWidth: 34},
  num: {color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5},
  unit: {color: '#888', fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 2},
  colon: {color: '#555', fontSize: 16, fontWeight: '900', marginBottom: 10},
});
