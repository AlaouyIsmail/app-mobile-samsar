import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { api } from '../lib/api';

const CITIES = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Kénitra','Tétouan'];

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const [showCities, setShowCities] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const nameOk  = form.name.trim().length > 2;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const phoneOk = form.phone.replace(/\s/g, '').length >= 9;
  const lenOk   = form.password.length >= 6;
  const numOk   = /[\d\W]/.test(form.password);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Veuillez remplir tous les champs obligatoires'); return;
    }
    setError(''); setLoading(true);
    try {
      const result = await api.register(form);
      navigation.navigate('Payment', { regData: { ...form, agentId: result.agent?.id } });
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0F1E', '#0f1923']} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back Arrow */}
          <TouchableOpacity 
            style={{ alignSelf: 'flex-start', marginBottom: 20, padding: 8, marginLeft: -8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Inscription</Text>
            <Text style={styles.title}>Créer un{'\n'}compte agent</Text>
            <Text style={styles.sub}>Rejoignez +350 agents professionnels sur SAMSAR</Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Nom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <View style={[styles.fieldWrap, focused === 'name' && styles.fieldFocused]}>
              <Ionicons name="person-outline" size={17} color={focused === 'name' ? COLORS.teal : 'rgba(255,255,255,0.25)'} />
              <TextInput
                style={styles.input}
                placeholder="Karim Bennani"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={form.name}
                onChangeText={v => set('name', v)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
              {nameOk && <Ionicons name="checkmark-circle" size={18} color={COLORS.teal} />}
            </View>
          </View>

          {/* Email + Phone row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Email *</Text>
              <View style={[styles.fieldWrap, focused === 'email' && styles.fieldFocused]}>
                <Ionicons name="mail-outline" size={17} color={focused === 'email' ? COLORS.teal : 'rgba(255,255,255,0.25)'} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="vous@email.com"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={form.email}
                  onChangeText={v => set('email', v)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailOk && <Ionicons name="checkmark-circle" size={16} color={COLORS.teal} />}
              </View>
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Téléphone</Text>
              <View style={[styles.fieldWrap, focused === 'phone' && styles.fieldFocused]}>
                <Ionicons name="call-outline" size={17} color={focused === 'phone' ? COLORS.teal : 'rgba(255,255,255,0.25)'} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="+212 6..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={form.phone}
                  onChangeText={v => set('phone', v)}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                  keyboardType="phone-pad"
                />
                {phoneOk && <Ionicons name="checkmark-circle" size={16} color={COLORS.teal} />}
              </View>
            </View>
          </View>

          {/* City selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ville d'activité</Text>
            <TouchableOpacity
              style={[styles.fieldWrap, styles.cityField, showCities && styles.fieldFocused]}
              onPress={() => setShowCities(!showCities)}
            >
              <Ionicons name="location-outline" size={17} color={showCities ? COLORS.teal : 'rgba(255,255,255,0.25)'} />
              <Text style={[styles.input, { flex: 1, paddingTop: 0 }, !form.city && { color: 'rgba(255,255,255,0.25)' }]}>
                {form.city || 'Sélectionnez votre ville'}
              </Text>
              <Ionicons name={showCities ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
            {showCities && (
              <View style={styles.cityDropdown}>
                {CITIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cityOption, form.city === c && styles.cityOptionActive]}
                    onPress={() => { set('city', c); setShowCities(false); }}
                  >
                    <Text style={[styles.cityOptionText, form.city === c && styles.cityOptionTextActive]}>{c}</Text>
                    {form.city === c && <Ionicons name="checkmark" size={14} color={COLORS.teal} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={[styles.fieldWrap, focused === 'pwd' && styles.fieldFocused]}>
              <Ionicons name="lock-closed-outline" size={17} color={focused === 'pwd' ? COLORS.teal : 'rgba(255,255,255,0.25)'} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Minimum 6 caractères"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={form.password}
                onChangeText={v => set('password', v)}
                onFocus={() => { setFocused('pwd'); setPwdFocus(true); }}
                onBlur={() => { setFocused(null); setPwdFocus(false); }}
                secureTextEntry={!showPwd}
                // minLength={6}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={17} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>

            {/* Password hints */}
            {(pwdFocus || form.password.length > 0) && (
              <View style={styles.pwdHints}>
                {[
                  { ok: lenOk, text: 'Au moins 6 caractères' },
                  { ok: numOk, text: 'Un chiffre ou symbole' },
                ].map(h => (
                  <View key={h.text} style={styles.hintRow}>
                    <View style={[styles.hintDot, { backgroundColor: h.ok ? COLORS.teal : 'rgba(255,255,255,0.2)' }]} />
                    <Text style={[styles.hintText, { color: h.ok ? COLORS.teal : 'rgba(255,255,255,0.3)' }]}>{h.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={styles.submitText}>Créer mon compte</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>

          {/* Pricing reminder */}
          <View style={styles.pricingNote}>
            <View style={styles.pricingRow}>
              {[
                { icon: 'cash-outline', text: '349 MAD/mois' },
                { icon: 'flash-outline', text: 'Activation 24h' },
                { icon: 'close-circle-outline', text: 'Sans engagement' },
              ].map(p => (
                <View key={p.text} style={styles.pricingItem}>
                  <Ionicons name={p.icon as any} size={14} color={COLORS.teal} />
                  <Text style={styles.pricingText}>{p.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  glow: {
    position: 'absolute', top: -100, right: -100,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(0,200,150,0.1)',
  },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  header: { marginBottom: 28 },
  eyebrow: { color: COLORS.teal, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -1, marginBottom: 10 },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, flex: 1 },
  fieldGroup: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, paddingHorizontal: 12, height: 48, gap: 9,
  },
  fieldFocused: { borderColor: 'rgba(0,200,150,0.55)', backgroundColor: 'rgba(0,200,150,0.05)' },
  cityField: { height: 48 },
  input: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  cityDropdown: {
    backgroundColor: '#1a2332', borderRadius: 12, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  cityOption: { paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  cityOptionActive: { backgroundColor: 'rgba(0,200,150,0.08)' },
  cityOptionText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  cityOptionTextActive: { color: COLORS.teal, fontWeight: '700' },
  pwdHints: { marginTop: 8, gap: 5 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  hintDot: { width: 6, height: 6, borderRadius: 3 },
  hintText: { fontSize: 12 },
  submitBtn: {
    backgroundColor: COLORS.teal, borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 6, marginBottom: 20,
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pricingNote: { marginBottom: 20 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-around' },
  pricingItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pricingText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '500' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  loginLink: { color: COLORS.teal, fontSize: 14, fontWeight: '700' },
});