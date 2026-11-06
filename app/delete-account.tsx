import React, {useRef, useState} from 'react';
import {ScrollView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {api} from '../src/lib/api';
import {useStore} from '../src/store/store';

export default function DeleteAccount() {
  const router = useRouter();
  const {user, logout} = useStore();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const performDelete = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await api.deleteAccount(password);
      await logout();
      Alert.alert('Account deleted', 'Your account has been deleted. We are sorry to see you go.');
      router.replace('/' as any);
    } catch (e: any) {
      setError(e?.message || 'Could not delete your account. Please try again.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const confirm = () => {
    if (busy || lock.current) return;
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    Alert.alert('Delete your account?', 'This cannot be undone.', [
      {text: 'KEEP MY ACCOUNT', style: 'cancel'},
      {text: 'DELETE', style: 'destructive', onPress: performDelete},
    ]);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={19} />
        <Text style={[s.backText,{color:'#FFFFFF'}]}>BACK</Text>
      </Pressable>

      <Text style={s.eyebrow}>THE OFF GRID / ACCOUNT</Text>
      <Text style={s.title}>DELETE ACCOUNT</Text>

      {!user ? (
        <View style={s.notice}>
          <Text style={s.copy}>Sign in to manage your account.</Text>
          <Pressable accessibilityRole="button" style={s.secondary} onPress={() => router.replace('/(tabs)/profile' as any)}>
            <Text style={[s.secondaryText,{color:'#FFFFFF'}]}>SIGN IN</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={s.warning}>
            <Ionicons name="warning-outline" size={20} color="#FF6B62" />
            <View style={{flex: 1}}>
              <Text style={s.warningTitle}>THIS PERMANENTLY DELETES YOUR ACCOUNT</Text>
              <Text style={[s.warningCopy,{color:'#FFFFFF'}]}>
                You will be signed out and will no longer be able to sign in with {user.email || 'this email'}. This cannot be undone.
              </Text>
              <Text style={[s.warningCopy,{color:'#FFFFFF'}]}>
                Order records may be kept, without a link to your account, for legal and accounting purposes. Cancel any open orders before you delete your account.
              </Text>
            </View>
          </View>

          {!!error && (
            <View style={s.error} accessibilityRole="alert">
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Text style={s.label}>CONFIRM WITH YOUR PASSWORD</Text>
          <TextInput
            accessibilityLabel="Password"
            style={s.input}
            value={password}
            onChangeText={v => {
              setPassword(v);
              setError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Password"
            placeholderTextColor="#8A877F"
            maxLength={128}
            editable={!busy}
          />

          <Pressable accessibilityRole="button" disabled={busy} style={[s.danger, busy && {opacity: 0.65}]} onPress={confirm}>
            {busy ? <ActivityIndicator color="#0A0A0A" /> : <Text style={[s.dangerText,{color:'#FFFFFF'}]}>DELETE MY ACCOUNT</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} style={s.secondary} onPress={() => router.back()}>
            <Text style={[s.secondaryText,{color:'#FFFFFF'}]}>CANCEL</Text>
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
  title: {fontSize: 36, fontFamily:'SpaceGrotesk-Bold', letterSpacing: -2, marginTop: 5, color: '#F2F0EA', marginBottom: 20},
  warning: {flexDirection: 'row', gap: 12, backgroundColor: '#2A1210', borderWidth: 1, borderColor: '#5A2420', padding: 16},
  warningTitle: {fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1, color: '#FF6B62'},
  warningCopy: {fontSize: 12,fontFamily:'DMSans-Regular', lineHeight: 18, color: '#6f2323', marginTop: 8},
  label: {fontSize: 9, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1.2, color: '#D6D3CB', marginTop: 24},
  input: {borderBottomWidth: 1, borderBottomColor: '#F2F0EA', paddingVertical: 13, marginBottom: 10, fontSize: 15,fontFamily:'DMSans-Regular', color: '#F2F0EA'},
  error: {backgroundColor: '#2A1210', borderWidth: 1, borderColor: '#5A2420', padding: 12, marginTop: 16},
  errorText: {color: '#FF6B62', fontSize: 12,fontFamily:'DMSans-Regular', lineHeight: 17},
  danger: {backgroundColor: '#b42318', padding: 16, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 18},
  dangerText: {color: '#0A0A0A', fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1, fontSize: 10},
  secondary: {borderWidth: 1, borderColor: '#F2F0EA', padding: 15, alignItems: 'center', marginTop: 12},
  secondaryText: {fontSize: 10, fontFamily:'SpaceGrotesk-Bold', letterSpacing: 1},
  notice: {paddingVertical: 20},
  copy: {fontSize: 13,fontFamily:'DMSans-Regular', color: '#A8A59D', lineHeight: 20},
});
