import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    setError(''); setLoading(true);
    try {
      await login(email, password);
      // 🔥 TRÈS IMPORTANT : Après le login, on force la redirection !
      navigation.replace('Main'); 
    } catch (e: any) {
      setError(e.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0F1E', '#0D2A1E']} style={StyleSheet.absoluteFill} />

      {/* Glow */}
      <View style={styles.glow} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Arrow */}
          <TouchableOpacity 
            style={{ alignSelf: 'flex-start', marginBottom: 20, padding: 8, marginLeft: -8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.logoText}>SAMSAR</Text>
          </View>

          {/* Heading */}
          <Text style={{ display:"flex",alignItems: 'center', gap: 8 }}>

          <Text style={styles.title }>Holla,{'\n'}Bon retour 👋</Text>
          </Text>
          <Text style={styles.sub}>Connectez-vous à votre espace professionnel</Text>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={[styles.fieldWrap, focused === 'email' && styles.fieldFocused]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={focused === 'email' ? COLORS.teal : 'rgba(255,255,255,0.25)'}
              style={styles.fieldIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="stanley@gmail.com"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={[styles.fieldWrap, focused === 'pwd' && styles.fieldFocused]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={focused === 'pwd' ? COLORS.teal : 'rgba(255,255,255,0.25)'}
              style={styles.fieldIcon}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••••"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('pwd')}
              onBlur={() => setFocused(null)}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={styles.submitText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>
          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Pas de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  glow: {
    position: 'absolute', top: -150, right: -150,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(0,200,150,0.15)',
  },
  scroll: { paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  logoBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoDot: { width: 14, height: 14, borderRadius: 3, backgroundColor: COLORS.teal },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 0.5 },
  title: {
    fontSize: 36, fontWeight: '800', color: '#fff',
    lineHeight: 42, letterSpacing: -1, marginBottom: 10,
  },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 32 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingHorizontal: 14, marginBottom: 12,
    height: 52,
  },
  fieldFocused: { borderColor: 'rgba(0,200,150,0.55)', backgroundColor: 'rgba(0,200,150,0.05)' },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 28, marginTop: 4 },
  forgotText: { color: COLORS.teal, fontSize: 13, fontWeight: '600' },
  submitBtn: {
    backgroundColor: COLORS.teal, borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
    marginBottom: 24,
  },
  submitBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  registerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  registerLink: { color: COLORS.teal, fontSize: 14, fontWeight: '700' },
  demoBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 16,
  },
  demoTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', marginBottom: 10 },
  demoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  demoRole: { color: COLORS.teal, fontSize: 12, fontWeight: '700' },
  demoEmail: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
});