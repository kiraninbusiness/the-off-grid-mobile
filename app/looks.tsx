import React,{useCallback,useState} from 'react';
import {ActivityIndicator,FlatList,Pressable,RefreshControl,StyleSheet,Text,View} from 'react-native';
import {Image} from 'expo-image';
import {useFocusEffect,useRouter} from 'expo-router';
import {api} from '../src/lib/api';

export default function Looks(){
 const r=useRouter();
 const [items,setItems]=useState<any[]|null>(null),[error,setError]=useState(''),[refreshing,setRefreshing]=useState(false);
 const load=useCallback((refresh=false)=>{setError('');setRefreshing(refresh);api.looks().then((d:any)=>setItems(Array.isArray(d)?d:[])).catch((e:any)=>setError(e?.message||'Could not load looks.')).finally(()=>setRefreshing(false))},[]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 if(error&&!items)return <View style={s.center}><Text style={s.note}>{error}</Text><Pressable style={s.btn} onPress={()=>load()}><Text style={s.btnText}>TRY AGAIN</Text></Pressable></View>;
 if(!items)return <ActivityIndicator style={{marginTop:80}}/>;
 return <FlatList style={s.page} contentContainerStyle={s.content} data={items} keyExtractor={(x:any)=>String(x.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)}/>}
  ListHeaderComponent={<View><Text style={s.eyebrow}>THE OFF GRID / STYLE</Text><Text style={s.title}>SHOP THE LOOK</Text><Text style={s.sub}>Complete outfits, put together by our team. Tap a look to shop every piece.</Text></View>}
  ListEmptyComponent={<Text style={s.note}>New looks are on the way. Check back soon.</Text>}
  renderItem={({item})=><Pressable accessibilityRole="button" accessibilityLabel={`Open look ${item.title}`} style={s.card} onPress={()=>r.push(`/look/${item.id}` as any)}>
   <Image source={{uri:item.image}} style={s.cover} contentFit="cover" transition={150}/>
   <View style={s.meta}><Text style={s.name}>{String(item.title).toUpperCase()}</Text><Text style={s.count}>{item.products.length} PIECES{item.creator?` · BY ${String(item.creator).toUpperCase()}`:''}</Text></View>
  </Pressable>}/>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#fff'},content:{padding:20,paddingBottom:60},center:{flex:1,alignItems:'center',justifyContent:'center',padding:30},eyebrow:{fontSize:9,letterSpacing:1.5,color:'#777'},title:{fontSize:34,fontWeight:'900',letterSpacing:-1.5,marginTop:4},sub:{fontSize:12,lineHeight:19,color:'#777',marginTop:8,marginBottom:20},note:{fontSize:12,color:'#666',textAlign:'center',marginTop:30},card:{marginBottom:22},cover:{width:'100%',aspectRatio:0.8,backgroundColor:'#eee'},meta:{marginTop:10},name:{fontSize:14,fontWeight:'900',letterSpacing:.5},count:{fontSize:9,color:'#777',letterSpacing:1.2,marginTop:4},btn:{backgroundColor:'#111',paddingHorizontal:22,paddingVertical:14,marginTop:16},btnText:{color:'#fff',fontSize:10,fontWeight:'900',letterSpacing:1}});
