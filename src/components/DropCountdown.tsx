import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useRouter} from 'expo-router';
import {countdownParts, nextDropAt} from '../lib/drop';

const pad = (n: number) => String(n).padStart(2, '0');

function Cell({value, label}: {value: number; label: string}) {
  return (
    <View style={s.cell}>
      <Text style={[s.num,{color:'#FFFFFF'}]}>{pad(value)}</Text>
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
        <Text style={[s.kicker,{color:'#FFFFFF'}]}>NEXT DROP IN</Text>
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
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 22,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  kicker: {color: '#0A0A0A', fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.6},
  sub: {color: '#8A877F', fontSize: 9,fontFamily:'DMSans-Regular', marginTop: 4, letterSpacing: 0.4},
  timer: {flexDirection: 'row', alignItems: 'center', gap: 4},
  cell: {alignItems: 'center', minWidth: 34},
  num: {color: '#0A0A0A', fontSize: 20, fontFamily:'SpaceGrotesk-Bold', letterSpacing: -0.5},
  unit: {color: '#8F8C85', fontSize: 7, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1, marginTop: 2},
  colon: {color: '#B5B2AA', fontSize: 16, fontFamily:'SpaceGrotesk-Bold', marginBottom: 10},
});
