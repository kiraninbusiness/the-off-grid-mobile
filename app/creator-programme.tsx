import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/lib/api';
import { useStore } from '../src/store/store';

const platforms = ['instagram', 'youtube', 'tiktok'] as const;
const statusCopy: Record<string, string> = {
  pending: 'Your application is in review. We will update this page when the team has made a decision.',
  approved: 'Your creator application has been approved. The team will share programme participation details separately.',
  rejected: 'Your application was not approved at this time. Read the team note below before contacting support.',
  paused: 'Your creator programme status is currently paused. Contact support if you need clarification.'
};

export default function CreatorProgramme() {
  const router = useRouter();
  const { user } = useStore();
  const [application, setApplication] = useState<any>(null);
  const [platform, setPlatform] = useState<(typeof platforms)[number]>('instagram');
  const [handle, setHandle] = useState('');
  const [secondary, setSecondary] = useState('');
  const [followers, setFollowers] = useState('');
  const [audience, setAudience] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setApplication(await api.creatorApplication()); }
    catch (e: any) { setError(e?.message || 'Could not load your application.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const submit = async () => {
    if (busy) return;
    const count = Number(followers);
    if (!handle.trim() || !Number.isInteger(count) || count < 0 || !audience.trim() || bio.trim().length < 20) {
      setError('Complete your profile handle, valid follower count, audience and a bio of at least 20 characters.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api.applyCreator({
        platform, handle: handle.trim(), secondary_handle: secondary.trim(),
        follower_count: count, audience: audience.trim(), bio: bio.trim()
      });
      setApplication(result); setNotice('Your creator application has been submitted.');
    } catch (e: any) {
      setError(e?.application?.message || e?.message || 'Could not submit your application.');
      if (e?.application) setApplication(e.application);
      else if (e?.status === 409) await load();
    } finally { setBusy(false); }
  };

  if (!user) return <View style={s.center}><Text style={s.title}>CREATOR PROGRAMME</Text><Text style={s.copy}>Sign in to apply to The Off Grid Creator Programme.</Text><Pressable style={s.button} onPress={() => router.push('/(tabs)/profile' as any)}><Text style={s.buttonText}>SIGN IN</Text></Pressable></View>;

  return <ScrollView style={s.page} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>THE OFF GRID / COMMUNITY</Text>
    <Text style={s.title}>CREATOR{ '\n' }PROGRAMME</Text>
    <Text style={s.copy}>Create with the brand, share your style and build with our community. Tell us about your public social profile and the audience you reach.</Text>
    <View style={s.info}><Text style={s.infoTitle}>HOW IT WORKS</Text><Text style={s.infoText}>1. Submit your public creator profile.{ '\n' }2. Our team reviews your application.{ '\n' }3. If approved, we contact you with the next steps.</Text></View>
    {!!error && <Text style={s.error}>{error}</Text>}
    {!!notice && <Text style={s.notice}>{notice}</Text>}
    {loading ? <ActivityIndicator style={{marginTop:30}} color="#F2F0EA"/> : application ? <View style={s.card}>
      <Text style={s.label}>APPLICATION STATUS</Text>
      <Text style={s.status}>{String(application.status || 'pending').toUpperCase()}</Text>
      <Text style={s.copy}>{statusCopy[application.status] || 'Your application has been received.'}</Text>
      <Text style={s.detail}>{String(application.platform || '').toUpperCase()} · @{application.handle}</Text>
      <Text style={s.detail}>{Number(application.follower_count || 0).toLocaleString('en-IN')} followers</Text>
      {!!application.admin_note && <><Text style={s.label}>TEAM NOTE</Text><Text style={s.copy}>{application.admin_note}</Text></>}
      <Text style={s.fine}>One application is allowed per account. If your profile details change, contact support.</Text>
    </View> : <>
      <Text style={s.label}>MAIN PLATFORM</Text>
      <View style={s.pills}>{platforms.map(p => <Pressable key={p} onPress={() => setPlatform(p)} style={[s.pill, platform === p && s.pillActive]}><Text style={[s.pillText, platform === p && s.pillTextActive]}>{p.toUpperCase()}</Text></Pressable>)}</View>
      <Text style={s.label}>PUBLIC HANDLE</Text>
      <TextInput style={s.input} value={handle} onChangeText={setHandle} autoCapitalize="none" placeholder="@yourhandle" placeholderTextColor="#8A877F" maxLength={80}/>
      <Text style={s.label}>SECONDARY HANDLE (OPTIONAL)</Text>
      <TextInput style={s.input} value={secondary} onChangeText={setSecondary} autoCapitalize="none" placeholder="@anotherprofile" placeholderTextColor="#8A877F" maxLength={80}/>
      <Text style={s.label}>FOLLOWER COUNT</Text>
      <TextInput style={s.input} value={followers} onChangeText={setFollowers} keyboardType="number-pad" placeholder="e.g. 12500" placeholderTextColor="#8A877F" maxLength={10}/>
      <Text style={s.label}>WHO IS YOUR AUDIENCE?</Text>
      <TextInput style={s.input} value={audience} onChangeText={setAudience} placeholder="e.g. Indian streetwear and menswear enthusiasts" placeholderTextColor="#8A877F" maxLength={80}/>
      <Text style={s.label}>TELL US ABOUT YOUR CONTENT</Text>
      <TextInput style={[s.input,s.bio]} value={bio} onChangeText={setBio} multiline textAlignVertical="top" placeholder="Your content style, audience engagement and why you want to collaborate (20–600 characters)" placeholderTextColor="#8A877F" maxLength={600}/>
      <Pressable disabled={busy} style={[s.button,busy&&{opacity:.6}]} onPress={submit}>{busy?<ActivityIndicator color="#0A0A0A"/>:<Text style={s.buttonText}>SUBMIT APPLICATION</Text>}</Pressable>
      <Text style={s.fine}>Submitting an application does not guarantee approval, paid collaborations or commission. We do not collect bank or payout details in this application.</Text>
    </>}
  </ScrollView>;
}

