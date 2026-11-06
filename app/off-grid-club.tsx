import React,{useCallback,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,ScrollView,Share,StyleSheet,Text,TextInput,View} from 'react-native';
import {useFocusEffect,useRouter} from 'expo-router';
import {api} from '../src/lib/api';

const REASONS:Record<string,string>={purchase:'Order points',referral:'Friend joined and ordered',birthday:'Birthday reward',redeemed:'Used at checkout',refunded:'Points returned'};
const reasonLabel=(r:string)=>REASONS[r]||(r.endsWith('_bonus')?`${r.replace('_bonus','').toUpperCase()} tier bonus`:r);
const inr=(n:number)=>`₹${Number(n||0).toLocaleString('en-IN')}`;

export default function OffGridClub(){
 const r=useRouter();
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[dob,setDob]=useState(''),[saving,setSaving]=useState(false);
 const load=useCallback(()=>{setError('');api.customerClub().then((d:any)=>{setData(d);if(d?.birthday_points_granted)Alert.alert('Happy birthday! 🎉',`${d.birthday_points_granted} bonus points were added to your account.`)}).catch((e:any)=>setError(e?.message||'Please sign in to see your membership.'))},[]);
 useFocusEffect(load);
 const saveBirthday=async()=>{if(saving)return;setSaving(true);try{await api.setBirthday(dob.trim());setDob('');load()}catch(e:any){Alert.alert('Birthday not saved',e?.message||'Try again.')}finally{setSaving(false)}};
 const invite=()=>Share.share({message:`Join me at The Off Grid. Use my code ${data?.referral_code} when you sign up.`}).catch(()=>{});
 if(error)return <View style={s.center}><Text style={s.err}>{error}</Text><Pressable style={s.btn} onPress={load}><Text style={s.btnText}>TRY AGAIN</Text></Pressable><Pressable onPress={()=>r.back()}><Text style={[s.link,{color:'#FFFFFF'}]}>GO BACK</Text></Pressable></View>;
 if(!data)return <ActivityIndicator style={{marginTop:80}}/>;
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Text style={s.eyebrow}>THE OFF GRID</Text><Text style={[s.title,{color:'#FFFFFF'}]}>OFF GRID CLUB</Text>
  <View style={s.card}>
   <Text style={[s.small,{color:'#FFFFFF'}]}>YOUR TIER</Text><Text style={[s.tier,{color:'#FFFFFF'}]}>{String(data.name).toUpperCase()}</Text>
   <Text style={[s.points,{color:'#FFFFFF'}]}>{Number(data.points).toLocaleString('en-IN')} POINTS · {data.multiplier}x EARNING</Text>
   <View style={s.track}><View style={[s.fill,{width:`${data.percent_to_next}%`}]}/></View>
   <Text style={s.note}>{data.next_tier?`Spend ${inr(data.spend_to_next)} more on delivered orders to reach ${String(data.next_tier).toUpperCase()}.`:'You are at the top tier. Thank you for being part of the Club.'}</Text>
  </View>
  <Text style={[s.section,{color:'#FFFFFF'}]}>YOUR PERKS</Text>
  {(data.perks||[]).map((p:string)=><Text key={p} style={s.perk}>✓  {p}</Text>)}
  <Text style={[s.section,{color:'#FFFFFF'}]}>ALL TIERS</Text>
  {(data.tiers||[]).map((t:any)=><View key={t.key} style={[s.tierRow,t.key===data.tier&&s.tierRowOn]}><Text style={[s.tierName,{color:'#FFFFFF'}]}>{String(t.name).toUpperCase()}</Text><Text style={s.tierMeta}>{t.min_spend?`${inr(t.min_spend)}+`:'Start here'} · {t.multiplier}x points</Text></View>)}
  <Text style={[s.section,{color:'#FFFFFF'}]}>BIRTHDAY REWARD</Text>
  {data.birthday?<Text style={s.note}>Your birthday is saved. You get {data.birthday_reward_points} points every year in your birthday month.</Text>:<><Text style={s.note}>Add your date of birth to get {data.birthday_reward_points} points every birthday month. It can be saved only once.</Text><View style={s.row}><TextInput style={[s.input,{color:'#FFFFFF'}]} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" maxLength={10} keyboardType="numbers-and-punctuation" accessibilityLabel="Date of birth"/><Pressable style={[s.btn,{marginTop:0}]} onPress={saveBirthday}>{saving?<ActivityIndicator color="#0A0A0A"/>:<Text style={s.btnText}>SAVE</Text>}</Pressable></View></>}
  <Text style={[s.section,{color:'#FFFFFF'}]}>REFER A FRIEND</Text>
  <Text style={s.note}>You earn 100 points when a friend you refer completes their first order. {Number(data.referral_count)||0} friend{data.referral_count===1?'':'s'} joined so far.</Text>
  <Pressable style={s.btn} onPress={invite}><Text style={s.btnText}>SHARE CODE {data.referral_code}</Text></Pressable>
  <Text style={[s.section,{color:'#FFFFFF'}]}>POINTS HISTORY</Text>
  {(data.history||[]).length===0?<Text style={s.note}>Your points activity will show up here after your first order.</Text>:data.history.map((h:any)=><View key={h.id} style={s.hist}><View style={{flex:1}}><Text style={s.histTitle}>{reasonLabel(h.reason)}</Text><Text style={s.histDate}>{new Date(h.created_at).toLocaleDateString('en-IN')}</Text></View><Text style={[s.delta,{color:'#5FD38A'},h.delta<0&&{color:'#FF6B62'}]}>{h.delta>0?'+':''}{h.delta}</Text></View>)}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0A0A'},content:{padding:22,paddingBottom:60},center:{flex:1,alignItems:'center',justifyContent:'center',padding:30,backgroundColor:'#0A0A0A'},err:{fontSize:12,fontFamily:'DMSans-Regular',color:'#A8A59D',textAlign:'center',marginBottom:14},link:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1,marginTop:16},eyebrow:{fontSize:9,fontFamily:'DMSans-Regular',color:'#9A978F',letterSpacing:1.5},title:{fontSize:36,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-1.5,marginTop:4,marginBottom:18},card:{backgroundColor:'#141414',padding:20,borderWidth:1,borderColor:'#2A2A2A'},small:{fontSize:9,fontFamily:'DMSans-Regular',color:'#77746E',letterSpacing:1.4},tier:{fontSize:34,fontFamily:'SpaceGrotesk-Bold',color:'#0A0A0A',letterSpacing:-1,marginTop:4},points:{fontSize:10,fontFamily:'DMSans-Regular',color:'#44413D',letterSpacing:1,marginTop:6},track:{height:6,backgroundColor:'#333',marginTop:16},fill:{height:6,backgroundColor:'#0A0A0A'},note:{fontSize:12,fontFamily:'DMSans-Regular',color:'#A8A59D',lineHeight:18,marginTop:10},section:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.4,marginTop:28,marginBottom:6},perk:{fontSize:12,fontFamily:'DMSans-Regular',color:'#D6D3CB',marginTop:8},tierRow:{padding:13,borderWidth:1,borderColor:'#2A2A2A',marginTop:8},tierRowOn:{borderColor:'#F2F0EA',backgroundColor:'#141414'},tierName:{fontSize:11,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},tierMeta:{fontSize:11,fontFamily:'DMSans-Regular',color:'#9A978F',marginTop:3},row:{flexDirection:'row',gap:10,marginTop:12,alignItems:'center'},input:{flex:1,borderWidth:1,borderColor:'#3A3A3A',padding:13,fontSize:13,fontFamily:'DMSans-Regular'},btn:{backgroundColor:'#F2F0EA',paddingVertical:15,paddingHorizontal:20,alignItems:'center',marginTop:14},btnText:{color:'#0A0A0A',fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},hist:{flexDirection:'row',alignItems:'center',paddingVertical:12,borderTopWidth:1,borderTopColor:'#2A2A2A'},histTitle:{fontSize:12,fontFamily:'DMSans-Bold',color:'#E6E3DC'},histDate:{fontSize:9,fontFamily:'DMSans-Regular',color:'#8A877F',marginTop:3},delta:{fontSize:14,fontFamily:'SpaceGrotesk-Bold',color:'#1a7a3a'}});
