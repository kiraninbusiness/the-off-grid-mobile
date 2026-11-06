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
            <Text style={[s.title,{color:'#FFFFFF'}]}>FIND MY SIZE</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={22} />
            </Pressable>
          </View>
          <Text style={s.note}>General guidance from height, weight and fit preference. Check the size guide if you are between sizes.</Text>

          <View style={s.row}>
            <View style={{flex: 1}}>
              <Text style={[s.label,{color:'#FFFFFF'}]}>HEIGHT (CM)</Text>
              <TextInput style={[s.input,{color:'#FFFFFF'}]} value={height} onChangeText={v => {setHeight(v.replace(/\D/g, '').slice(0, 3)); setResult(undefined);}} keyboardType="number-pad" placeholder="175" placeholderTextColor="#FFFFFF" />
            </View>
            <View style={{flex: 1}}>
              <Text style={[s.label,{color:'#FFFFFF'}]}>WEIGHT (KG)</Text>
              <TextInput style={[s.input,{color:'#FFFFFF'}]} value={weight} onChangeText={v => {setWeight(v.replace(/\D/g, '').slice(0, 3)); setResult(undefined);}} keyboardType="number-pad" placeholder="70" placeholderTextColor="#FFFFFF" />
            </View>
          </View>

          <Text style={[s.label,{color:'#FFFFFF'}]}>HOW DO YOU LIKE IT TO FIT?</Text>
          <View style={s.fits}>
            {FITS.map(f => (
              <Pressable key={f.key} style={[s.fit, fit === f.key && s.fitOn]} onPress={() => {setFit(f.key); setResult(undefined);}}>
                <Text style={[s.fitText, fit === f.key && {color: '#0A0A0A'}]}>{f.label}</Text>
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
              <Text style={[s.resultSize,{color:'#FFFFFF'}]}>{result}</Text>
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
  sheet: {backgroundColor: '#0A0A0A', padding: 24, paddingBottom: 36},
  head: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {fontSize: 20, fontFamily:'SpaceGrotesk-Bold'},
  note: {fontSize: 11,fontFamily:'DMSans-Regular', color: '#A8A59D', lineHeight: 17, marginVertical: 14},
  row: {flexDirection: 'row', gap: 14},
  label: {fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.2, marginBottom: 6, marginTop: 6},
  input: {borderBottomWidth: 1, borderBottomColor: '#F2F0EA', paddingVertical: 10, fontSize: 16,fontFamily:'DMSans-Regular', marginBottom: 12},
  fits: {flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 20},
  fit: {borderWidth: 1, borderColor: '#3A3A3A', paddingHorizontal: 12, paddingVertical: 10},
  fitOn: {backgroundColor: '#F2F0EA', borderColor: '#F2F0EA'},
  fitText: {fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 0.8},
  btn: {backgroundColor: '#F2F0EA', padding: 16, alignItems: 'center', marginTop: 4},
  btnText: {color: '#0A0A0A', fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1},
  none: {fontSize: 12,fontFamily:'DMSans-Regular', color: '#9A978F', lineHeight: 18, marginTop: 4},
  result: {alignItems: 'center', marginTop: 4},
  resultLabel: {fontSize: 9,fontFamily:'DMSans-Regular', letterSpacing: 1.4, color: '#9A978F'},
  resultSize: {fontSize: 54, fontFamily:'SpaceGrotesk-Bold', letterSpacing: -2, marginVertical: 6},
});
