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
        <Text style={s.backText}>BACK</Text>
      </Pressable>

      <Text style={s.eyebrow}>THE OFF GRID / ACCOUNT</Text>
      <Text style={s.title}>DELETE ACCOUNT</Text>

      {!user ? (
        <View style={s.notice}>
          <Text style={s.copy}>Sign in to manage your account.</Text>
          <Pressable accessibilityRole="button" style={s.secondary} onPress={() => router.replace('/(tabs)/profile' as any)}>
            <Text style={s.secondaryText}>SIGN IN</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={s.warning}>
            <Ionicons name="warning-outline" size={20} color="#8a2525" />
            <View style={{flex: 1}}>
              <Text style={s.warningTitle}>THIS PERMANENTLY DELETES YOUR ACCOUNT</Text>
              <Text style={s.warningCopy}>
                You will be signed out and will no longer be able to sign in with {user.email || 'this email'}. This cannot be undone.
              </Text>
              <Text style={s.warningCopy}>
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
            placeholderTextColor="#999"
            maxLength={128}
            editable={!busy}
          />

          <Pressable accessibilityRole="button" disabled={busy} style={[s.danger, busy && {opacity: 0.65}]} onPress={confirm}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.dangerText}>DELETE MY ACCOUNT</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} style={s.secondary} onPress={() => router.back()}>
            <Text style={s.secondaryText}>CANCEL</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingTop: 58, paddingBottom: 45},
  back: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 26},
  backText: {fontSize: 9, fontWeight: '800', letterSpacing: 1},
  eyebrow: {fontSize: 9, letterSpacing: 1.5, color: '#777'},
  title: {fontSize: 36, fontWeight: '900', letterSpacing: -2, marginTop: 5, color: '#111', marginBottom: 20},
  warning: {flexDirection: 'row', gap: 12, backgroundColor: '#fdeceb', borderWidth: 1, borderColor: '#f3c8c4', padding: 16},
  warningTitle: {fontSize: 10, fontWeight: '900', letterSpacing: 1, color: '#8a2525'},
  warningCopy: {fontSize: 12, lineHeight: 18, color: '#6f2323', marginTop: 8},
  label: {fontSize: 9, fontWeight: '900', letterSpacing: 1.2, color: '#333', marginTop: 24},
  input: {borderBottomWidth: 1, borderBottomColor: '#111', paddingVertical: 13, marginBottom: 10, fontSize: 15, color: '#111'},
  error: {backgroundColor: '#fdeceb', borderWidth: 1, borderColor: '#f3c8c4', padding: 12, marginTop: 16},
  errorText: {color: '#a3231a', fontSize: 12, lineHeight: 17},
  danger: {backgroundColor: '#b42318', padding: 16, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 18},
  dangerText: {color: '#fff', fontWeight: '900', letterSpacing: 1, fontSize: 10},
  secondary: {borderWidth: 1, borderColor: '#111', padding: 15, alignItems: 'center', marginTop: 12},
  secondaryText: {fontSize: 10, fontWeight: '900', letterSpacing: 1},
  notice: {paddingVertical: 20},
  copy: {fontSize: 13, color: '#666', lineHeight: 20},
});
