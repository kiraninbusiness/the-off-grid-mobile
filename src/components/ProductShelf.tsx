import React from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import ProductCard from './ProductCard';

// A titled, horizontally scrolling row of products (New arrivals, On sale…).
export default function ProductShelf({title, hint, items, onSeeAll}: {title: string; hint?: string; items: any[]; onSeeAll?: () => void}) {
  if (!items.length) return null;
  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <View style={{flex: 1}}>
          <Text style={s.title}>{title}</Text>
          {!!hint && <Text style={s.hint}>{hint}</Text>}
        </View>
        {onSeeAll ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`See all ${title.toLowerCase()}`} onPress={onSeeAll} hitSlop={8}>
            <Text style={s.all}>VIEW ALL →</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(p: any) => String(p.id)}
        renderItem={({item}) => <ProductCard p={item} width={158} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{width: 12}} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {marginBottom: 6},
  head: {flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 22, marginBottom: 14},
  title: {fontSize: 18, fontWeight: '900', letterSpacing: -0.4},
  hint: {fontSize: 10, color: '#777', letterSpacing: 1, marginTop: 3},
  all: {fontSize: 9, fontWeight: '900', letterSpacing: 1.1, textDecorationLine: 'underline'},
  list: {paddingHorizontal: 22},
});
