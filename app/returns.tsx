import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, listFrom } from '../src/lib/api';

const formatDate = (value: any) => { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN'); };
const formatAmount = (value: any) => { if (value === null || value === undefined || String(value).trim() === '') return 'Amount unavailable'; const amount = Number(value); return Number.isFinite(amount) && amount >= 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Amount unavailable'; };
const reasons = ['Size / fit', 'Damaged item', 'Wrong item received', 'Quality issue', 'Changed my mind', 'Other'];
const terminal = new Set(['cancelled', 'canceled', 'rejected', 'completed', 'refunded', 'closed', 'exchanged']);
const normalizeStatus = (value: any) => String(value || 'requested').trim().toLowerCase().replace(/[ -]+/g, '_');
const statusCopy: Record<string, string> = {
  requested: 'Your request has been submitted and is waiting for review.',
  pending: 'Your request has been submitted and is waiting for review.',
  approved: 'Your request has been approved. Follow any return instructions shared by support.',
  received: 'The returned item has been received.',
  rejected: 'This request was not approved. Contact support if you need clarification.',
  refunded: 'The refund is marked as processed. Your bank or payment provider may take additional time to show it.',
  exchanged: 'The exchange has been processed. Check replacement shipment details below.',
  cancelled: 'This request was cancelled.',
  canceled: 'This request was cancelled.',
  closed: 'This request is closed.',
};
const safeTrackingUrl = (value: any) => {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null; }
  catch { return null; }
};
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
  const requestId = useRef(0);
  const submissionLock = useRef(false);

  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [orderData, returnData] = await Promise.all([api.orders(), api.returns()]);
      if (id === requestId.current) {
        setOrders(listFrom(orderData, ['orders', 'items', 'data', 'results']));
        setReturns(listFrom(returnData, ['returns', 'items', 'data', 'results']));
      }
    } catch (e: any) {
      if (id === requestId.current) setError(e?.message || 'Could not load your orders and return requests.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    return () => { requestId.current++; };
  }, [load]));

  const eligible = orders.filter(o => { const status = normalizeStatus(o.status); const delivered = ['delivered', 'complete', 'completed'].includes(status); const deliveredAt = o.delivered_at ? new Date(o.delivered_at).getTime() : null; const windowClosed = deliveredAt !== null && Number.isFinite(deliveredAt) && Date.now() > deliveredAt + 10 * 24 * 60 * 60 * 1000; return delivered && !windowClosed && !returns.some(r => String(r.order_id ?? r.order?.id) === String(o.id) && !terminal.has(normalizeStatus(r.status))); });

  const request = async (order: any) => {
    const orderId = order?.id;
    if (orderId === null || orderId === undefined || !String(orderId).trim()) {
      setNotice('This order is missing its order ID. Refresh your orders and try again.');
      return;
    }
    const cleanReason = reason === 'Other' ? customReason.trim() : reason;
    if (cleanReason.length < 3) { setNotice('Please describe your return reason.'); return; }
    if (type === 'exchange' && !exchangeSize.trim()) { setNotice('Enter the size you want to exchange for.'); return; }
    if (busyId !== null || submissionLock.current) return;
    submissionLock.current = true;
    setBusyId(order.id);
    setNotice('');
    setError('');
    try {
      await api.createReturn({ order_id: orderId, reason: cleanReason, type, ...(type === 'exchange' ? { exchange_size: exchangeSize.trim().toUpperCase() } : {}) });
      setNotice(`Your ${type} request for order #${orderId} was submitted.`);
      setExchangeSize('');
      await load(true);
    } catch (e: any) {
      setError(e?.message || 'Could not submit your request. Please try again.');
    } finally {
      submissionLock.current = false;
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#F2F0EA" colors={["#111"]} />}>
      <Text style={s.eyebrow}>THE OFF GRID / SUPPORT</Text>
      <Text style={s.title}>RETURNS</Text>
      <Text style={s.copy}>Request a return or exchange for a delivered order and track your existing requests here.</Text>

      {!!notice && <View style={s.notice} accessible accessibilityLiveRegion="polite"><Text style={s.noticeText}>{notice}</Text></View>}
      {!!error && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorText}>{error}</Text><Pressable onPress={() => load(true)} disabled={refreshing} style={s.retry}><Text style={s.retryText}>{refreshing ? 'RETRYING…' : 'RETRY'}</Text></Pressable></View>}

      <Text style={s.label}>REQUEST TYPE</Text>
      <View style={s.choices}>
        {(['return', 'exchange'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={value === 'return' ? 'Request a return' : 'Request an exchange'} accessibilityState={{ selected: type === value }} hitSlop={4} style={[s.choice, type === value && s.choiceActive]} onPress={() => { setType(value); setNotice(''); }}><Text style={[s.choiceText,{color:'#F2F0EA'}, type === value && s.choiceTextActive]}>{value.toUpperCase()}</Text></Pressable>)}
      </View>

      <Text style={s.label}>REASON</Text>
      <View style={s.reasons}>{reasons.map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Return reason: ${value}`} accessibilityState={{ selected: reason === value }} hitSlop={3} style={[s.reason, reason === value && s.reasonActive]} onPress={() => { setReason(value); setNotice(''); }}><Text style={[s.reasonText, reason === value && s.reasonTextActive]}>{value}</Text></Pressable>)}</View>
      {reason === 'Other' && <TextInput accessibilityLabel="Custom return reason" accessibilityHint="Describe the reason in at least 3 characters" value={customReason} onChangeText={setCustomReason} placeholder="Describe your reason" placeholderTextColor="#8A877F" style={s.input} maxLength={300} />}
      {type === 'exchange' && <><Text style={s.label}>REQUESTED SIZE</Text><TextInput value={exchangeSize} onChangeText={value => setExchangeSize(value.replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 12))} placeholder="e.g. M, L, XL or 32" placeholderTextColor="#8A877F" style={s.input} autoCapitalize="characters" maxLength={12} /></>}

      <View style={s.sectionRow}><Text style={s.section}>ELIGIBLE ORDERS</Text><Pressable onPress={() => load(true)} disabled={refreshing}><Text style={s.refresh}>{refreshing ? 'REFRESHING…' : 'REFRESH ↻'}</Text></Pressable></View>
      {loading ? <View style={s.loading}><ActivityIndicator color="#F2F0EA" /><Text style={s.empty}>Loading your orders…</Text></View> : eligible.length ? eligible.map(order => <View key={String(order.id)} style={s.card}>
        <View style={s.orderRow}><Text style={s.order}>ORDER #{order.id}</Text><Text style={[s.delivered,{color:'#5FD38A'}]}>DELIVERED</Text></View>
        {!!formatDate(order.created_at) && <Text style={s.date}>Placed {formatDate(order.created_at)}</Text>}
        <Text style={s.amount}>{formatAmount(order.total ?? order.total_amount)}</Text>
        <Pressable disabled={busyId !== null || loading || refreshing} accessibilityRole="button" accessibilityLabel={`Submit ${type} request for order ${order.id}`} accessibilityState={{ disabled: busyId !== null || loading || refreshing }} style={[s.btn, (busyId !== null || loading || refreshing) && s.disabled]} onPress={() => request(order)}>{busyId === order.id ? <ActivityIndicator color="#0A0A0A" /> : <Text style={s.btnText}>SUBMIT {type.toUpperCase()} REQUEST</Text>}</Pressable>
      </View>) : <Text style={s.empty}>{orders.length ? 'No delivered orders are currently eligible. The 10-day return window may have closed, or a request may already be in progress.' : 'Your delivered orders will appear here when available.'}</Text>}

      <Text style={[s.section, { marginTop: 28 }]}>MY REQUESTS</Text>
      {loading && returns.length === 0 ? null : returns.length ? returns.map(item => {
        const status = normalizeStatus(item.status);
        const trackingUrl = safeTrackingUrl(item.replacement_tracking_url);
        return <View key={String(item.id)} style={s.requestCard}>
          <View style={s.orderRow}><Text style={s.order}>REQUEST #{item.id}</Text><Text style={[s.status, (status === 'rejected' || status === 'cancelled' || status === 'canceled') && s.statusNegative, (status === 'refunded' || status === 'exchanged' || status === 'received') && s.statusPositive]}>{status.replace(/[_-]/g, ' ').toUpperCase()}</Text></View>
          <Text style={s.date}>Order #{item.order_id ?? item.order?.id ?? '—'} · {String(item.type || 'return').toUpperCase()}</Text>
          {!!item.reason && <Text style={s.requestReason}>{item.reason}</Text>}
          {!!formatDate(item.created_at) && <Text style={s.date}>Submitted {formatDate(item.created_at)}</Text>}
          <Text style={s.statusExplanation}>{statusCopy[status] || 'Your request status was updated. Contact support if you need help with the next step.'}</Text>
          {item.type === 'exchange' && !!item.exchange_size && <Text style={s.detailLine}>Requested size: <Text style={s.detailValue}>{String(item.exchange_size).toUpperCase()}</Text></Text>}
          {item.refund_amount !== null && item.refund_amount !== undefined && <Text style={s.detailLine}>Refund amount: <Text style={s.detailValue}>{formatAmount(item.refund_amount)}</Text></Text>}
          {(status === 'approved' || status === 'received' || status === 'refunded') && <View style={s.refundBox}>
            <Text style={s.shipmentTitle}>REFUND STATUS</Text>
            <Text style={s.refundStatus}>{status === 'refunded' ? 'PROCESSED BY THE OFF GRID' : status === 'received' ? 'RETURN RECEIVED · REFUND REVIEW' : 'RETURN APPROVED · AWAITING ITEM / REFUND REVIEW'}</Text>
            {status === 'refunded' && <Text style={s.refundCopy}>The refund is marked as processed. Your bank or payment provider may need additional time to show the credit.</Text>}
            {!!item.razorpay_refund_id && <Text style={s.detailLine}>Refund reference: <Text selectable style={s.detailValue}>{String(item.razorpay_refund_id)}</Text></Text>}
            {!!formatDate(item.updated_at) && <Text style={s.date}>Last updated {formatDate(item.updated_at)}</Text>}
          </View>}
          {!!item.replacement_status && <View style={s.shipmentBox}>
            <Text style={s.shipmentTitle}>REPLACEMENT SHIPMENT · {String(item.replacement_status).replace(/[_-]/g, ' ').toUpperCase()}</Text>
            {!!item.replacement_courier && <Text style={s.detailLine}>Courier: <Text style={s.detailValue}>{item.replacement_courier}</Text></Text>}
            {!!item.replacement_awb && <Text style={s.detailLine}>Tracking / AWB: <Text style={s.detailValue}>{item.replacement_awb}</Text></Text>}
            {!!formatDate(item.replacement_shipped_at) && <Text style={s.date}>Shipped {formatDate(item.replacement_shipped_at)}</Text>}
            {!!formatDate(item.replacement_delivered_at) && <Text style={s.date}>Delivered {formatDate(item.replacement_delivered_at)}</Text>}
            {trackingUrl && <Pressable accessibilityRole="link" style={s.trackLink} onPress={() => { Linking.openURL(trackingUrl).catch(() => setNotice('Unable to open the replacement tracking link.')); }}><Text style={s.trackLinkText}>TRACK REPLACEMENT ↗</Text></Pressable>}
          </View>}
        </View>;
      }) : <Text style={s.empty}>You have no return or exchange requests yet.</Text>}

      <Text style={s.note} accessibilityLiveRegion="polite">Requests are subject to The Off Grid's return policy and backend approval. Submission does not guarantee eligibility or a refund.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#0A0A0A'},content:{padding:22,paddingTop:58,paddingBottom:48},eyebrow:{fontSize:9,fontFamily:'DMSans-Regular',color:'#9A978F',letterSpacing:1.5},title:{fontSize:42,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-2,marginTop:4,color:'#F2F0EA'},copy:{fontSize:12,fontFamily:'DMSans-Regular',color:'#A8A59D',lineHeight:19,marginTop:8,marginBottom:20},
  label:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.2,color:'#E6E3DC',marginTop:12},choices:{flexDirection:'row',gap:8,marginTop:9,marginBottom:14},choice:{borderWidth:1,borderColor:'#2A2A2A',paddingHorizontal:16,paddingVertical:12},choiceActive:{backgroundColor:'#F2F0EA',borderColor:'#F2F0EA'},choiceText:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',color:'#E6E3DC',letterSpacing:1},choiceTextActive:{color:'#0A0A0A'},
  reasons:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10,marginBottom:12},reason:{borderWidth:1,borderColor:'#2A2A2A',paddingHorizontal:11,paddingVertical:10},reasonActive:{borderColor:'#F2F0EA',backgroundColor:'#141414'},reasonText:{fontSize:11,fontFamily:'DMSans-Regular',color:'#C4C1B9'},reasonTextActive:{color:'#F2F0EA',fontFamily:'SpaceGrotesk-Bold'},input:{borderWidth:1,borderColor:'#2A2A2A',padding:13,marginTop:10,marginBottom:10,color:'#F2F0EA'},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:18,marginBottom:8},section:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.4,color:'#F2F0EA'},refresh:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.7,color:'#B5B2AA'},card:{borderTopWidth:1,borderTopColor:'#2A2A2A',paddingVertical:18},orderRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},order:{fontSize:11,fontFamily:'SpaceGrotesk-Bold',color:'#F2F0EA'},delivered:{fontSize:8,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.8,color:'#36734b'},date:{fontSize:10,fontFamily:'DMSans-Regular',color:'#9A978F',marginTop:6},amount:{fontSize:18,fontFamily:'SpaceGrotesk-Bold',marginTop:8,color:'#F2F0EA'},btn:{backgroundColor:'#F2F0EA',padding:14,alignItems:'center',justifyContent:'center',minHeight:44,marginTop:12},disabled:{opacity:.65},btnText:{color:'#0A0A0A',fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},empty:{color:'#9A978F',fontSize:12,fontFamily:'DMSans-Regular',lineHeight:18,paddingVertical:16},loading:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:18},
  requestCard:{borderTopWidth:1,borderTopColor:'#2A2A2A',paddingVertical:15},status:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.8,color:'#B5B2AA'},statusNegative:{color:'#a12622'},statusPositive:{color:'#5FD38A'},statusExplanation:{fontSize:11,fontFamily:'DMSans-Regular',color:'#B5B2AA',lineHeight:17,marginTop:10},detailLine:{fontSize:11,fontFamily:'DMSans-Regular',color:'#A8A59D',marginTop:8,lineHeight:16},detailValue:{fontFamily:'SpaceGrotesk-Bold',color:'#E6E3DC'},refundBox:{marginTop:12,padding:12,backgroundColor:'#141414',borderWidth:1,borderColor:'#2A2A2A'},refundStatus:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.4,color:'#E6E3DC',marginTop:8},refundCopy:{fontSize:11,fontFamily:'DMSans-Regular',color:'#A8A59D',lineHeight:17,marginTop:7},shipmentBox:{marginTop:12,padding:12,backgroundColor:'#141414',borderWidth:1,borderColor:'#2A2A2A'},shipmentTitle:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.7,color:'#E6E3DC',marginBottom:5},trackLink:{alignSelf:'flex-start',marginTop:12,paddingVertical:9,paddingHorizontal:10,borderWidth:1,borderColor:'#F2F0EA'},trackLinkText:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.6,color:'#F2F0EA'},requestReason:{fontSize:12,fontFamily:'DMSans-Regular',color:'#C4C1B9',marginTop:8},notice:{borderWidth:1,borderColor:'#1F5A36',backgroundColor:'#0F2A18',padding:12,marginBottom:12},noticeText:{color:'#5FD38A',fontSize:12,fontFamily:'DMSans-Regular',lineHeight:18},errorBox:{borderWidth:1,borderColor:'#5A2420',backgroundColor:'#2A1210',padding:12,marginBottom:12},errorText:{fontSize:12,fontFamily:'DMSans-Regular',color:'#FF6B62',lineHeight:18},retry:{alignSelf:'flex-start',paddingTop:10,paddingRight:12},retryText:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1,color:'#F2F0EA'},note:{fontSize:9,fontFamily:'DMSans-Regular',color:'#8A877F',lineHeight:15,marginTop:20}
});