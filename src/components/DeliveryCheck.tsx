import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';
import {api} from '../lib/api';
import {isValidPincode, normalizeServiceability} from '../lib/serviceability';
import type {Serviceability} from '../lib/serviceability';

const KEY = 'offgrid_last_pincode';

// Inline delivery + COD check for the product page. Remembers the last pincode on this device.
export default function DeliveryCheck() {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<Serviceability | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(v => {
        if (v && isValidPincode(v)) setPin(v);
      })
      .catch(() => {});
  }, []);

  const onChange = (value: string) => {
    requestId.current += 1; // drop any in-flight answer for the old pincode
    setBusy(false);
    setPin(value.replace(/\D/g, '').slice(0, 6));
    setResult(null);
    setError('');
  };

  const check = async () => {
    if (busy) return;
    if (!isValidPincode(pin)) {
      setResult(null);
      setError('Enter a valid 6-digit Indian pincode.');
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setResult(null);
    setError('');
    try {
      const next = normalizeServiceability(await api.serviceability(pin));
      if (id !== requestId.current) return;
      setResult(next);
      AsyncStorage.setItem(KEY, pin).catch(() => {});
    } catch (e: any) {
      if (id === requestId.current) setError(e?.message || 'Could not check this pincode. Please try again.');
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  };

  return (
    <View style={s.wrap}>
      <View style={s.titleRow}>
        <Ionicons name="location-outline" size={15} color="#F2F0EA" />
        <Text style={[s.title,{color:'#FFFFFF'}]}>CHECK DELIVERY & COD</Text>
      </View>
      <View style={s.row}>
        <TextInput
          value={pin}
          onChangeText={onChange}
          onSubmitEditing={check}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="Enter pincode"
          placeholderTextColor="#8A877F"
          style={s.input}
          returnKeyType="done"
          accessibilityLabel="Delivery pincode"
          editable={!busy}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check delivery for this pincode"
          onPress={check}
          disabled={busy}
          style={[s.btn, busy && {opacity: 0.6}]}>
          {busy ? <ActivityIndicator color="#0A0A0A" size="small" /> : <Text style={s.btnText}>CHECK</Text>}
        </Pressable>
      </View>

      {!!error && (
        <Text accessibilityLiveRegion="polite" style={s.error}>
          {error}
        </Text>
      )}

      {result && (
        <View accessibilityLiveRegion="polite" style={s.result}>
          <Text style={[s.line, {color: result.serviceable ? '#5FD38A' : '#FF6B62'}]}>
            {result.serviceable ? '✓ Delivery available' : '✕ Not deliverable to this pincode'}
          </Text>
          {result.serviceable && !!result.eta && <Text style={s.sub}>{result.eta}</Text>}
          {result.serviceable && <Text style={s.sub}>{result.cod ? 'Cash on delivery available' : 'Cash on delivery not available — pay online'}</Text>}
          {!!result.message && <Text style={s.sub}>{result.message}</Text>}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {borderWidth: 1, borderColor: '#2A2A2A', padding: 14, marginTop: 14},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10},
  title: {fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.3},
  row: {flexDirection: 'row', borderWidth: 1, borderColor: '#3A3A3A', minHeight: 46},
  input: {flex: 1, paddingHorizontal: 12, fontSize: 14,fontFamily:'DMSans-Regular', letterSpacing: 1, color: '#F2F0EA'},
  btn: {backgroundColor: '#F2F0EA', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', minWidth: 76},
  btnText: {color: '#0A0A0A', fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1},
  error: {color: '#FF6B62', fontSize: 11,fontFamily:'DMSans-Regular', marginTop: 9},
  result: {marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A', gap: 4},
  line: {fontSize: 12, fontFamily:'SpaceGrotesk-Bold'},
  sub: {fontSize: 11,fontFamily:'DMSans-Regular', color: '#B5B2AA', lineHeight: 16},
});
