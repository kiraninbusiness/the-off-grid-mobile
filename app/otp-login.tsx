import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {useRouter} from 'expo-router';
import {api} from '../src/lib/api';
import {useStore} from '../src/store/store';
import LegalLinks from '../src/components/LegalLinks';

type Step = 'phone' | 'code' | 'signup';

// Sign in (or create an account) with an SMS code sent to an Indian mobile number.
export default function OtpLogin() {
  const router = useRouter();
  const {finishLogin} = useStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      if (!/^\d{10}$/.test(phone)) throw new Error('Enter your 10-digit mobile number.');
      await api.otpRequest(phone);
      setCode('');
      setStep('code');
      setWait(30);
    });

  const verify = () =>
    run(async () => {
      if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit code.');
      const r = await api.otpVerify({phone, code, ...(step === 'signup' ? {name: name.trim(), email: email.trim()} : {})});
      if (r.needs_signup) {
        setStep('signup');
        return;
      }
      await finishLogin(r);
      router.replace('/(tabs)' as any);
    });

  const signUp = () =>
    run(async () => {
      if (name.trim().length < 2) throw new Error('Enter your name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email address.');
      const r = await api.otpVerify({phone, code, name: name.trim(), email: email.trim()});
      if (r.needs_signup) throw new Error('Please check your details and try again.');
      await finishLogin(r);
      router.replace('/(tabs)' as any);
    });

  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: '#fff'}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <Text style={s.eyebrow}>THE OFF GRID / ACCOUNT</Text>
        <Text style={s.title}>{step === 'signup' ? 'ONE LAST STEP' : 'SIGN IN WITH OTP'}</Text>

        {step === 'phone' && (
          <>
            <Text style={s.copy}>We will text a 6-digit code to your mobile number.</Text>
            <View style={s.phoneRow}>
              <Text style={s.prefix}>+91</Text>
              <TextInput
                value={phone}
                onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                placeholder="Mobile number"
                placeholderTextColor="#999"
                style={s.input}
                maxLength={10}
                autoFocus
                accessibilityLabel="Mobile number"
                onSubmitEditing={sendCode}
              />
            </View>
            <Pressable accessibilityRole="button" disabled={busy} style={[s.btn, busy && s.dim]} onPress={sendCode}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>SEND CODE</Text>}
            </Pressable>
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={s.copy}>Enter the code sent to +91 {phone}.</Text>
            <TextInput
              value={code}
              onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="6-digit code"
              placeholderTextColor="#999"
              style={[s.box, {letterSpacing: 6, fontSize: 20}]}
              maxLength={6}
              autoFocus
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              accessibilityLabel="6-digit code"
              onSubmitEditing={verify}
            />
            <Pressable accessibilityRole="button" disabled={busy} style={[s.btn, busy && s.dim]} onPress={verify}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>VERIFY</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy || wait > 0} onPress={sendCode} style={s.link}>
              <Text style={s.linkText}>{wait > 0 ? `RESEND CODE IN ${wait}s` : 'RESEND CODE'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setStep('phone'); setError(''); }} style={s.link}>
              <Text style={s.linkText}>CHANGE NUMBER</Text>
            </Pressable>
          </>
        )}

        {step === 'signup' && (
          <>
            <Text style={s.copy}>Your number is verified. Tell us who you are to create your account.</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#999" style={s.box} autoCapitalize="words" accessibilityLabel="Full name" />
            <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#999" style={s.box} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Email address" />
            <Pressable accessibilityRole="button" disabled={busy} style={[s.btn, busy && s.dim]} onPress={signUp}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>CREATE ACCOUNT</Text>}
            </Pressable>
          </>
        )}

        {!!error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
        <LegalLinks action={step === 'signup' ? 'creating an account' : 'signing in'} />
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.link}>
          <Text style={s.linkText}>USE EMAIL AND PASSWORD INSTEAD</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: {padding: 24, paddingTop: 70},
  eyebrow: {fontSize: 9, color: '#777', letterSpacing: 1.5},
  title: {fontSize: 34, fontWeight: '900', letterSpacing: -1.2, marginTop: 6},
  copy: {fontSize: 13, color: '#555', lineHeight: 20, marginTop: 14, marginBottom: 20},
  phoneRow: {flexDirection: 'row', borderWidth: 1, borderColor: '#ccc', height: 52, marginBottom: 14},
  prefix: {paddingHorizontal: 14, fontSize: 15, fontWeight: '800', alignSelf: 'center', borderRightWidth: 1, borderRightColor: '#ddd', height: '100%', textAlignVertical: 'center', lineHeight: 52},
  input: {flex: 1, paddingHorizontal: 14, fontSize: 16, letterSpacing: 1, color: '#111'},
  box: {borderWidth: 1, borderColor: '#ccc', height: 52, paddingHorizontal: 14, fontSize: 15, marginBottom: 14, color: '#111'},
  btn: {height: 54, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center'},
  btnText: {color: '#fff', fontWeight: '900', letterSpacing: 1.2},
  dim: {opacity: 0.6},
  link: {alignItems: 'center', paddingVertical: 14},
  linkText: {fontSize: 10, fontWeight: '800', letterSpacing: 1, textDecorationLine: 'underline', color: '#111'},
  error: {color: '#b42318', fontSize: 12, marginTop: 14, lineHeight: 18},
});
