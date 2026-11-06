import React from 'react';
import {Platform,StyleSheet,Text,View} from 'react-native';

// The Off Grid wordmark as on the website: a small spaced "THE" over a heavy condensed
// "OFF" (in the text colour) and "GRID" (brand red).
export const BRAND_RED='#FF3B30';
const CONDENSED='SpaceGrotesk-Bold';

export default function BrandMark({size=30,color='#111'}:{size?:number,color?:string}){
 return <View accessible accessibilityRole="header" accessibilityLabel="The Off Grid" style={s.wrap}>
  <Text style={[s.the,{color,fontSize:Math.round(size*0.3),letterSpacing:size*0.2,marginLeft:size*0.08}]}>THE</Text>
  <Text style={[s.word,{fontSize:size,lineHeight:Math.round(size*1.02),letterSpacing:-size*0.04}]}><Text style={{color}}>OFF</Text><Text style={{color:BRAND_RED}}>GRID</Text></Text>
 </View>
}
const s=StyleSheet.create({
 wrap:{alignSelf:'flex-start'},
 the:{fontFamily:'SpaceGrotesk-Medium',includeFontPadding:false},
 word:{fontFamily:CONDENSED,includeFontPadding:false,marginTop:-2},
});
