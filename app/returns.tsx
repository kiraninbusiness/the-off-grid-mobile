import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, listFrom } from '../src/lib/api';

const reasons = ['Size / fit', 'Damaged item', 'Wrong item received', 'Quality issue', 'Changed my mind', 'Other'];
const terminal = new Set(['cancelled', 'rejected', 'completed', 'refunded', 'closed']);
export default function Returns() {
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [reason, setReason] = useState('Size / fit');
  const [customReason, setCustomReason] = useState('');
  const [type, setType] = useState<'return' | 'exchange'>('return');
  const [exchangeSize, setExchangeSize] = useState('');
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [orderData, returnData] = await Promise.all([api.orders(), api.returns()]);
      setOrders(listFrom(orderData, ['orders', 'items', 'data', 'results']));
      setReturns(listFrom(returnData, ['returns', 'items', 'data', 'results']));
    } catch (e: any) {
      setError(e?.message || 'Could not load your orders and return requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const eligible = orders.filter(o => String(o.status || '').toLowerCase() === 'delivered' && !returns.some(r => String(r.order_id ?? r.order?.id) === String(o.id) && !terminal.has(String(r.status || 'pending').toLowerCase())));

  const request = async (order: any) => {
    const cleanReason = reason === 'Other' ? customReason.trim() : reason;
    if (cleanReason.length < 3) { setNotice('Please describe your return reason.'); return; }
    if (type === 'exchange' && !exchangeSize.trim()) { setNotice('Enter the size you want to exchange for.'); return; }
    if (busyId !== null) return;
    setBusyId(order.id);
    setNotice('');
    setError('');
    try {
      await api.createReturn({ order_id: order.id, reason: cleanReason, type, ...(type === 'exchange' ? { exchange_size: exchangeSize.trim().toUpperCase() } : {}) });
      setNotice(`Your ${type} request for order #${order.id} was submitted.`);
      setExchangeSize('');
      await load(true);
    } catch (e: any) {
      setError(e?.message || 'Could not submit your request. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>THE OFF GRID / SUPPORT</Text>
      <Text style={s.title}>RETURNS</Text>
      <Text style={s.copy}>Request a return or exchange for a delivered order and track your existing requests here.</Text>

      {!!notice && <View style={s.notice}><Text style={s.noticeText}>{notice}</Text></View>}
      {!!error && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorText}>{error}</Text><Pressable onPress={() => load(true)} disabled={refreshing} style={s.retry}><Text style={s.retryText}>{refreshing ? 'RETRYING…' : 'RETRY'}</Text></Pressable></View>}

      <Text style={s.label}>REQUEST TYPE</Text>
      <View style={s.choices}>
        {(['return', 'exchange'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: type === value }} style={[s.choice, type === value && s.choiceActive]} onPress={() => { setType(value); setNotice(''); }}><Text style={[s.choiceText, type === value && s.choiceTextActive]}>{value.toUpperCase()}</Text></Pressable>)}
      </View>

      <Text style={s.label}>REASON</Text>
      <View style={s.reasons}>{reasons.map(value => <Pressable key={value} style={[s.reason, reason === value && s.reasonActive]} onPress={() => { setReason(value); setNotice(''); }}><Text style={[s.reasonText, reason === value && s.reasonTextActive]}>{value}</Text></Pressable>)}</View>
      {reason === 'Other' && <TextInput value={customReason} onChangeText={setCustomReason} placeholder="Describe your reason" placeholderTextColor="#999" style={s.input} maxLength={300} />}
      {type === 'exchange' && <><Text style={s.label}>REQUESTED SIZE</Text><TextInput value={exchangeSize} onChangeText={value => setExchangeSize(value.replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 12))} placeholder="e.g. M, L, XL or 32" placeholderTextColor="#999" style={s.input} autoCapitalize="characters" maxLength={12} /></>}

      <View style={s.sectionRow}><Text style={s.section}>ELIGIBLE ORDERS</Text><Pressable onPress={() => load(true)} disabled={refreshing}><Text style={s.refresh}>{refreshing ? 'REFRESHING…' : 'REFRESH ↻'}</Text></Pressable></View>
      {loading ? <View style={s.loading}><ActivityIndicator color="#111" /><Text style={s.empty}>Loading your orders…</Text></View> : eligible.length ? eligible.map(order => <View key={String(order.id)} style={s.card}>
        <View style={s.orderRow}><Text style={s.order}>ORDER #{order.id}</Text><Text style={s.delivered}>DELIVERED</Text></View>
        {!!order.created_at && <Text style={s.date}>Placed {new Date(order.created_at).toLocaleDateString('en-IN')}</Text>}
        <Text style={s.amount}>₹{Number(order.total ?? order.total_amount ?? 0).toLocaleString('en-IN')}</Text>
        <Pressable disabled={busyId !== null} style={[s.btn, busyId !== null && s.disabled]} onPress={() => request(order)}>{busyId === order.id ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>SUBMIT {type.toUpperCase()} REQUEST</Text>}</Pressable>
      </View>) : <Text style={s.empty}>{orders.length ? 'No delivered orders are currently eligible, or a request is already in progress.' : 'Your delivered orders will appear here when available.'}</Text>}

      <Text style={[s.section, { marginTop: 28 }]}>MY REQUESTS</Text>
      {loading && returns.length === 0 ? null : returns.length ? returns.map(item => <View key={String(item.id)} style={s.requestCard}>
        <View style={s.orderRow}><Text style={s.order}>REQUEST #{item.id}</Text><Text style={s.status}>{String(item.status || 'pending').replace(/[_-]/g, ' ').toUpperCase()}</Text></View>
        <Text style={s.date}>Order #{item.order_id ?? item.order?.id ?? '—'} · {String(item.type || 'return').toUpperCase()}</Text>
        {!!item.reason && <Text style={s.requestReason}>{item.reason}</Text>}
        {!!item.created_at && <Text style={s.date}>Submitted {new Date(item.created_at).toLocaleDateString('en-IN')}</Text>}
      </View>) : <Text style={s.empty}>You have no return or exchange requests yet.</Text>}

      <Text style={s.note}>Requests are subject to The Off Grid's return policy and backend approval. Submission does not guarantee eligibility or a refund.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#fff'},content:{padding:22,paddingTop:58,paddingBottom:48},eyebrow:{fontSize:9,color:'#777',letterSpacing:1.5},title:{fontSize:42,fontWeight:'900',letterSpacing:-2,marginTop:4,color:'#111'},copy:{fontSize:12,color:'#666',lineHeight:19,marginTop:8,marginBottom:20},
  label:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:'#222',marginTop:12},choices:{flexDirection:'row',gap:8,marginTop:9,marginBottom:14},choice:{borderWidth:1,borderColor:'#ddd',paddingHorizontal:16,paddingVertical:12},choiceActive:{backgroundColor:'#111',borderColor:'#111'},choiceText:{fontSize:10,fontWeight:'800',color:'#222',letterSpacing:1},choiceTextActive:{color:'#fff'},
  reasons:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10,marginBottom:12},reason:{borderWidth:1,borderColor:'#ddd',paddingHorizontal:11,paddingVertical:10},reasonActive:{borderColor:'#111',backgroundColor:'#f2f2f2'},reasonText:{fontSize:11,color:'#444'},reasonTextActive:{color:'#111',fontWeight:'800'},input:{borderWidth:1,borderColor:'#ddd',padding:13,marginTop:10,marginBottom:10,color:'#111'},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18,marginBottom:8},section:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:'#111'},refresh:{fontSize:9,fontWeight:'800',letterSpacing:.7,color:'#555'},card:{borderTopWidth:1,borderTopColor:'#ddd',paddingVertical:18},orderRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},order:{fontSize:11,fontWeight:'900',color:'#111'},delivered:{fontSize:8,fontWeight:'900',letterSpacing:.8,color:'#36734b'},date:{fontSize:10,color:'#777',marginTop:6},amount:{fontSize:18,fontWeight:'900',marginTop:8,color:'#111'},btn:{backgroundColor:'#111',padding:14,alignItems:'center',justifyContent:'center',minHeight:44,marginTop:12},disabled:{opacity:.65},btnText:{color:'#fff',fontSize:9,fontWeight:'900',letterSpacing:1},empty:{color:'#777',fontSize:12,lineHeight:18,paddingVertical:16},loading:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:18},
  requestCard:{borderTopWidth:1,borderTopColor:'#eee',paddingVertical:15},status:{fontSize:9,fontWeight:'900',letterSpacing:.8,color:'#555'},requestReason:{fontSize:12,color:'#444',marginTop:8},notice:{borderWidth:1,borderColor:'#b8d9c1',backgroundColor:'#f6fbf7',padding:12,marginBottom:12},noticeText:{color:'#245b36',fontSize:12,lineHeight:18},errorBox:{borderWidth:1,borderColor:'#e4c0c0',backgroundColor:'#fff8f8',padding:12,marginBottom:12},errorText:{fontSize:12,color:'#8a2525',lineHeight:18},retry:{alignSelf:'flex-start',paddingTop:10,paddingRight:12},retryText:{fontSize:10,fontWeight:'900',letterSpacing:1,color:'#111'},note:{fontSize:9,color:'#999',lineHeight:15,marginTop:20}
});