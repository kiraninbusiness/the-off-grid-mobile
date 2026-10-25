import React, {useState} from 'react';
import {Modal, View, Text, TextInput, Pressable, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {recommendSize} from '../lib/sizeFinder';
import type {FitPref} from '../lib/sizeFinder';

const FITS: {key: FitPref; label: string}[] = [
  {key: 'slim', label: 'SLIM'},
  {key: 'regular', label: 'REGULAR'},
  {key: 'oversized', label: 'OVERSIZED'},
];

export default function SizeFinder({
  visible,
  onClose,
  sizes,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  sizes: string[];
  onPick: (size: string) => void;
}) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fit, setFit] = useState<FitPref>('regular');
  const [result, setResult] = useState<string | null | undefined>(undefined);

  const h = Number(height);
  const w = Number(weight);
  const valid = h >= 120 && h <= 220 && w >= 30 && w <= 200;

  const find = () => setResult(recommendSize({heightCm: h, weightKg: w, fit}, sizes));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.head}>
            <Text style={s.title}>FIND MY SIZE</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} />
            </Pressable>
          </View>
          <Text style={s.note}>General guidance from height, weight and fit preference. Check the size guide if you are between sizes.</Text>

          <View style={s.row}>
            <View style={{flex: 1}}>
              <Text style={s.label}>HEIGHT (CM)</Text>
              <TextInput style={s.input} value={height} onChangeText={v => {setHeight(v.replace(/\D/g, '').slice(0, 3)); setResult(undefined);}} keyboardType="number-pad" placeholder="175" placeholderTextColor="#aaa" />
            </View>
            <View style={{flex: 1}}>
              <Text style={s.label}>WEIGHT (KG)</Text>
              <TextInput style={s.input} value={weight} onChangeText={v => {setWeight(v.replace(/\D/g, '').slice(0, 3)); setResult(undefined);}} keyboardType="number-pad" placeholder="70" placeholderTextColor="#aaa" />
            </View>
          </View>

          <Text style={s.label}>HOW DO YOU LIKE IT TO FIT?</Text>
          <View style={s.fits}>
            {FITS.map(f => (
              <Pressable key={f.key} style={[s.fit, fit === f.key && s.fitOn]} onPress={() => {setFit(f.key); setResult(undefined);}}>
                <Text style={[s.fitText, fit === f.key && {color: '#fff'}]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>

          {result === undefined && (
            <Pressable style={[s.btn, !valid && {opacity: 0.45}]} disabled={!valid} onPress={find}>
              <Text style={s.btnText}>RECOMMEND A SIZE</Text>
            </Pressable>
          )}

          {result === null && <Text style={s.none}>This product uses sizes the finder can not rank (for example waist sizes or one size). Please use the size guide.</Text>}

          {typeof result === 'string' && (
            <View style={s.result}>
              <Text style={s.resultLabel}>WE SUGGEST</Text>
              <Text style={s.resultSize}>{result}</Text>
              <Pressable style={s.btn} onPress={() => {onPick(result); onClose();}}>
                <Text style={s.btnText}>SELECT SIZE {result}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,.35)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', padding: 24, paddingBottom: 36},
  head: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {fontSize: 20, fontWeight: '900'},
  note: {fontSize: 11, color: '#666', lineHeight: 17, marginVertical: 14},
  row: {flexDirection: 'row', gap: 14},
  label: {fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6, marginTop: 6},
  input: {borderBottomWidth: 1, borderBottomColor: '#111', paddingVertical: 10, fontSize: 16, marginBottom: 12},
  fits: {flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 20},
  fit: {borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 12, paddingVertical: 10},
  fitOn: {backgroundColor: '#111', borderColor: '#111'},
  fitText: {fontSize: 9, fontWeight: '800', letterSpacing: 0.8},
  btn: {backgroundColor: '#111', padding: 16, alignItems: 'center', marginTop: 4},
  btnText: {color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1},
  none: {fontSize: 12, color: '#777', lineHeight: 18, marginTop: 4},
  result: {alignItems: 'center', marginTop: 4},
  resultLabel: {fontSize: 9, letterSpacing: 1.4, color: '#777'},
  resultSize: {fontSize: 54, fontWeight: '900', letterSpacing: -2, marginVertical: 6},
});
