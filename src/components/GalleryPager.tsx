import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Image, ScrollView, Pressable, StyleSheet, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

// Swipeable product photos with page dots. Tapping opens the full-screen view.
export default function GalleryPager({images, active, onChange, onOpen, height = 520}: {images: string[]; active: string; onChange: (uri: string) => void; onOpen: () => void; height?: number}) {
  const {width} = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const activeIndex = Math.max(0, images.indexOf(active));
  const [page, setPage] = useState(activeIndex);

  // Keep the pager in step when a thumbnail is tapped.
  useEffect(() => {
    setPage(activeIndex);
    ref.current?.scrollTo({x: activeIndex * width, animated: true});
  }, [activeIndex, width]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page && images[next]) {
      setPage(next);
      onChange(images[next]);
    }
  };

  return (
    <View>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onEnd} scrollEventThrottle={16} decelerationRate="fast">
        {images.map((uri, i) => (
          <Pressable key={`${uri}-${i}`} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Product image ${i + 1} of ${images.length}. Open full screen`}>
            <Image source={{uri}} style={{width, height}} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.badge}>
        <Ionicons name="expand-outline" size={13} />
        <Text style={s.badgeText}>VIEW IMAGE</Text>
      </View>
      {images.length > 1 && (
        <View style={s.dots} pointerEvents="none">
          {images.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotActive]} />)}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  badge: {position: 'absolute', right: 14, bottom: 14, backgroundColor: 'rgba(255,255,255,.94)', paddingHorizontal: 11, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 2},
  badgeText: {fontSize: 8, fontWeight: '900', letterSpacing: 1.1, color: '#111'},
  dots: {position: 'absolute', left: 0, right: 0, bottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 6},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(17,17,17,.28)'},
  dotActive: {width: 18, backgroundColor: '#111'},
});
