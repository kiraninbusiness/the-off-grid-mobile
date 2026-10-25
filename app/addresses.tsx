import React, {useCallback, useRef, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {api, listFrom} from '../src/lib/api';

const field = (a: any, ...keys: string[]) => {
  for (const key of keys) {
    const value = a?.[key] ?? (a?.address && typeof a.address === 'object' ? a.address[key] : undefined);
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
};
const street = (a: any) => (typeof a?.address === 'string' ? a.address : String(field(a, 'address_line1', 'line1', 'street', 'address') || ''));
const secondLine = (a: any) => String(field(a, 'address_line2', 'line2', 'landmark') || '');
const locationLine = (a: any) => [field(a, 'city', 'town'), field(a, 'state', 'province')].filter(Boolean).join(', ');
const postalCode = (a: any) => field(a, 'pincode', 'postal_code', 'postcode', 'zip');
const recipient = (a: any) => String(field(a, 'name', 'full_name', 'recipient_name') || '');
const phoneOf = (a: any) => String(a?.phone ?? a?.mobile ?? '');

const LABELS = ['HOME', 'WORK', 'OTHER'];
type Form = {label: string; name: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault: boolean};
const EMPTY: Form = {label: 'HOME', name: '', phone: '', address: '', city: '', state: '', pincode: '', isDefault: false};

export default function Addresses() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const requestId = useRef(0);
  const lock = useRef(false);

  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    if (refresh) setRefreshing(true);
    else setBusy(true);
    setError('');
    try {
      const result = await api.addresses();
      if (id === requestId.current) setAddresses(listFrom<any>(result, ['items', 'addresses', 'data', 'results']));
    } catch (e: any) {
      if (id === requestId.current) setError(e?.message || 'Unable to load saved addresses. Please try again.');
    } finally {
      if (id === requestId.current) {
        setBusy(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      return () => {
        requestId.current++;
      };
    }, [load]),
  );

  const set = (key: keyof Form, value: string | boolean) => {
    setForm(f => ({...f, [key]: value}));
    setFormError('');
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({...EMPTY, isDefault: addresses.length === 0});
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (a: any) => {
    const label = String(a?.label || 'HOME').toUpperCase();
    setEditingId(a.id);
    setForm({
      label: LABELS.includes(label) ? label : 'OTHER',
      name: recipient(a),
      phone: phoneOf(a).replace(/\D/g, '').slice(-10),
      address: street(a),
      city: String(field(a, 'city', 'town') || ''),
      state: String(field(a, 'state', 'province') || ''),
      pincode: String(postalCode(a) || ''),
      isDefault: Boolean(a?.is_default ?? a?.isDefault),
    });
    setFormError('');
    setFormOpen(true);
  };

  const validate = (): string => {
    if (form.name.trim().length < 2) return 'Enter the recipient’s full name.';
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) return 'Enter a valid 10-digit Indian mobile number.';
    if (form.address.trim().length < 5) return 'Enter the full street address.';
    if (!form.city.trim()) return 'Enter the city.';
    if (!form.state.trim()) return 'Enter the state.';
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) return 'Enter a valid 6-digit PIN code.';
    return '';
  };

  const save = async () => {
    if (lock.current) return;
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    lock.current = true;
    setSaving(true);
    setFormError('');
    const body = {
      label: form.label,
      name: form.name.trim(),
      phone: form.phone,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode,
      is_default: form.isDefault,
    };
    try {
      if (editingId !== null) await api.updateAddress(editingId, body);
      else await api.addAddress(body);
      setFormOpen(false);
      await load();
    } catch (e: any) {
      setFormError(e?.message || 'Could not save this address. Please try again.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };

  const runAction = async (key: string, fn: () => Promise<any>, failTitle: string) => {
    if (lock.current) return;
    lock.current = true;
    setWorking(key);
    try {
      await fn();
      await load();
    } catch (e: any) {
      Alert.alert(failTitle, e?.message || 'Please try again.');
    } finally {
      lock.current = false;
      setWorking(null);
    }
  };

  const remove = (a: any) =>
    Alert.alert('Delete this address?', `${recipient(a) || 'This address'} will be removed from your saved addresses.`, [
      {text: 'KEEP', style: 'cancel'},
      {text: 'DELETE', style: 'destructive', onPress: () => runAction(`del-${a.id}`, () => api.deleteAddress(a.id), 'Could not delete address')},
    ]);

  const makeDefault = (a: any) => runAction(`def-${a.id}`, () => api.setDefaultAddress(a.id), 'Could not set default address');

  return (
    <View style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView
        style={s.page}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#111" title="Refreshing addresses…" />}>
        <Text style={s.eyebrow}>THE OFF GRID / ACCOUNT</Text>
        <Text style={s.title}>ADDRESSES</Text>
        <Text style={s.intro}>Your saved delivery details, all in one place.</Text>

        {busy ? (
          <ActivityIndicator style={{marginTop: 28}} size="large" color="#111" />
        ) : error ? (
          <View style={s.state} accessible accessibilityLiveRegion="polite">
            <Ionicons name="cloud-offline-outline" size={28} color="#777" />
            <Text style={s.stateTitle}>ADDRESSES UNAVAILABLE</Text>
            <Text style={s.stateCopy}>{error}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Retry loading addresses" style={s.button} onPress={() => load()}>
              <Text style={s.buttonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="Add a new address" style={s.addBtn} onPress={openAdd}>
              <Ionicons name="add" size={18} color="#111" />
              <Text style={s.addBtnText}>ADD NEW ADDRESS</Text>
            </Pressable>

            {addresses.length === 0 ? (
              <View style={s.state} accessible accessibilityLiveRegion="polite">
                <Ionicons name="location-outline" size={30} color="#777" />
                <Text style={s.stateTitle}>NO SAVED ADDRESSES</Text>
                <Text style={s.stateCopy}>Add an address to check out faster next time.</Text>
              </View>
            ) : (
              addresses.map((a: any, index: number) => {
                const isDefault = Boolean(a.is_default || a.isDefault);
                const rowBusy = working !== null && working.endsWith(String(a.id));
                return (
                  <View style={s.card} key={String(a.id ?? index)}>
                    <View style={s.cardTop}>
                      <View style={s.labelWrap}>
                        <Ionicons name="location-outline" size={15} color="#111" />
                        <Text style={s.label}>{String(a.label || 'ADDRESS').toUpperCase()}</Text>
                      </View>
                      {isDefault ? (
                        <View style={s.defaultBadge}>
                          <Text style={s.defaultText}>DEFAULT</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={s.name}>{recipient(a) || 'Recipient'}</Text>
                    <Text style={s.address}>
                      {street(a)}
                      {secondLine(a) ? '\n' + secondLine(a) : ''}
                    </Text>
                    {!!(locationLine(a) || postalCode(a)) && (
                      <Text style={s.address}>
                        {locationLine(a)}
                        {postalCode(a) ? (locationLine(a) ? ' — ' : '') + String(postalCode(a)) : ''}
                      </Text>
                    )}
                    {phoneOf(a) ? (
                      <View style={s.phoneRow}>
                        <Ionicons name="call-outline" size={14} color="#777" />
                        <Text style={s.phone}>{phoneOf(a)}</Text>
                      </View>
                    ) : null}

                    <View style={s.actions}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${a.label || 'address'}`} disabled={rowBusy} hitSlop={6} onPress={() => openEdit(a)}>
                        <Text style={s.action}>EDIT</Text>
                      </Pressable>
                      {!isDefault && (
                        <Pressable accessibilityRole="button" accessibilityLabel="Set as default address" disabled={rowBusy} hitSlop={6} onPress={() => makeDefault(a)}>
                          <Text style={s.action}>SET AS DEFAULT</Text>
                        </Pressable>
                      )}
                      <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${a.label || 'address'}`} disabled={rowBusy} hitSlop={6} onPress={() => remove(a)}>
                        <Text style={[s.action, {color: '#b42318'}]}>DELETE</Text>
                      </Pressable>
                      {rowBusy && <ActivityIndicator size="small" color="#111" />}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={formOpen} animationType="slide" transparent onRequestClose={() => !saving && setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modal}>
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>{editingId !== null ? 'EDIT ADDRESS' : 'NEW ADDRESS'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close address form" disabled={saving} hitSlop={10} onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={23} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {!!formError && (
                <View style={s.formError} accessibilityRole="alert">
                  <Text style={s.formErrorText}>{formError}</Text>
                </View>
              )}

              <Text style={s.fLabel}>SAVE AS</Text>
              <View style={s.chips}>
                {LABELS.map(l => (
                  <Pressable key={l} accessibilityRole="radio" accessibilityState={{selected: form.label === l}} onPress={() => set('label', l)} style={[s.chip, form.label === l && s.chipOn]}>
                    <Text style={[s.chipText, form.label === l && {color: '#fff'}]}>{l}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.fLabel}>FULL NAME</Text>
              <TextInput style={s.input} value={form.name} onChangeText={v => set('name', v)} placeholder="Recipient name" placeholderTextColor="#999" autoCapitalize="words" maxLength={100} editable={!saving} />

              <Text style={s.fLabel}>MOBILE NUMBER</Text>
              <TextInput style={s.input} value={form.phone} onChangeText={v => set('phone', v.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" placeholderTextColor="#999" keyboardType="phone-pad" maxLength={10} editable={!saving} />

              <Text style={s.fLabel}>ADDRESS</Text>
              <TextInput style={[s.input, {minHeight: 56}]} value={form.address} onChangeText={v => set('address', v)} placeholder="House no., street, area" placeholderTextColor="#999" multiline maxLength={250} editable={!saving} />

              <View style={s.two}>
                <View style={{flex: 1}}>
                  <Text style={s.fLabel}>CITY</Text>
                  <TextInput style={s.input} value={form.city} onChangeText={v => set('city', v)} placeholder="City" placeholderTextColor="#999" maxLength={80} editable={!saving} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.fLabel}>STATE</Text>
                  <TextInput style={s.input} value={form.state} onChangeText={v => set('state', v)} placeholder="State" placeholderTextColor="#999" maxLength={80} editable={!saving} />
                </View>
              </View>

              <Text style={s.fLabel}>PIN CODE</Text>
              <TextInput style={s.input} value={form.pincode} onChangeText={v => set('pincode', v.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit PIN code" placeholderTextColor="#999" keyboardType="number-pad" maxLength={6} editable={!saving} />

              <Pressable accessibilityRole="checkbox" accessibilityState={{checked: form.isDefault}} onPress={() => set('isDefault', !form.isDefault)} style={s.defaultRow}>
                <Ionicons name={form.isDefault ? 'checkbox' : 'square-outline'} size={20} color="#111" />
                <Text style={s.defaultLabel}>Make this my default address</Text>
              </Pressable>

              <Pressable accessibilityRole="button" disabled={saving} style={[s.save, saving && {opacity: 0.65}]} onPress={save}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>{editingId !== null ? 'SAVE CHANGES' : 'SAVE ADDRESS'}</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 24, paddingTop: 58, paddingBottom: 40},
  eyebrow: {fontSize: 9, color: '#777', letterSpacing: 1.5},
  title: {fontSize: 42, fontWeight: '900', letterSpacing: -2, marginTop: 4},
  intro: {fontSize: 12, color: '#777', lineHeight: 18, marginTop: 7, marginBottom: 20},
  addBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#111', paddingVertical: 14, marginBottom: 16},
  addBtnText: {fontSize: 10, fontWeight: '900', letterSpacing: 1},
  card: {borderWidth: 1, borderColor: '#e3e3e3', padding: 18, marginBottom: 12},
  cardTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  labelWrap: {flexDirection: 'row', alignItems: 'center', gap: 7},
  label: {fontSize: 9, fontWeight: '900', letterSpacing: 1.2},
  defaultBadge: {backgroundColor: '#111', paddingHorizontal: 8, paddingVertical: 5},
  defaultText: {fontSize: 8, color: '#fff', fontWeight: '900', letterSpacing: 0.8},
  name: {fontSize: 15, fontWeight: '800', marginTop: 15, marginBottom: 7},
  address: {fontSize: 12, color: '#555', lineHeight: 19},
  phoneRow: {flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10},
  phone: {fontSize: 11, color: '#555'},
  actions: {flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#eee', flexWrap: 'wrap'},
  action: {fontSize: 9, fontWeight: '900', letterSpacing: 1, textDecorationLine: 'underline'},
  state: {alignItems: 'center', paddingVertical: 35, paddingHorizontal: 15},
  stateTitle: {fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 13},
  stateCopy: {fontSize: 12, color: '#777', lineHeight: 18, textAlign: 'center', marginTop: 8},
  button: {backgroundColor: '#111', paddingVertical: 13, paddingHorizontal: 24, marginTop: 18},
  buttonText: {color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1},
  modal: {flex: 1, backgroundColor: 'rgba(0,0,0,.35)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', padding: 22, paddingBottom: 28, maxHeight: '92%'},
  sheetHead: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6},
  sheetTitle: {fontSize: 20, fontWeight: '900'},
  formError: {backgroundColor: '#fdeceb', borderWidth: 1, borderColor: '#f3c8c4', padding: 11, marginTop: 10},
  formErrorText: {color: '#a3231a', fontSize: 12, lineHeight: 17},
  fLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 1.2, color: '#333', marginTop: 14},
  input: {borderBottomWidth: 1, borderBottomColor: '#111', paddingVertical: 10, fontSize: 15, color: '#111'},
  two: {flexDirection: 'row', gap: 14},
  chips: {flexDirection: 'row', gap: 8, marginTop: 8},
  chip: {borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 14, paddingVertical: 10},
  chipOn: {backgroundColor: '#111', borderColor: '#111'},
  chipText: {fontSize: 9, fontWeight: '800', letterSpacing: 0.8},
  defaultRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20},
  defaultLabel: {fontSize: 12, color: '#333'},
  save: {backgroundColor: '#111', padding: 16, minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 22},
  saveText: {color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1},
});