const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#0A0A0A'},content:{padding:24,paddingTop:48,paddingBottom:50},
  center:{flex:1,justifyContent:'center',padding:28,backgroundColor:'#0A0A0A'},eyebrow:{fontSize:9,fontFamily:'DMSans-Regular',letterSpacing:1.5,color:'#9A978F'},
  title:{fontSize:40,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-2,lineHeight:41,color:'#F2F0EA',marginTop:8},
  copy:{fontSize:12,fontFamily:'DMSans-Regular',color:'#A8A59D',lineHeight:19,marginTop:12},info:{backgroundColor:'#F2F0EA',padding:17,marginTop:24,marginBottom:22},
  infoTitle:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.2,color:'#0A0A0A'},infoText:{fontSize:11,fontFamily:'DMSans-Regular',lineHeight:19,color:'#44413D',marginTop:9},
  label:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.2,color:'#D6D3CB',marginTop:19,marginBottom:8},
  pills: { flexDirection: 'row', gap: 8 }, pill: { borderWidth: 1, borderColor: '#2A2A2A', paddingVertical: 12, paddingHorizontal: 15 }, pillActive: { backgroundColor: '#F2F0EA', borderColor: '#F2F0EA' },
  pillText:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',color:'#D6D3CB'},pillTextActive:{color:'#0A0A0A'},
  input:{borderBottomWidth:1,borderBottomColor:'#444',paddingVertical:12,fontSize:13,fontFamily:'DMSans-Regular',color:'#F2F0EA'},bio:{minHeight:110,borderWidth:1,borderColor:'#444',padding:12,marginTop:3},
  button:{backgroundColor:'#F2F0EA',padding:16,alignItems:'center',justifyContent:'center',minHeight:50,marginTop:24},
  buttonText:{fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1,color:'#0A0A0A'},fine:{fontSize:10,fontFamily:'DMSans-Regular',color:'#8F8C85',lineHeight:16,marginTop:14},
  error:{color:'#9f2525',backgroundColor:'#2A1210',padding:12,marginTop:14,fontSize:11,fontFamily:'DMSans-Regular'},notice:{color:'#5FD38A',backgroundColor:'#0F2A18',padding:12,marginTop:14,fontSize:11,fontFamily:'DMSans-Regular'},
  card:{borderWidth:1,borderColor:'#2A2A2A',padding:18,marginTop:25},status:{fontSize:25,fontFamily:'SpaceGrotesk-Bold',color:'#F2F0EA',marginTop:4},
  detail:{fontSize:11,color:'#D6D3CB',marginTop:9,fontFamily:'DMSans-Bold'}
});
