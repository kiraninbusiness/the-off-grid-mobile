import React, {useEffect, useRef} from 'react';
import {Animated, View, StyleSheet, DimensionValue, ViewStyle} from 'react-native';

// A grey block that gently pulses while real content loads.
export function SkeletonBlock({width = '100%', height, style}: {width?: DimensionValue; height: number; style?: ViewStyle}) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 1, duration: 700, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.45, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{width, height, backgroundColor: '#e7e7e4', opacity}, style]} />;
}

// Placeholder shaped like a product card (image, name, price).
export function ProductCardSkeleton() {
  return (
    <View style={s.card}>
      <SkeletonBlock height={230} />
      <SkeletonBlock width="75%" height={10} style={{marginTop: 12}} />
      <SkeletonBlock width="40%" height={10} style={{marginTop: 8}} />
    </View>
  );
}

// A grid of placeholder cards, two per row like the shop.
export function ProductGridSkeleton({count = 6}: {count?: number}) {
  return (
    <View accessibilityLabel="Loading products" accessibilityLiveRegion="polite" style={s.grid}>
      {Array.from({length: count}, (_, i) => <ProductCardSkeleton key={i} />)}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8},
  card: {width: '48%', marginBottom: 30},
});
