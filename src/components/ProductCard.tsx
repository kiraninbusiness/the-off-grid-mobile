import React from 'react';
import {View, Text, Image, Pressable, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useStore} from '../store/store';

const money = (v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80';

function stockState(p: any) {
  const quantity = p.stock_quantity ?? p.inventory ?? p.stockCount;
  if (typeof quantity === 'number') return quantity > 0;
  if (typeof p.stock === 'number') return p.stock > 0;
  for (const key of ['in_stock', 'is_available', 'available', 'stock']) {
    if (typeof p[key] === 'boolean') return p[key];
  }
  // Unknown inventory should not be advertised as sold out; the product detail
  // screen remains responsible for confirming availability before purchase.
  return null;
}

export default function ProductCard({p}: {p: any}) {
  const r = useRouter();
  const {wishlist, toggleWish, add} = useStore();
  const liked = wishlist.some((id: any) => String(id) === String(p.id));
  const price = Number(p.price || 0);
  const oldPrice = Number(p.old_price || p.compare_at_price || 0);
  const discount = oldPrice > price && price > 0 ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const available = stockState(p);
  const sizes = Array.isArray(p.sizes) ? p.sizes : Array.isArray(p.variants) ? p.variants.map((v: any) => v?.size).filter(Boolean) : [];
  const openProduct = () => r.push(`/product/${p.id}` as any);
  const quickAdd = async () => {
    // Never put a size-dependent product in the cart without a selected size.
    if (sizes.length || available === null) { openProduct(); return; }
    if (!available) return;
    try { await add(p); } catch { openProduct(); }
  };

  return (
    <View style={s.card}>
      <Pressable accessibilityRole="button" accessibilityLabel={`View ${p.name || 'product'}`} onPress={openProduct}>
        <View style={s.media}>
          <Image source={{uri: p.image || p.images?.[0] || FALLBACK_IMAGE}} style={s.img} resizeMode="cover" />
          <View style={s.badge}><Text style={s.badgeText}>{discount > 0 ? `-${discount}%` : 'NEW'}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={liked ? 'Remove from wishlist' : 'Add to wishlist'} hitSlop={8} style={s.heart} onPress={() => toggleWish(p.id)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#b4232f' : '#111'} />
          </Pressable>
          {available === false && <View style={s.sold}><Text style={s.soldText}>SOLD OUT</Text></View>}
        </View>
        <Text style={s.cat}>{p.category || 'THE OFF GRID'}</Text>
        <Text style={s.name} numberOfLines={2}>{p.name || 'Untitled product'}</Text>
        <View style={s.priceRow}>
          <Text style={s.price}>{money(price)}</Text>
          {discount > 0 && <Text style={s.oldPrice}>{money(oldPrice)}</Text>}
          {discount > 0 && <Text style={s.off}>{discount}% OFF</Text>}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" style={[s.add, available === false && s.disabled]} onPress={quickAdd} disabled={available === false}>
        <Text style={s.addText}>{available === false ? 'SOLD OUT' : sizes.length ? 'CHOOSE SIZE' : available === null ? 'VIEW DETAILS' : 'QUICK ADD'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {width: '48%', marginBottom: 27},
  media: {position: 'relative', backgroundColor: '#f3f3f1'},
  img: {width: '100%', height: 238, backgroundColor: '#f3f3f1'},
  heart: {position: 'absolute', right: 9, top: 9, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'},
  badge: {position: 'absolute', left: 9, top: 9, backgroundColor: '#111', paddingHorizontal: 7, paddingVertical: 5},
  badgeText: {color: '#fff', fontSize: 8, fontWeight: '900', letterSpacing: 1},
  sold: {position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: '#111'},
  soldText: {color: '#fff', fontSize: 9, fontWeight: '900', textAlign: 'center'},
  cat: {fontSize: 8, letterSpacing: 1.1, color: '#777', marginTop: 9, textTransform: 'uppercase'},
  name: {fontSize: 13, fontWeight: '700', marginTop: 4, minHeight: 34},
  priceRow: {flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginTop: 5},
  price: {fontSize: 13, fontWeight: '900'},
  oldPrice: {fontSize: 11, color: '#999', textDecorationLine: 'line-through'},
  off: {fontSize: 9, fontWeight: '800', color: '#16803b', letterSpacing: 0.4},
  add: {borderWidth: 1, borderColor: '#111', paddingVertical: 11, marginTop: 10, alignItems: 'center', minHeight: 40, justifyContent: 'center'},
  disabled: {borderColor: '#ddd', backgroundColor: '#f6f6f6'},
  addText: {fontSize: 9, fontWeight: '900', letterSpacing: 1},
});
