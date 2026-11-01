import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent} from 'react-native';

import {Image} from 'expo-image';

export type HeroSlide = {key: string; image: string; kicker: string; title: string; copy: string; cta: string; onPress: () => void};

// Full-width banners that swipe and also advance by themselves every few seconds.
export default function HeroCarousel({slides, height = 570, intervalMs = 5000}: {slides: HeroSlide[]; height?: number; intervalMs?: number}) {
  const {width} = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const touching = useRef(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      if (touching.current) return;
      setPage(p => {
        const next = (p + 1) % count;
        ref.current?.scrollTo({x: next * width, animated: true});
        return next;
      });
    }, intervalMs);
    return () => clearInterval(t);
  }, [count, width, intervalMs]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    touching.current = false;
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (!count) return null;
  return (
    <View style={{height, backgroundColor: '#171717'}}>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScrollBeginDrag={() => { touching.current = true; }} onMomentumScrollEnd={onEnd} decelerationRate="fast">
        {slides.map(sl => (
          <Pressable key={sl.key} accessibilityRole="button" accessibilityLabel={`${sl.title.replace(/\n/g, ' ')}. ${sl.cta}`} onPress={sl.onPress} style={{width, height}}>
            <Image source={{uri: sl.image}} style={s.img} contentFit="cover" transition={200} cachePolicy="memory-disk" />
            <View style={s.overlay}>
              <Text style={s.kicker}>{sl.kicker}</Text>
              <Text style={s.title} numberOfLines={3}>{sl.title}</Text>
              <Text style={s.copy}>{sl.copy}</Text>
              <View style={s.btn}><Text style={s.btnText}>{sl.cta}</Text></View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      {count > 1 && (
        <View style={s.dots} pointerEvents="none">
          {slides.map((sl, i) => <View key={sl.key} style={[s.dot, i === page && s.dotOn]} />)}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  img: {width: '100%', height: '100%', opacity: 0.68},
  overlay: {position: 'absolute', left: 24, right: 24, bottom: 52},
  kicker: {color: '#ddd', fontSize: 9, letterSpacing: 1.6, fontWeight: '800'},
  title: {color: '#fff', fontSize: 44, lineHeight: 44, fontWeight: '900', letterSpacing: -2, marginTop: 10},
  copy: {color: '#eee', fontSize: 12, marginTop: 10, marginBottom: 18},
  btn: {backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 20, alignSelf: 'flex-start', borderRadius: 2},
  btnText: {fontSize: 10, fontWeight: '900', letterSpacing: 1},
  dots: {position: 'absolute', left: 0, right: 0, bottom: 20, flexDirection: 'row', justifyContent: 'center', gap: 6},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.4)'},
  dotOn: {width: 18, backgroundColor: '#fff'},
});
