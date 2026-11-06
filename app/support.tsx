import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../src/lib/api';
import { useStore } from '../src/store/store';

const topics = [['order-tracking', 'Order tracking'], ['payment', 'Payment'], ['return', 'Return'], ['exchange', 'Exchange'], ['refund', 'Refund'], ['sizing', 'Sizing'], ['general', 'General']];
const MAX_MESSAGE = 1500;

export default function Support() {
  const { user } = useStore();
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(String(user?.email || ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const sending = useRef(false);

  const send = async () => {
    if (sending.current || busy) return;
    const clean = message.trim();
    const email = contactEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address so our team can reply.'); return; }
    if (clean.length < 10) { setError('Please describe your issue in at least 10 characters.'); return; }
    if (clean.length > MAX_MESSAGE) { setError('Keep your message within 1,500 characters.'); return; }
    sending.current = true;
    setBusy(true); setError(''); setSent(false);
    try {
      await api.submitSupport({ name: user?.name?.trim() || 'The Off Grid customer', email, topic, message: clean });
      setMessage(''); setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Your request could not be sent. Please try again.');
    } finally { sending.current = false; setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>THE OFF GRID / HELP</Text>
      <Text style={s.title}>SUPPORT</Text>
      <Text style={s.copy}>Need help with an order, payment, sizing, return or exchange? Send a request and our team will get back to you.</Text>
      {sent && <View style={s.success} accessibilityLiveRegion="polite" accessible><Text style={s.successTitle}>REQUEST SENT</Text><Text style={[s.successText,{color:'#FFFFFF'}]}>Your message has been submitted successfully.{contactEmail.trim() ? ' We will use the email address you provided for any follow-up.' : ''}</Text><Pressable onPress={() => setSent(false)} style={s.dismiss}><Text style={s.dismissText}>SEND ANOTHER REQUEST</Text></Pressable></View>}
      <Text style={s.label}>EMAIL FOR OUR REPLY</Text>
      <TextInput value={contactEmail} onChangeText={value => { setContactEmail(value.slice(0, 254)); setError(''); setSent(false); }} placeholder="you@example.com" placeholderTextColor="#8A877F" style={s.emailInput} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} accessibilityLabel="Contact email" />
      <Text style={s.label}>WHAT DO YOU NEED HELP WITH?</Text>
      <View style={s.chips}>{topics.map(([value, label]) => <Pressable key={value} disabled={busy} accessibilityRole="button" accessibilityHint="Select this topic for your support request" accessibilityState={{ selected: topic === value, disabled: busy }} style={[s.chip, topic === value && s.active, busy && s.muted]} onPress={() => { setTopic(value); setError(''); }}><Text style={topic === value ? s.activeText : s.chipText}>{label}</Text></Pressable>)}</View>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={s.label}>MESSAGE</Text>{!!message&&!busy&&<Pressable accessibilityRole="button" accessibilityLabel="Clear support message" onPress={()=>{setMessage('');setError('');setSent(false);}} hitSlop={8}><Text style={s.dismissText}>CLEAR</Text></Pressable>}</View>
      <TextInput multiline value={message} onChangeText={value => { setMessage(value.slice(0, MAX_MESSAGE)); setError(''); setSent(false); }} placeholder="Include your order number if relevant, and tell us what happened." placeholderTextColor="#8A877F" style={s.input} textAlignVertical="top" maxLength={MAX_MESSAGE} editable={!busy} accessibilityLabel="Support message" accessibilityHint="Enter at least 10 characters. Maximum 1,500 characters." />
      <Text accessibilityLiveRegion="polite" style={[s.counter, message.length > 1400 && s.counterWarn]}>{message.length}/{MAX_MESSAGE} characters · Minimum 10</Text>
      {!!error && <View style={s.error} accessibilityLiveRegion="polite"><Text style={s.errorText}>{error}</Text>{!busy && message.trim().length >= 10 && <Pressable onPress={send} style={s.retry}><Text style={s.retryText}>TRY AGAIN</Text></Pressable>}</View>}
      <Pressable disabled={busy} style={[s.btn, busy && s.btnDisabled]} onPress={send} accessibilityRole="button" accessibilityLabel={busy ? "Sending support request" : "Send support request"} accessibilityState={{ disabled: busy }}>{busy ? <View style={s.sending}><ActivityIndicator color="#0A0A0A" size="small" /><Text style={s.btnText}>SENDING REQUEST…</Text></View> : <Text style={s.btnText}>SEND SUPPORT REQUEST</Text>}</Pressable>
      <View style={s.faq}><Text style={s.faqTitle}>QUICK HELP</Text><Text style={s.faqText}>• Orders: open My Orders to check the latest status.</Text><Text style={s.faqText}>• Returns & exchanges: open Returns & Refunds from your account.</Text><Text style={s.faqText}>• Sizing: check the size guide on the product page before ordering.</Text><Text style={s.faqText}>• Payments: check your order status before trying a payment again.</Text></View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 22, paddingTop: 58, paddingBottom: 50 },
  eyebrow: { fontSize: 9,fontFamily:'DMSans-Regular', color: '#9A978F', letterSpacing: 1.5 },
  title: { fontSize: 42, fontFamily:'SpaceGrotesk-Bold', letterSpacing: -2, marginTop: 4, color: '#F2F0EA' },
  copy: { fontSize: 12,fontFamily:'DMSans-Regular', color: '#A8A59D', lineHeight: 19, marginTop: 9, marginBottom: 22 },
  label: { fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.3, marginTop: 12, color: '#E6E3DC' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 18 },
  chip: { borderWidth: 1, borderColor: '#2A2A2A', paddingHorizontal: 12, paddingVertical: 11, minHeight: 40, justifyContent: 'center' },
  active: { backgroundColor: '#F2F0EA', borderColor: '#F2F0EA' },
  muted: { opacity: 0.6 },
  chipText: { color: '#E6E3DC', fontSize: 11,fontFamily:'DMSans-Regular' },
  activeText: { color: '#0A0A0A', fontSize: 11, fontFamily:'DMSans-Bold' },
  emailInput: { borderWidth: 1, borderColor: '#2A2A2A', minHeight: 48, paddingHorizontal: 14, marginTop: 10, fontSize: 13,fontFamily:'DMSans-Regular', color: '#F2F0EA' },
  input: { borderWidth: 1, borderColor: '#2A2A2A', minHeight: 145, padding: 14, marginTop: 10, fontSize: 13,fontFamily:'DMSans-Regular', lineHeight: 19, color: '#F2F0EA' },
  counter: { fontSize: 10,fontFamily:'DMSans-Regular', color: '#8F8C85', textAlign: 'right', marginTop: 7 },
  counterWarn: { color: '#F5B83D' },
  btn: { backgroundColor: '#F2F0EA', minHeight: 50, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#0A0A0A', fontFamily:'SpaceGrotesk-Bold', fontSize: 9, letterSpacing: 1 },
  sending: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  error: { backgroundColor: '#2A1210', borderWidth: 1, borderColor: '#5A2420', padding: 12, marginTop: 12 },
  errorText: { color: '#FF6B62', fontSize: 12,fontFamily:'DMSans-Regular', lineHeight: 18 },
  retry: { alignSelf: 'flex-start', paddingTop: 10, paddingRight: 12 },
  retryText: { fontSize: 10, fontFamily:'SpaceGrotesk-Bold', color: '#F2F0EA', letterSpacing: 1 },
  success: { borderWidth: 1, borderColor: '#1F5A36', backgroundColor: '#0F2A18', padding: 16, marginBottom: 18 },
  successTitle: { fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.2, color: '#5FD38A' },
  successText: { fontSize: 12,fontFamily:'DMSans-Regular', lineHeight: 18, color: '#31563c', marginTop: 7 },
  dismiss: { alignSelf: 'flex-start', paddingTop: 12, paddingRight: 12 },
  dismissText: { fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1, color: '#F2F0EA' },
  faq: { borderTopWidth: 1, borderTopColor: '#2A2A2A', marginTop: 30, paddingTop: 20 },
  faqTitle: { fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.4, color: '#F2F0EA' },
  faqText: { fontSize: 11,fontFamily:'DMSans-Regular', color: '#A8A59D', marginTop: 9, lineHeight: 17 }
});
