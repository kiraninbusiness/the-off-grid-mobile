import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, listFrom } from '../src/lib/api';

const reasons = ['Size / fit', 'Damaged item', 'Wrong item received', 'Quality issue', 'Changed my mind', 'Other'];
const statusLabel = (value: any) => String(value || 'pending').replace(/[_-]/g, ' ').toUpperCase();

export default function Returns() {
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [reason, setReason] = useState('Size / fit');
  const [type, setType] = useState<'return' | 'exchange'>('return');
  const [exchangeSize, setExchangeSize] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState<string | number | null>(null);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [orderData, returnData] = await Promise.all([api.orders(), api.returns()]);
      const orderList = listFrom<any>(orderData, ['orders', 'items', 'data', 'results']);
      const returnList = listFrom<any>(returnData, ['returns', 'items', 'data', 'results']);
      setOrders(orderList);
      setReturns(returnList);
      setSelectedOrder(current => current && orderList.some(o => String(o.id) === String(current)) ? current : null);
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load your orders and return requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const eligible = orders.filter(o => String(o.status || '').toLowerCase() === 'delivered' && !returns.some(x => String(x.order_id ?? x.orderId ?? x.order?.id) === String(o.id) && !['rejected', 'cancelled', 'declined'].includes(String(x.status || '').toLowerCase())));

  const request = async (order: any) => {
    if (busy) return;
    if (!reason.trim()) { setLoadError('Choose a reason for the request.'); return; }
    if (type === 'exchange' && !exchangeSize.trim()) { setLoadError('Enter the size you want to exchange for.'); return; }
    setBusy(true);
    setSubmittingOrder(order.id);
    setLoadError('');
    setSuccess('');
    try {
      await api.createReturn({ order_id: order.id, reason: reason.trim(), type, exchange_size: type === 'exchange' ? exchangeSize.trim() : undefined });
      setSuccess(`${type === 'exchange' ? 'Exchange' : 'Return'} request for order #${order.id} submitted.`);
      setExchangeSize('');
      await load();
    } catch (e: any) {
      setLoadError(e?.message || 'Your request could not be submitted. Please try again.');
    } finally {
      setBusy(false);
      setSubmittingOrder(null);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>THE OFF GRID / SUPPORT</Text>
      <Text style={s.title}>RETURNS</Text>
      <Text style={s.copy}>Review your return requests and start a request for an eligible delivered order. Final eligibility is confirmed by our store team.</Text>

      {!!success && <View style={s.success} accessibilityLiveRegion="polite"><Text style={s.successTitle}>REQUEST SUBMITTED</Text><Text style={s.successText}>{success}</Text></View>}
      {!!loadError && <View style={s.error} accessibilityLiveRegion="polite"><Text style={s.errorText}>{loadError}</Text><Pressable disabled={busy} onPress={load} style={s.retry}><Text style={s.retryText}>REFRESH / TRY AGAIN</Text></Pressable></View>}

      <Text style={s.label}>REQUEST TYPE</Text>
      <View style={s.choices}>
        <Pressable disabled={busy} accessibilityRole="button" accessibilityState={{ selected: type === 'return' }} style={[s.choice, type === 'return' && s.choiceActive]} onPress={() => { setType('return'); setLoadError(''); }}><Text style={type === 'return' ? s.choiceText : s.choiceLabel}>RETURN</Text></Pressable>
        <Pressable disabled={busy} accessibilityRole="button" accessibilityState={{ selected: type === 'exchange' }} style={[s.choice, type === 'exchange' && s.choiceActive]} onPress={() => { setType('exchange'); setLoadError(''); }}><Text style={type === 'exchange' ? s.choiceText : s.choiceLabel}>EXCHANGE</Text></Pressable>
      </View>

      <Text style={s.label}>REASON</Text>
      <View style={s.reasons}>{reasons.map(value => <Pressable key={value} disabled={busy} style={[s.reason, reason === value && s.reasonActive]} onPress={() => { setReason(value); setLoadError(''); }}><Text style={reason === value ? s.reasonTextActive : s.reasonText}>{value}</Text></Pressable>)}</View>
      {type === 'exchange' && <><Text style={s.label}>REQUESTED SIZE</Text><TextInput value={exchangeSize} onChangeText={value => { setExchangeSize(value.slice(0, 12)); setLoadError(''); }} placeholder="e.g. M, L or XL" placeholderTextColor="#999" autoCapitalize="characters" style={s.input} editable={!busy} /></>}

      <Text style={s.section}>ELIGIBLE ORDERS</Text>
      {loading ? <View style={s.loading}><ActivityIndicator color="#111" /><Text style={s.mutedText}>Loading your orders and requests…</Text></View> : eligible.length ? eligible.map(order => (
        <View key={String(order.id)} style={s.card}>
          <View style={s.row}><Text style={s.order}>ORDER #{order.id}</Text><Text style={s.delivered}>DELIVERED</Text></View>
          {!!order.created_at && <Text style={s.date}>{new Date(order.created_at).toLocaleDateString('en-IN')}</Text>}
          <Text style={s.amount}>₹{Number(order.total ?? order.total_amount ?? 0).toLocaleString('en-IN')}</Text>
          <Pressable disabled={busy} style={[s.btn, busy && s.disabled]} onPress={() => request(order)} accessibilityRole="button">
            {busy && String(submittingOrder) === String(order.id) ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>REQUEST {type.toUpperCase()}</Text>}
          </Pressable>
        </View>
      )) : <Text style={s.empty}>{loadError ? 'Refresh to try loading your eligible orders.' : 'No delivered orders are currently available for a new request.'}</Text>}

      <Text style={s.section}>MY REQUESTS</Text>
      {loading ? null : returns.length ? returns.map((item, index) => (
        <View key={String(item.id ?? index)} style={s.requestCard}>
          <View style={s.row}><Text style={s.order}>REQUEST #{item.id ?? '—'}</Text><Text style={s.status}>{statusLabel(item.status)}</Text></View>
          <Text style={s.date}>Order #{item.order_id ?? item.orderId ?? item.order?.id ?? '—'}{item.type ? ` · ${String(item.type).toUpperCase()}` : ''}</Text>
          {!!item.reason && <Text style={s.requestReason}>{item.reason}</Text>}
        </View>
      )) : <Text style={s.empty}>You have no return or exchange requests yet.</Text>}
      <Text style={s.note}>Eligibility, pickup arrangements and refund or exchange decisions are subject to The Off Grid return policy and confirmation by the store.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#fff'}, content:{padding:22,paddingTop:58,paddingBottom:45},
  eyebrow:{fontSize:9,color:'#777',letterSpacing:1.5}, title:{fontSize:42,fontWeight:'900',letterSpacing:-2,marginTop:4,color:'#111'},
  copy:{fontSize:12,color:'#666',lineHeight:19,marginTop:8,marginBottom:20}, label:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:'#333',marginTop:10},
  choices:{flexDirection:'row',gap:8,marginTop:9,marginBottom:15}, choice:{borderWidth:1,borderColor:'#ddd',paddingHorizontal:17,paddingVertical:12,minHeight:42,justifyContent:'center'}, choiceActive:{backgroundColor:'#111',borderColor:'#111}, choiceText:{color:'#fff',fontSize:10,fontWeight:'900',letterSpacing:1}, choiceLabel:{color:'#222',fontSize:10,fontWeight:'900',letterSpacing:1},
  reasons:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10,marginBottom:12}, reason:{borderWidth:1,borderColor:'#ddd',paddingHorizontal:11,paddingVertical:10}, reasonActive:{backgroundColor:'#eee',borderColor:'#111'}, reasonText:{fontSize:11,color:'#555'}, reasonTextActive:{fontSize:11,color:'#111',fontWeight:'800'},
  input:{borderBottomWidth:1,borderBottomColor:'#111',paddingVertical:12,marginTop:8,marginBottom:16,fontSize:15,color:'#111'}, section:{fontSize:10,fontWeight:'900',letterSpacing:1.4,marginTop:24,marginBottom:10,color:'#111'},
  loading:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:18}, mutedText:{fontSize:11,color:'#777'}, card:{borderTopWidth:1,borderTopColor:'#ddd',paddingVertical:18}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}, order:{fontSize:11,fontWeight:'900',color:'#111'}, delivered:{fontSize:8,fontWeight:'900',letterSpacing:1,color:'#2f7045'}, date:{fontSize:10,color:'#777',marginTop:5}, amount:{fontSize:18,fontWeight:'900',marginTop:6,color:'#111'},
  btn:{backgroundColor:'#111',minHeight:44,padding:13,alignItems:'center',justifyContent:'center',marginTop:12}, disabled:{opacity:0.55}, btnText:{color:'#fff',fontSize:9,fontWeight:'900',letterSpacing:1}, empty:{color:'#777',fontSize:11,lineHeight:17,paddingVertical:15},
  requestCard:{borderTopWidth:1,borderTopColor:'#eee',paddingVertical:15}, status:{fontSize:9,fontWeight:'900',letterSpacing:0.6,color:'#333'}, requestReason:{fontSize:11,color:'#555',marginTop:6}, note:{fontSize:10,color:'#999',lineHeight:16,marginTop:20},
  error:{borderWidth:1,borderColor:'#e4c0c0',backgroundColor:'#fff8f8',padding:13,marginTop:14}, errorText:{fontSize:12,lineHeight:18,color:'#8a2525'}, retry:{alignSelf:'flex-start',paddingTop:10,paddingRight:10}, retryText:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#111'},
  success:{borderWidth:1,borderColor:'#b8d9c1',backgroundColor:'#f6fbf7',padding:14,marginBottom:15}, successTitle:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:'#245b36'}, successText:{fontSize:12,lineHeight:18,color:'#31563c',marginTop:6}
});