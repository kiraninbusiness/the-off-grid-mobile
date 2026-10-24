import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, listFrom } from '../src/lib/api';

const isRead = (item: any) => Boolean(item.read_at || item.read === true || item.is_read === true);
const formatDate = (value: any) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-IN');
};
export default function Notifications() {
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const r = useRouter();
  const requestId = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    refresh ? setRefreshing(true) : setBusy(true);
    setError('');
    setActionError('');
    try {
      const data = await api.notifications();
      if (id === requestId.current) setItems(listFrom(data, ['notifications', 'items', 'data', 'results']));
    } catch (e: any) {
      if (id === requestId.current) setError(e?.message || 'Could not load notifications. Check your connection and try again.');
    } finally {
      if (id === requestId.current) {
        setBusy(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    return () => { requestId.current++; };
  }, [load]));
  const unread = items.filter(item => !isRead(item));
  const mark = async (item: any) => {
    if (isRead(item) || actionBusy) return;
    setActionBusy(true); setActionError('');
    try {
      await api.readNotification(Number(item.id));
      setItems(current => current.map(n => String(n.id) === String(item.id) ? { ...n, read_at: new Date().toISOString(), read: true, is_read: true } : n));
    } catch (e: any) {
      setActionError(e?.message || 'Could not mark this notification as read. Please try again.');
    } finally { setActionBusy(false); }
  };
  const markAll = async () => {
    if (!unread.length || actionBusy) return;
    setActionBusy(true); setActionError('');
    try {
      await api.readAllNotifications();
      const now = new Date().toISOString();
      setItems(current => current.map(n => ({ ...n, read_at: n.read_at || now, read: true, is_read: true })));
    } catch (e: any) {
      setActionError(e?.message || 'Could not mark all notifications as read. Please try again.');
    } finally { setActionBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.head}>
        <View style={s.heading}><Text style={s.eyebrow}>THE OFF GRID / UPDATES</Text><Text style={s.title}>NOTIFICATIONS</Text><Text style={s.subtitle}>{unread.length ? `${unread.length} unread update${unread.length === 1 ? '' : 's'}` : 'You are up to date'}</Text></View>
        <Pressable onPress={() => r.back()} accessibilityRole="button" accessibilityLabel="Close notifications" style={s.close}><Ionicons name="close" size={23} color="#111" /></Pressable>
      </View>

      {unread.length > 0 && <Pressable disabled={actionBusy} onPress={markAll} style={[s.readAllButton, actionBusy && s.disabled]}><Text style={s.readAll}>{actionBusy ? 'UPDATING…' : 'MARK ALL AS READ'}</Text></Pressable>}
      {actionBusy && <View style={s.actionLoading}><ActivityIndicator size="small" color="#111" /><Text style={s.helper}>Updating notifications…</Text></View>}
      {!!actionError && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorText}>{actionError}</Text><Pressable onPress={() => load(true)} style={s.retry}><Text style={s.retryText}>REFRESH & RETRY</Text></Pressable></View>}

      {busy ? <View style={s.center}><ActivityIndicator size="small" color="#111" /><Text style={s.helper}>Loading notifications…</Text></View> : error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text><Pressable onPress={() => load(true)} disabled={refreshing} style={s.retry}><Text style={s.retryText}>{refreshing ? 'RETRYING…' : 'TRY AGAIN'}</Text></Pressable></View> : !items.length ? <View style={s.emptyWrap}><Ionicons name="notifications-outline" size={30} color="#888" /><Text style={s.emptyTitle}>YOU'RE ALL CAUGHT UP</Text><Text style={s.empty}>New order and account updates will appear here.</Text><Pressable onPress={() => load(true)} disabled={refreshing} style={s.refresh}><Text style={s.retryText}>{refreshing ? 'REFRESHING…' : 'REFRESH ↻'}</Text></Pressable></View> : <>
        <Pressable onPress={() => load(true)} disabled={refreshing} style={s.refreshTop}><Text style={s.retryText}>{refreshing ? 'REFRESHING…' : 'REFRESH ↻'}</Text></Pressable>
        {items.map((item, index) => {
          const read = isRead(item);
          return <Pressable key={String(item.id ?? item.created_at ?? index)} onPress={() => mark(item)} disabled={read || actionBusy} accessibilityRole="button" accessibilityState={{ selected: !read, disabled: read || actionBusy }} style={[s.item, !read && s.unread]}>
            <View style={[s.dot, read && s.readDot]} />
            <View style={s.itemContent}>
              <View style={s.itemHead}><Text style={s.itemTitle}>{item.title || item.type || 'THE OFF GRID'}</Text>{!read && <Text style={s.new}>NEW</Text>}</View>
              <Text style={s.itemBody}>{item.message || item.body || item.description || 'You have a new update.'}</Text>
              {!!formatDate(item.created_at) && <Text style={s.date}>{formatDate(item.created_at)}</Text>}
              {!read && <Text style={s.tapHint}>TAP TO MARK AS READ</Text>}
            </View>
          </Pressable>;
        })}
      </>}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#fff'},content:{padding:22,paddingTop:58,paddingBottom:45},head:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},heading:{flex:1},close:{padding:6},eyebrow:{fontSize:9,color:'#777',letterSpacing:1.5},title:{fontSize:34,fontWeight:'900',letterSpacing:-1.6,marginTop:4,color:'#111'},subtitle:{fontSize:11,color:'#777',marginTop:7,marginBottom:15},
  readAllButton:{alignSelf:'flex-start',paddingVertical:10,paddingRight:12,marginBottom:8},readAll:{fontSize:9,fontWeight:'900',letterSpacing:1,textDecorationLine:'underline',color:'#111'},disabled:{opacity:.6},actionLoading:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:8},helper:{fontSize:11,color:'#777',marginTop:5},center:{alignItems:'center',paddingVertical:30},errorBox:{borderWidth:1,borderColor:'#e4c0c0',backgroundColor:'#fff8f8',padding:14,marginTop:12},errorText:{fontSize:12,color:'#8a2525',lineHeight:18},retry:{alignSelf:'flex-start',paddingTop:12,paddingRight:12},retryText:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#111'},
  emptyWrap:{alignItems:'center',paddingVertical:35},emptyTitle:{fontSize:10,fontWeight:'900',letterSpacing:1.2,color:'#222',marginTop:14},empty:{color:'#777',fontSize:12,lineHeight:18,textAlign:'center',paddingVertical:10},refresh:{padding:12},refreshTop:{alignSelf:'flex-end',paddingVertical:10},
  item:{flexDirection:'row',gap:12,paddingVertical:17,borderTopWidth:1,borderTopColor:'#eee'},unread:{backgroundColor:'#fafafa'},dot:{width:8,height:8,borderRadius:4,backgroundColor:'#111',marginTop:5},readDot:{backgroundColor:'#ddd'},itemContent:{flex:1},itemHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},itemTitle:{fontSize:12,fontWeight:'900',color:'#111',flex:1},new:{fontSize:8,fontWeight:'900',letterSpacing:.8,color:'#555'},itemBody:{fontSize:12,color:'#555',lineHeight:18,marginTop:5},date:{fontSize:9,color:'#999',marginTop:7},tapHint:{fontSize:8,color:'#777',letterSpacing:.8,fontWeight:'800',marginTop:8}
});