import React,{useState} from 'react';
import {ActivityIndicator,Dimensions,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import ProductCard from '../src/components/ProductCard';
import {api} from '../src/lib/api';

const W=Math.floor((Dimensions.get('window').width-50)/2);
const BUDGETS=[1000,2000,3000,5000];
const FOR=[{k:'any',l:'ANYONE'},{k:'men',l:'HIM'},{k:'women',l:'HER'}];
export default function GiftIdeas(){
 const [budget,setBudget]=useState('2000'),[who,setWho]=useState('any'),[items,setItems]=useState<any[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const find=async(b=budget,w=who)=>{if(busy)return;setBusy(true);setError('');try{const d:any=await api.giftIdeas(Number(b),w);setItems(Array.isArray(d)?d:[])}catch(e:any){setItems(null);setError(e?.message||'Please sign in to see gift ideas.')}finally{setBusy(false)}};
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Text style={s.eyebrow}>THE OFF GRID / GIFTS</Text><Text style={s.title}>GIFT IDEAS</Text>
  <Text style={s.sub}>Tell us who it is for and your budget. Add premium packaging with a card at checkout.</Text>
  <Text style={s.label}>WHO IS IT FOR?</Text>
  <View style={s.row}>{FOR.map(f=><Pressable key={f.k} accessibilityRole="radio" accessibilityState={{selected:who===f.k}} onPress={()=>setWho(f.k)} style={[s.chip,who===f.k&&s.chipOn]}><Text style={[s.chipText,who===f.k&&{color:'#0A0A0A'}]}>{f.l}</Text></Pressable>)}</View>
  <Text style={s.label}>BUDGET (₹)</Text>
  <View style={s.row}>{BUDGETS.map(b=><Pressable key={b} accessibilityRole="radio" accessibilityState={{selected:budget===String(b)}} onPress={()=>setBudget(String(b))} style={[s.chip,budget===String(b)&&s.chipOn]}><Text style={[s.chipText,budget===String(b)&&{color:'#0A0A0A'}]}>{b.toLocaleString('en-IN')}</Text></Pressable>)}</View>
  <TextInput style={s.input} value={budget} onChangeText={t=>setBudget(t.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad" accessibilityLabel="Budget in rupees"/>
  <Pressable accessibilityRole="button" style={s.btn} onPress={()=>find()}>{busy?<ActivityIndicator color="#0A0A0A"/>:<Text style={s.btnText}>SHOW GIFT IDEAS</Text>}</Pressable>
  {error?<Text style={s.note}>{error}</Text>:null}
  {items&&items.length===0?<Text style={s.note}>Nothing in stock at that budget right now. Try a higher amount.</Text>:null}
  <View style={s.grid}>{(items||[]).map(p=><ProductCard key={p.id} p={p} width={W}/>)}</View>
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0A0A'},content:{padding:20,paddingBottom:60},eyebrow:{fontSize:9,fontFamily:'DMSans-Regular',letterSpacing:1.5,color:'#9A978F'},title:{fontSize:34,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-1.5,marginTop:4},sub:{fontSize:12,fontFamily:'DMSans-Regular',lineHeight:19,color:'#9A978F',marginTop:8,marginBottom:18},label:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.3,marginTop:10,marginBottom:8},row:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderColor:'#3A3A3A',paddingHorizontal:14,paddingVertical:11},chipOn:{backgroundColor:'#F2F0EA',borderColor:'#F2F0EA'},chipText:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.8,color:'#D6D3CB'},input:{borderWidth:1,borderColor:'#3A3A3A',padding:13,fontSize:14,fontFamily:'DMSans-Regular',marginTop:12},btn:{backgroundColor:'#F2F0EA',paddingVertical:15,alignItems:'center',marginTop:12},btnText:{color:'#0A0A0A',fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},note:{fontSize:12,fontFamily:'DMSans-Regular',color:'#A8A59D',textAlign:'center',marginTop:18},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',marginTop:20}});
