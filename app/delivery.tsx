import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../src/lib/api';

type Result = { serviceable: boolean; message?: string; estimated_days?: string | number; cod?: boolean; free_shipping_threshold?: number };
const formatEta = (value: any): string => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const text = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const days = Number(text);
    return days === 1 ? 'Estimated 1 day' : `Estimated ${text} days`;
  }
  return text;
};
const parseFlag = (value: any): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'available', 'serviceable'].includes(normalized)) return true;
    if (['false', 'no', '0', 'unavailable', 'not serviceable', 'not_serviceable'].includes(normalized)) return false;
  }
  return null;
};
export default function Delivery() {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const check = async () => {
    const normalized = pin.replace(/\D/g, '').slice(0, 6);
    setPin(normalized);
    if (!/^[1-9][0-9]{5}$/.test(normalized)) {
      requestId.current += 1;
      setBusy(false);
      setResult(null);
      setError('Enter a valid 6-digit Indian pincode.');
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setResult(null);
    setError('');
    try {
      const response: any = await api.serviceability(normalized);
      if (id !== requestId.current) return;
      const data: any = response?.data ?? response?.result ?? response;
      const serviceability = parseFlag(data?.serviceable ?? data?.is_serviceable ?? data?.available ?? data?.deliverable);
      if (serviceability === null) {
        throw new Error(data?.message || data?.reason || 'The delivery service could not confirm availability for this pincode. Please try again later.');
      }
      const codFlag = parseFlag(data?.cod ?? data?.cod_available ?? data?.cash_on_delivery);
      const threshold = Number(data?.free_shipping_threshold ?? data?.freeShippingThreshold ?? 1499);
      setResult({
        serviceable: serviceability,
        message: data?.message || data?.reason || (serviceability ? '' : 'Delivery is not available for this pincode right now.'),
        estimated_days: data?.estimated_days ?? data?.estimatedDays ?? data?.eta,
        cod: codFlag === true,
        free_shipping_threshold: Number.isFinite(threshold) && threshold >= 0 ? threshold : 1499,
      });
    } catch (e: any) {
      if (id === requestId.current) setError(e?.message || 'Could not check this pincode. Please try again.');
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  };

  const onPinChange = (value: string) => {
    requestId.current += 1;
    setPin(value.replace(/\D/g, '').slice(0, 6));
    setResult(null);
    setError('');
    setBusy(false);
  };

  return (
    <View style={s.page}>
      <Text style={s.eyebrow}>THE OFF GRID / DELIVERY</Text>
      <Text style={s.title}>CHECK DELIVERY</Text>
      <Text style={s.copy}>Check delivery availability, estimated arrival and cash-on-delivery options for your area.</Text>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={s.label}>INDIAN PINCODE</Text>{!!pin&&<Pressable accessibilityRole="button" accessibilityLabel="Clear pincode" hitSlop={8} onPress={()=>onPinChange('')}><Text style={s.retryText}>CLEAR</Text></Pressable>}</View>
      <TextInput
        value={pin}
        onChangeText={onPinChange}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="6-digit pincode"
        placeholderTextColor="#999"
        style={s.input}
        accessibilityLabel="Six-digit Indian pincode"
        returnKeyType="done"
        onSubmitEditing={check}
      />
      <Text style={s.helper} accessibilityLiveRegion="polite">{pin.length}/6 digits</Text>
      <Pressable style={[s.btn, busy && s.btnDisabled]} onPress={check} disabled={busy} accessibilityRole="button" accessibilityLabel={busy ? "Checking delivery availability" : "Check delivery for entered pincode"} accessibilityState={{ disabled: busy }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>CHECK PINCODE</Text>}
      </Pressable>
      {!!error && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorTitle}>UNABLE TO CHECK</Text><Text style={s.errorText}>{error}</Text>{!busy && pin.length === 6 && <Pressable onPress={check} style={s.retry}><Text style={s.retryText}>TRY AGAIN</Text></Pressable>}</View>}
      {result && !error && (
        <View style={s.result} accessibilityLiveRegion="polite" accessible accessibilityLabel={result.serviceable?'Delivery available for this pincode':'Delivery unavailable for this pincode'}>
          <Text style={s.status}>{result.serviceable ? 'DELIVERY AVAILABLE' : 'NOT SERVICEABLE'}</Text>
          <Text style={s.main}>{result.serviceable ? (formatEta(result.estimated_days) || 'We deliver to your area') : (result.message || 'Delivery is not available for this pincode right now.')}</Text>
          {result.serviceable && <>
            <View style={s.divider} />
            <Text style={s.line}>CASH ON DELIVERY</Text>
            <Text style={s.value}>{result.cod ? 'Available' : 'Not available'}</Text>
            <Text style={s.line}>FREE SHIPPING</Text>
            <Text style={s.value}>Orders above ₹{(Number.isFinite(result.free_shipping_threshold) && result.free_shipping_threshold! >= 0 ? result.free_shipping_threshold : 1499).toLocaleString('en-IN')}</Text>
          </>}
        </View>
      )}
      <Text style={s.note}>Final courier availability and delivery estimates are confirmed at checkout. Please check your pincode again if your address changes.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff', padding: 22, paddingTop: 70 },
  eyebrow: { fontSize: 9, color: '#777', letterSpacing: 1.5 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1.8, marginTop: 5, color: '#111' },
  copy: { fontSize: 12, color: '#666', lineHeight: 19, marginTop: 9 },
  label: { fontSize: 9, color: '#555', fontWeight: '900', letterSpacing: 1.3, marginTop: 28 },
  input: { borderBottomWidth: 1, borderBottomColor: '#111', fontSize: 22, color: '#111', paddingVertical: 13, letterSpacing: 3 },
  helper: { fontSize: 10, color: '#888', textAlign: 'right', marginTop: 6 },
  btn: { backgroundColor: '#111', minHeight: 52, padding: 17, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  errorBox: { borderWidth: 1, borderColor: '#e2b8b8', backgroundColor: '#fff8f8', padding: 16, marginTop: 22 },
  errorTitle: { color: '#9b2424', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  errorText: { color: '#6d3333', fontSize: 12, lineHeight: 18, marginTop: 7 },
  retry: { alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 12, marginTop: 4 },
  retryText: { fontSize: 10, color: '#111', fontWeight: '900', letterSpacing: 1 },
  result: { borderWidth: 1, borderColor: '#ddd', padding: 20, marginTop: 25 },
  status: { fontSize: 9, fontWeight: '900', letterSpacing: 1.4, color: '#111' },
  main: { fontSize: 21, fontWeight: '900', lineHeight: 28, marginTop: 10, color: '#111' },
  divider: { height: 1, backgroundColor: '#eee', marginTop: 17, marginBottom: 4 },
  line: { fontSize: 9, color: '#777', fontWeight: '800', letterSpacing: 1, marginTop: 12 },
  value: { fontSize: 13, color: '#222', fontWeight: '700', marginTop: 4 },
  note: { fontSize: 10, color: '#888', lineHeight: 16, marginTop: 22 },
});