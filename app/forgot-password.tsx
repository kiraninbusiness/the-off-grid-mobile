import React, {useRef, useState} from 'react';
import {ScrollView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {api} from '../src/lib/api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const submit = async () => {
    if (lock.current) return;
    const clean = email.trim().toLowerCase();
    if (!EMAIL.test(clean)) {
      setError('Enter the email address you used to sign up.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await api.forgotPassword(clean);
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Could not send the reset email. Please try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={19} />
        <Text style={s.backText}>BACK</Text>
      </Pressable>

      <Text style={s.eyebrow}>THE OFF GRID / ACCOUNT</Text>
      <Text style={s.title}>RESET PASSWORD</Text>

      {sent ? (
        <View style={s.card} accessibilityLiveRegion="polite">
          <Ionicons name="mail-outline" size={30} color="#F2F0EA" />
          <Text style={s.cardTitle}>CHECK YOUR EMAIL</Text>
          <Text style={s.cardCopy}>
            If an account exists for {email.trim().toLowerCase()}, we have sent a link to reset your password. Open the link in the email to choose a new
            password. The link is only valid for a short time.
          </Text>
          <Text style={s.cardCopy}>Nothing arrived? Check your spam folder, or try again in a few minutes.</Text>
          <Pressable accessibilityRole="button" style={s.primary} onPress={() => router.back()}>
            <Text style={s.primaryText}>BACK TO SIGN IN</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={s.sub}>Enter your email and we will send you a link to set a new password.</Text>
          {!!error && (
            <View style={s.error} accessibilityRole="alert">
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
          <Text style={s.label}>EMAIL ADDRESS</Text>
          <TextInput
            accessibilityLabel="Email address"
            style={s.input}
            value={email}
            onChangeText={v => {
              setEmail(v);
              setError('');
            }}
            onSubmitEditing={submit}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="Email"
            placeholderTextColor="#8A877F"
            maxLength={254}
            editable={!busy}
            returnKeyType="send"
          />
          <Pressable accessibilityRole="button" disabled={busy} style={[s.primary, busy && {opacity: 0.65}]} onPress={submit}>
            {busy ? <ActivityIndicator color="#0A0A0A" /> : <Text style={s.primaryText}>SEND RESET LINK</Text>}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#0A0A0A'},
  content: {padding: 24, paddingTop: 58, paddingBottom: 45},
  back: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 26},
  backText: {fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1},
  eyebrow: {fontSize: 9,fontFamily:'DMSans-Regular', letterSpacing: 1.5, color: '#9A978F'},
  title: {fontSize: 38, fontFamily:'SpaceGrotesk-Bold', letterSpacing: -2, marginTop: 5, color: '#F2F0EA'},
  sub: {color: '#9A978F', marginTop: 8, marginBottom: 20, lineHeight: 19, fontSize: 12,fontFamily:'DMSans-Regular'},
  label: {fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.2, color: '#D6D3CB', marginTop: 12},
  input: {borderBottomWidth: 1, borderBottomColor: '#F2F0EA', paddingVertical: 13, marginBottom: 10, fontSize: 15,fontFamily:'DMSans-Regular', color: '#F2F0EA'},
  primary: {backgroundColor: '#F2F0EA', padding: 16, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 18},
  primaryText: {color: '#0A0A0A', fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1, fontSize: 10},
  error: {backgroundColor: '#2A1210', borderWidth: 1, borderColor: '#5A2420', padding: 12, marginBottom: 8},
  errorText: {color: '#FF6B62', fontSize: 12,fontFamily:'DMSans-Regular', lineHeight: 17},
  card: {alignItems: 'center', paddingVertical: 34, gap: 12},
  cardTitle: {fontSize: 13, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.2},
  cardCopy: {fontSize: 12,fontFamily:'DMSans-Regular', color: '#A8A59D', lineHeight: 19, textAlign: 'center'},
});
