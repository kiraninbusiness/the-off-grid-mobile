import React,{useCallback,useState} from 'react';
import {ActivityIndicator,Alert,Dimensions,FlatList,Pressable,RefreshControl,StyleSheet,Text,TextInput,View} from 'react-native';
import {Image} from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from 'expo-router';
import {api,uploadReviewPhoto} from '../src/lib/api';

const W=Math.floor((Dimensions.get('window').width-50)/2);
export default function Community(){
 const [tab,setTab]=useState<'trending'|'new'>('trending');
 const [items,setItems]=useState<any[]|null>(null),[mine,setMine]=useState<any[]>([]),[error,setError]=useState(''),[refreshing,setRefreshing]=useState(false);
 const [caption,setCaption]=useState(''),[sharing,setSharing]=useState(false);
 const load=useCallback((refresh=false)=>{setError('');setRefreshing(refresh);api.community(tab).then((d:any)=>setItems(Array.isArray(d)?d:[])).catch((e:any)=>setError(e?.message||'Could not load the feed.')).finally(()=>setRefreshing(false));api.myCommunity().then((d:any)=>setMine(Array.isArray(d)?d:[])).catch(()=>setMine([]))},[tab]);
 useFocusEffect(useCallback(()=>{load()},[load]));
 const share=async()=>{if(sharing)return;try{const res=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:0.7});if(res.canceled||!res.assets?.[0])return;setSharing(true);const a=res.assets[0];const url=await uploadReviewPhoto(a.uri,a.mimeType);const out=await api.shareOutfit(url,caption.trim());setCaption('');Alert.alert('Shared',out?.message||'Your photo will appear once approved.');load()}catch(e:any){Alert.alert('Could not share',e?.message||'Please sign in and try again.')}finally{setSharing(false)}};
 const like=async(p:any)=>{const next=!p.liked;setItems(cur=>(cur||[]).map(x=>x.id===p.id?{...x,liked:next,likes:x.likes+(next?1:-1)}:x));try{await (next?api.likeOutfit(p.id):api.unlikeOutfit(p.id))}catch(e:any){setItems(cur=>(cur||[]).map(x=>x.id===p.id?{...x,liked:p.liked,likes:p.likes}:x));Alert.alert('Sign in to like photos',e?.message||'')}};
 const waiting=mine.filter(m=>m.status==='pending').length;
 return <FlatList style={s.page} contentContainerStyle={s.content} data={items||[]} numColumns={2} columnWrapperStyle={{justifyContent:'space-between'}} keyExtractor={(x:any)=>String(x.id)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)}/>}
  ListHeaderComponent={<View>
   <Text style={s.eyebrow}>THE OFF GRID / COMMUNITY</Text><Text style={s.title}>HOW YOU WEAR IT</Text>
   <TextInput style={s.input} value={caption} onChangeText={setCaption} placeholder="Add a caption (optional)" maxLength={200} accessibilityLabel="Photo caption"/>
   <Pressable accessibilityRole="button" style={s.btn} onPress={share}>{sharing?<ActivityIndicator color="#0A0A0A"/>:<Text style={s.btnText}>SHARE YOUR OUTFIT</Text>}</Pressable>
   {waiting>0?<Text style={s.note}>{waiting} of your photo{waiting===1?' is':'s are'} waiting for approval.</Text>:null}
   <View style={s.tabs}>{(['trending','new'] as const).map(t=><Pressable key={t} accessibilityRole="button" accessibilityState={{selected:tab===t}} onPress={()=>{setItems(null);setTab(t)}} style={[s.tab,tab===t&&s.tabOn]}><Text style={[s.tabText,tab===t&&{color:'#0A0A0A'}]}>{t==='trending'?'TRENDING':'NEWEST'}</Text></Pressable>)}</View>
   {error?<Text style={s.note}>{error}</Text>:null}{!items&&!error?<ActivityIndicator style={{marginTop:20}}/>:null}
  </View>}
  ListEmptyComponent={items?<Text style={s.note}>No photos yet. Be the first to share your outfit.</Text>:null}
  renderItem={({item})=><View style={{width:W,marginBottom:18}}><Image source={{uri:item.image}} style={{width:W,height:W*1.25,backgroundColor:'#2A2A2A'}} contentFit="cover" transition={150}/><View style={s.row}><Text style={s.name} numberOfLines={1}>{item.name}</Text><Pressable accessibilityRole="button" accessibilityLabel={item.liked?'Unlike photo':'Like photo'} hitSlop={8} onPress={()=>like(item)} style={s.likeBtn}><Ionicons name={item.liked?'heart':'heart-outline'} size={17} color={item.liked?'#c0392b':'#111'}/><Text style={s.likes}>{item.likes}</Text></Pressable></View>{item.caption?<Text style={s.cap} numberOfLines={2}>{item.caption}</Text>:null}</View>}/>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0A0A'},content:{padding:20,paddingBottom:60},eyebrow:{fontSize:9,fontFamily:'DMSans-Regular',letterSpacing:1.5,color:'#9A978F'},title:{fontSize:32,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-1.5,marginTop:4,marginBottom:14},input:{borderWidth:1,borderColor:'#3A3A3A',padding:13,fontSize:13,fontFamily:'DMSans-Regular'},btn:{backgroundColor:'#F2F0EA',paddingVertical:15,alignItems:'center',marginTop:10},btnText:{color:'#0A0A0A',fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},note:{fontSize:11,fontFamily:'DMSans-Regular',color:'#A8A59D',marginTop:12,textAlign:'center'},tabs:{flexDirection:'row',gap:8,marginVertical:18},tab:{borderWidth:1,borderColor:'#3A3A3A',paddingHorizontal:14,paddingVertical:10},tabOn:{backgroundColor:'#F2F0EA',borderColor:'#F2F0EA'},tabText:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1,color:'#D6D3CB'},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:8},name:{flex:1,fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:.5},likeBtn:{flexDirection:'row',alignItems:'center',gap:4},likes:{fontSize:11,fontFamily:'DMSans-Bold'},cap:{fontSize:11,fontFamily:'DMSans-Regular',color:'#B5B2AA',marginTop:4,lineHeight:16}});
