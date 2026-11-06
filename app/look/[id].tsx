import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Dimensions,Pressable,ScrollView,Share,StyleSheet,Text,View} from 'react-native';
import {Image} from 'expo-image';
import {useLocalSearchParams,useRouter} from 'expo-router';
import ProductCard from '../../src/components/ProductCard';
import {api} from '../../src/lib/api';

const cardW=Math.floor((Dimensions.get('window').width-50)/2);
const money=(v:any)=>`₹${Number(v||0).toLocaleString('en-IN')}`;
export default function Look(){
 const {id}=useLocalSearchParams<{id:string}>(); const r=useRouter();
 const [look,setLook]=useState<any>(null),[error,setError]=useState('');
 useEffect(()=>{let alive=true;setLook(null);setError('');api.look(String(id||'')).then((d:any)=>{if(alive)setLook(d)}).catch((e:any)=>{if(alive)setError(e?.message||'This look is not available.')});return()=>{alive=false}},[id]);
 if(error)return <View style={s.center}><Text style={s.note}>{error}</Text><Pressable style={s.btn} onPress={()=>r.back()}><Text style={s.btnText}>GO BACK</Text></Pressable></View>;
 if(!look)return <ActivityIndicator style={{marginTop:80}}/>;
 const products:any[]=look.products||[];
 const total=products.reduce((n,p)=>n+Number(p.price||0),0);
 const share=()=>Share.share({message:`${look.title} on The Off Grid: ${products.map(p=>p.name).join(', ')}. Total ${money(total)}.`}).catch(()=>{});
 return <ScrollView style={s.page} contentContainerStyle={{paddingBottom:60}}>
  <Image source={{uri:look.image}} style={s.cover} contentFit="cover"/>
  <View style={s.body}>
   <Text style={[s.title,{color:'#FFFFFF'}]}>{String(look.title).toUpperCase()}</Text>
   {look.creator?<Text style={s.by}>STYLED BY {String(look.creator).toUpperCase()}</Text>:null}
   {look.description?<Text style={s.desc}>{look.description}</Text>:null}
   <Text style={[s.total,{color:'#FFFFFF'}]}>COMPLETE THE LOOK · {money(total)}</Text>
   <Pressable accessibilityRole="button" style={s.btn} onPress={share}><Text style={s.btnText}>SHARE THIS LOOK</Text></Pressable>
   <View style={s.grid}>{products.map(p=><ProductCard key={p.id} p={p} width={cardW}/>)}</View>
  </View>
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0A0A'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:30},note:{fontSize:12,fontFamily:'DMSans-Regular',color:'#A8A59D',textAlign:'center'},cover:{width:'100%',aspectRatio:0.85,backgroundColor:'#2A2A2A'},body:{padding:20},title:{fontSize:28,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-1},by:{fontSize:9,fontFamily:'DMSans-Regular',color:'#9A978F',letterSpacing:1.3,marginTop:6},desc:{fontSize:12,fontFamily:'DMSans-Regular',lineHeight:19,color:'#B5B2AA',marginTop:10},total:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1,marginTop:18},btn:{backgroundColor:'#F2F0EA',paddingVertical:15,alignItems:'center',marginTop:14,paddingHorizontal:22},btnText:{color:'#0A0A0A',fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',marginTop:20}});
