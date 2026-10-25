import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Share} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {api} from '../../src/lib/api';

const money = (n: any) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const num = (n: any) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

// In-app invoice, same content as the website invoice. Shared as text, so no extra packages are needed.
export default function Invoice() {
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = async () => {
    const rid = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const res: any = await api.order(String(id));
      if (rid !== requestId.current) return;
      const o = res?.order ?? res?.data?.order ?? res;
      if (!o || o.id === undefined || o.id === null) throw new Error('We could not find this order.');
      setOrder(o);
    } catch (e: any) {
      if (rid === requestId.current) setError(e?.message || 'Could not load this invoice. Please try again.');
    } finally {
      if (rid === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      requestId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const header = (
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={s.back}>
      <Ionicons name="arrow-back" size={19} />
      <Text style={s.backText}>BACK</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#111" size="large" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.content}>
        {header}
        <View style={s.state}>
          <Ionicons name="document-text-outline" size={30} color="#777" />
          <Text style={s.stateTitle}>INVOICE UNAVAILABLE</Text>
          <Text style={s.stateCopy}>{error || 'We could not find this order.'}</Text>
          <Pressable accessibilityRole="button" style={s.button} onPress={load}>
            <Text style={s.buttonText}>TRY AGAIN</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const invoiceNo = `INV-${String(order.id).padStart(6, '0')}`;
  const orderNo = `OG${String(order.id).padStart(6, '0')}`;
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '';
  const subtotal = items.reduce((sum, i) => sum + num(i.price) * num(i.quantity), 0);
  const discount = num(order.discount) + num(order.coupon_discount) + num(order.gift_card_discount) + num(order.combo_discount);
  const total = num(order.total);
  // Whatever is left between the item total, discounts and the order total is shipping or other charges.
  const other = Math.round((total - (subtotal - discount)) * 100) / 100;
  const payMethod = String(order.payment_method || 'cod').toUpperCase();
  const payStatus = String(order.payment_status || 'pending').toUpperCase();
  const address = [order.shipping_address, [order.shipping_city, order.shipping_state].filter(Boolean).join(', ') + (order.shipping_pincode ? ` — ${order.shipping_pincode}` : '')]
    .filter(x => x && String(x).trim() !== '' && String(x).trim() !== '—')
    .join('\n');

  const share = async () => {
    const lines = items.map(
      i => `• ${i.name}${[i.selected_size, i.selected_color].filter(Boolean).length ? ` (${[i.selected_size, i.selected_color].filter(Boolean).join(' / ')})` : ''} × ${num(i.quantity)} — ${money(num(i.price) * num(i.quantity))}`,
    );
    const message = [
      'THE OFF GRID — INVOICE',
      `Invoice No: ${invoiceNo}`,
      `Order No: ${orderNo}`,
      date ? `Date: ${date}` : '',
      '',
      ...lines,
      '',
      `Subtotal: ${money(subtotal)}`,
      discount > 0 ? `Discount: -${money(discount)}` : '',
      other > 0 ? `Shipping & other charges: ${money(other)}` : '',
      `Total (tax inclusive): ${money(total)}`,
      `Payment: ${payMethod} (${payStatus})`,
    ]
      .filter((l, idx, arr) => l !== '' || (arr[idx - 1] !== '' && idx !== 0))
      .join('\n');
    try {
      await Share.share({title: `Invoice ${invoiceNo}`, message});
    } catch (e: any) {
      Alert.alert('Unable to share invoice', e?.message || 'Please try again.');
    }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {header}
      <Text style={s.eyebrow}>THE OFF GRID / INVOICE</Text>
      <Text style={s.title}>{invoiceNo}</Text>

      <View style={s.metaRow}>
        <View>
          <Text style={s.metaLabel}>ORDER NO.</Text>
          <Text style={s.metaValue}>{orderNo}</Text>
        </View>
        {!!date && (
          <View style={{alignItems: 'flex-end'}}>
            <Text style={s.metaLabel}>DATE</Text>
            <Text style={s.metaValue}>{date}</Text>
          </View>
        )}
      </View>

      <View style={s.block}>
        <Text style={s.blockLabel}>BILL / SHIP TO</Text>
        <Text style={s.blockText}>{order.shipping_name || 'Customer'}</Text>
        {!!address && <Text style={s.blockText}>{address}</Text>}
        {!!order.shipping_phone && <Text style={s.blockText}>{order.shipping_phone}</Text>}
      </View>

      <View style={s.block}>
        <Text style={s.blockLabel}>PAYMENT</Text>
        <Text style={s.blockText}>
          {payMethod} · {payStatus}
        </Text>
      </View>

      <Text style={[s.blockLabel, {marginTop: 26}]}>ITEMS</Text>
      {items.map((i, idx) => {
        const variant = [i.selected_size, i.selected_color].filter(Boolean).join(' / ');
        return (
          <View key={String(i.id ?? idx)} style={s.item}>
            <View style={{flex: 1}}>
              <Text style={s.itemName}>{i.name}</Text>
              {!!variant && <Text style={s.itemMeta}>{variant}</Text>}
              <Text style={s.itemMeta}>
                {num(i.quantity)} × {money(i.price)}
              </Text>
            </View>
            <Text style={s.itemTotal}>{money(num(i.price) * num(i.quantity))}</Text>
          </View>
        );
      })}

      <View style={s.totals}>
        <View style={s.line}>
          <Text style={s.lineLabel}>Subtotal</Text>
          <Text style={s.lineValue}>{money(subtotal)}</Text>
        </View>
        {discount > 0 && (
          <View style={s.line}>
            <Text style={s.lineLabel}>Discount</Text>
            <Text style={s.lineValue}>-{money(discount)}</Text>
          </View>
        )}
        {other > 0 && (
          <View style={s.line}>
            <Text style={s.lineLabel}>Shipping & other charges</Text>
            <Text style={s.lineValue}>{money(other)}</Text>
          </View>
        )}
        <View style={[s.line, s.grand]}>
          <Text style={s.grandLabel}>Total (tax inclusive)</Text>
          <Text style={s.grandValue}>{money(total)}</Text>
        </View>
      </View>

      <Text style={s.foot}>This is a computer-generated invoice from THE OFF GRID. Prices shown are inclusive of applicable taxes.</Text>

      <Pressable accessibilityRole="button" accessibilityLabel="Share invoice" style={s.share} onPress={share}>
        <Ionicons name="share-social-outline" size={17} color="#fff" />
        <Text style={s.shareText}>SHARE INVOICE</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#fff'},
  center: {flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  content: {padding: 24, paddingTop: 58, paddingBottom: 45},
  back: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 26},
  backText: {fontSize: 9, fontWeight: '800', letterSpacing: 1},
  eyebrow: {fontSize: 9, letterSpacing: 1.5, color: '#777'},
  title: {fontSize: 34, fontWeight: '900', letterSpacing: -1.5, marginTop: 5, color: '#111'},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#e5e5e5'},
  metaLabel: {fontSize: 8, letterSpacing: 1.2, color: '#777', fontWeight: '800'},
  metaValue: {fontSize: 14, fontWeight: '800', marginTop: 4, color: '#111'},
  block: {marginTop: 20},
  blockLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 1.3, color: '#111', marginBottom: 7},
  blockText: {fontSize: 12, color: '#555', lineHeight: 19},
  item: {flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee'},
  itemName: {fontSize: 13, fontWeight: '800', color: '#111'},
  itemMeta: {fontSize: 11, color: '#777', marginTop: 4},
  itemTotal: {fontSize: 13, fontWeight: '800', color: '#111'},
  totals: {marginTop: 18, gap: 10},
  line: {flexDirection: 'row', justifyContent: 'space-between'},
  lineLabel: {fontSize: 12, color: '#555'},
  lineValue: {fontSize: 12, fontWeight: '700', color: '#111'},
  grand: {borderTopWidth: 1, borderTopColor: '#111', paddingTop: 14, marginTop: 4},
  grandLabel: {fontSize: 13, fontWeight: '900', color: '#111'},
  grandValue: {fontSize: 18, fontWeight: '900', color: '#111'},
  foot: {fontSize: 10, color: '#888', lineHeight: 16, marginTop: 22},
  share: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: '#111', padding: 16, marginTop: 24},
  shareText: {color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1},
  state: {alignItems: 'center', paddingVertical: 40, gap: 10},
  stateTitle: {fontSize: 12, fontWeight: '900', letterSpacing: 1},
  stateCopy: {fontSize: 12, color: '#777', textAlign: 'center', lineHeight: 18},
  button: {backgroundColor: '#111', paddingVertical: 13, paddingHorizontal: 24, marginTop: 10},
  buttonText: {color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1},
});
