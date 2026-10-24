import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../src/lib/api';
import { useStore } from '../src/store/store';

const topics = [['order-tracking', 'Order tracking'], ['payment', 'Payment'], ['return', 'Return'], ['exchange', 'Exchange'], ['refund', 'Refund'], ['sizing', 'Sizing'], ['general', 'General']];
export default function Support() {
  const { user } = useStore();
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const send = async () => {
    const clean = message.trim();
    if (busy) return;
    if (clean.length < 10) { setError('Please enter at least 10 characters so our team can understand your request.'); setSuccess(false); return; }
    if (clean.length > 1500) { setError('Please keep your message under 1,500 characters.'); setSuccess(false); return; }
    setBusy(true); setError(''); setSuccess(false);
    try {
      await api.submitSupport({
        name: user?.name?.trim() || 'The Off Grid customer',
        email: user?.email?.trim() || 'support@theoffgrid.in',
        topic,
        message: clean,
      });
      setMessage('');
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || 'We could not send your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>THE OFF GRID / HELP</Text>
    <Text style={s.title}>SUPPORT</Text>
    <Text style={s.copy}>Need help with an order, payment, sizing, return or exchange? Send a request to our support team.</Text>
    <Text style={s.label}>TOPIC</Text>
    <View style={s.chips}>{topics.map(([value, title]) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: topic === value }} style={[s.chip, topic === value && s.active]} onPress={() => { setTopic(value); setError(''); setSuccess(false); }}><Text style={topic === value ? s.activeText : s.chipText}>{title}</Text></Pressable>)}</View>
    <View style={s.messageHeading}><Text style={s.label}>MESSAGE</Text><Text style={s.counter}>{message.trim().length}/1500</Text></View>
    <TextInput multiline value={message} maxLength={1500} onChangeText={value => { setMessage(value); setError(''); setSuccess(false); }} placeholder="Tell us what you need help with (at least 10 characters)" placeholderTextColor="#999" style={s.input} textAlignVertical="top" accessibilityLabel="Support message" />
    {!!error && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorTitle}>REQUEST NOT SENT</Text><Text style={s.errorText}>{error}</Text></View>}
    {success && <View style={s.successBox} accessibilityLiveRegion="polite"><Text style={s.successTitle}>REQUEST SENT</Text><Text style={s.successText}>Your message has been sent to our support team. You can submit another request whenever you need help.</Text></View>}
    <Pressable disabled={busy} style={[s.btn, busy && s.btnDisabled]} onPress={send} accessibilityRole="button">
      {busy ? <View style={s.loading}><ActivityIndicator color="#fff" /><Text style={s.btnText}>SENDING REQUEST…</Text></View> : <Text style={s.btnText}>{error ? 'TRY AGAIN' : 'SEND SUPPORT REQUEST'}</Text>}
    </Pressable>
    <View style={s.faq}>
      <Text style={s.faqTitle}>QUICK HELP</Text>
      <Text style={s.faqText}>• Orders: open My Orders for current status.</Text>
      <Text style={s.faqText}>• Returns & exchanges: open Returns & Refunds.</Text>
      <Text style={s.faqText}>• Sizing: use the product size guide before checkout.</Text>
      <Text style={s.faqText}>• Payments: failed payments can be retried from the order flow.</Text>
    </View>
  </ScrollView>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 22, paddingTop: 58, paddingBottom: 50 },
  eyebrow: { fontSize: 9, color: '#777', letterSpacing: 1.5 },
  title: { fontSize: 42, fontWeight: '900', letterSpacing: -2, marginTop: 4, color: '#111' },
  copy: { fontSize: 12, color: '#666', lineHeight: 19, marginTop: 9, marginBottom: 22 },
  label: { fontSize: 9, color: '#111', fontWeight: '900', letterSpacing: 1.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 22 },
  chip: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 11, minHeight: 40, justifyContent: 'center' },
  active: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { color: '#333', fontSize: 11 },
  activeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  messageHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontSize: 10, color: '#888' },
  input: { borderWidth: 1, borderColor: '#ccc', minHeight: 140, padding: 14, marginTop: 10, color: '#111', fontSize: 13, lineHeight: 19 },
  errorBox: { borderWidth: 1, borderColor: '#e3bcbc', backgroundColor: '#fff8f8', padding: 14, marginTop: 14 },
  errorTitle: { fontSize: 9, fontWeight: '900', color: '#982a2a', letterSpacing: 1 },
  errorText: { fontSize: 12, color: '#713838', lineHeight: 18, marginTop: 6 },
  successBox: { borderWidth: 1, borderColor: '#c8dfcf', backgroundColor: '#f6fbf7', padding: 14, marginTop: 14 },
  successTitle: { fontSize: 9, fontWeight: '900', color: '#245c37', letterSpacing: 1 },
  successText: { fontSize: 12, color: '#315b3d', lineHeight: 18, marginTop: 6 },
  btn: { backgroundColor: '#111', minHeight: 52, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faq: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 30, paddingTop: 20 },
  faqTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4, color: '#111' },
  faqText: { fontSize: 11, color: '#666', marginTop: 9, lineHeight: 17 },
});