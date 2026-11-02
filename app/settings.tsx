import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, ThemePreference } from '../src/theme/ThemeProvider';
import { openSitePage, PRIVACY_PATH, TERMS_PATH } from '../src/lib/links';

const choices: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap; detail: string }[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline', detail: 'A clean, bright look.' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline', detail: 'A deep, low-light look.' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline', detail: 'Follow your device appearance.' },
];

export default function SettingsScreen() {
  const { preference, setPreference, colors } = useAppTheme();
  const router = useRouter();
  const Row = ({ title, subtitle, icon, onPress }: { title: string; subtitle?: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.row, { borderBottomColor: colors.border, opacity: pressed ? 0.72 : 1 }]}>
      <View style={[s.icon, { backgroundColor: colors.surface }]}><Ionicons name={icon} size={18} color={colors.text} /></View>
      <View style={s.rowCopy}><Text style={[s.rowTitle, { color: colors.text }]}>{title}</Text>{!!subtitle && <Text style={[s.rowSubtitle, { color: colors.muted }]}>{subtitle}</Text>}</View>
      <Ionicons name="chevron-forward" size={17} color={colors.muted} />
    </Pressable>
  );
  return (
    <ScrollView style={[s.page, { backgroundColor: colors.background }]} contentContainerStyle={s.content}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={20} color={colors.text}/><Text style={[s.backText,{color:colors.text}]}>BACK</Text></Pressable>
      <Text style={[s.eyebrow,{color:colors.muted}]}>THE OFF GRID / PREFERENCES</Text>
      <Text style={[s.title,{color:colors.text}]}>SETTINGS</Text>
      <Text style={[s.intro,{color:colors.muted}]}>Make the app feel right for you.</Text>
      <Text style={[s.section,{color:colors.text}]}>APPEARANCE</Text>
      <View style={[s.panel,{backgroundColor:colors.card,borderColor:colors.border}]}>
        {choices.map((choice) => {
          const selected = preference === choice.key;
          return <Pressable key={choice.key} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setPreference(choice.key)} style={[s.choice,{borderBottomColor:colors.border}]}>
            <View style={[s.choiceIcon,{backgroundColor:selected?colors.text:colors.surface}]}><Ionicons name={choice.icon} size={18} color={selected?colors.background:colors.text}/></View>
            <View style={s.rowCopy}><Text style={[s.rowTitle,{color:colors.text}]}>{choice.label}</Text><Text style={[s.rowSubtitle,{color:colors.muted}]}>{choice.detail}</Text></View>
            <Ionicons name={selected?'radio-button-on':'radio-button-off'} size={20} color={colors.text}/>
          </Pressable>;
        })}
      </View>
      <Text style={[s.section,{color:colors.text}]}>SUPPORT & LEGAL</Text>
      <View style={[s.panel,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Row title="Help & Support" subtitle="Get assistance with your order or account." icon="help-circle-outline" onPress={() => router.push('/support' as any)} />
        <Row title="Privacy Policy" icon="shield-checkmark-outline" onPress={() => openSitePage(PRIVACY_PATH)} />
        <Row title="Terms of Service" icon="document-text-outline" onPress={() => openSitePage(TERMS_PATH)} />
      </View>
      <Text style={[s.section,{color:colors.text}]}>ABOUT</Text>
      <View style={[s.panel,s.about,{backgroundColor:colors.card,borderColor:colors.border}]}>
        <Text style={[s.brand,{color:colors.text}]}>THE OFF GRID</Text>
        <Text style={[s.rowSubtitle,{color:colors.muted}]}>Version {Constants.expoConfig?.version || '3.0.0'}</Text>
        <Text style={[s.rowSubtitle,{color:colors.muted,marginTop:8}]}>Independent style. Uncompromising essentials.</Text>
      </View>
    </ScrollView>
  );
}
const s=StyleSheet.create({
 page:{flex:1},content:{padding:22,paddingTop:18,paddingBottom:48},back:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:10,marginBottom:26},backText:{fontSize:10,fontWeight:'800',letterSpacing:1.2},eyebrow:{fontSize:9,fontWeight:'800',letterSpacing:2},title:{fontSize:36,fontWeight:'900',letterSpacing:-1.4,marginTop:8},intro:{fontSize:13,lineHeight:20,marginTop:8,marginBottom:24},section:{fontSize:10,fontWeight:'900',letterSpacing:1.5,marginTop:24,marginBottom:10},panel:{borderWidth:1},choice:{minHeight:70,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:StyleSheet.hairlineWidth},choiceIcon:{width:36,height:36,alignItems:'center',justifyContent:'center'},row:{minHeight:64,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:StyleSheet.hairlineWidth},icon:{width:36,height:36,alignItems:'center',justifyContent:'center'},rowCopy:{flex:1},rowTitle:{fontSize:12,fontWeight:'800',letterSpacing:.2},rowSubtitle:{fontSize:10,lineHeight:16,marginTop:3},about:{padding:17},brand:{fontSize:15,fontWeight:'900',letterSpacing:2,marginBottom:7}
});
