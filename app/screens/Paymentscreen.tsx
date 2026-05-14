import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';

interface PaymentScreenProps {
  route?: any;
  navigation?: any;
  regData?: any;
  onBack?: () => void;
}

export default function PaymentScreen({ route, navigation, regData: regDataProp, onBack }: PaymentScreenProps) {
  const regData = regDataProp || route?.params?.regData || {};
  const [copied, setCopied] = useState('');

  const waMsg = encodeURIComponent(
    `Bonjour ! Je viens de créer mon compte agent SAMSAR.\n\n` +
    `👤 Nom: ${regData?.name || 'N/A'}\n📧 Email: ${regData?.email || 'N/A'}\n📱 Tél: ${regData?.phone || 'N/A'}\n📍 Ville: ${regData?.city || 'N/A'}\n\n` +
    `Ci-joint mon reçu de paiement de 349 MAD.\nMerci d'activer mon compte 🙏`
  );
  const waLink = `https://wa.me/212600000000?text=${waMsg}`;

  const bankDetails = [
    { l: 'Banque', v: 'CIH Bank' },
    { l: 'Bénéficiaire', v: 'SAMSAR Maroc SARL' },
    { l: 'RIB', v: '007 780 0001 2345 6789 0 12' },
    { l: 'Montant exact', v: '349,00 MAD' },
  ];

  const steps = [
    { n: 1, l: 'Inscription', done: true },
    { n: 2, l: 'Paiement', active: true },
    { n: 3, l: 'Activation', done: false },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Stepper */}
        <View style={styles.stepper}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepCircle,
                  s.done ? styles.stepDone : s.active ? styles.stepActive : styles.stepPending,
                ]}>
                  {s.done
                    ? <Ionicons name="checkmark" size={14} color="#fff" />
                    : <Text style={[styles.stepNum, s.active && { color: '#fff' }]}>{s.n}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, s.active && { color: COLORS.ink, fontWeight: '700' }]}>{s.l}</Text>
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.stepLine, s.done && styles.stepLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Success banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconWrap}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.teal} />
              </View>
            </View>
          </View>
          <Text style={styles.successTitle}>Compte créé !</Text>
          <Text style={styles.successSub}>
            Bienvenue <Text style={{ color: COLORS.ink, fontWeight: '700' }}>{regData?.name || 'Agent'}</Text> — une dernière étape pour activer votre compte.
          </Text>
        </View>

        {/* Payment card */}
        <View style={styles.payCard}>
          {/* Top dark section */}
          <LinearGradient colors={['#0A0F1E', '#111827']} style={styles.payCardTop}>
            <View>
              <Text style={styles.payLabel}>MONTANT À RÉGLER</Text>
              <View style={styles.payAmtRow}>
                <Text style={styles.payAmt}>349</Text>
                <View>
                  <Text style={styles.payCur}>MAD</Text>
                  <Text style={styles.paySub}>par mois</Text>
                </View>
              </View>
              <Text style={styles.payDesc}>Abonnement 30 jours · annulable</Text>
            </View>
            <View style={styles.pendingBadge}>
              <View style={styles.pendingDot} />
              <View style={styles.pendingDot} />
              <View style={styles.pendingDot} />
            </View>
          </LinearGradient>

          {/* Bank details */}
          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>COORDONNÉES BANCAIRES — CIH BANK</Text>
            <View style={styles.bankCard}>
              {bankDetails.map(b => (
                <TouchableOpacity
                  key={b.l}
                  style={styles.bankRow}
                  onPress={() => {
                    setCopied(b.l);
                    setTimeout(() => setCopied(''), 2000);
                  }}
                >
                  <Text style={styles.bankLabel}>{b.l}</Text>
                  <View style={styles.bankValRow}>
                    <Text style={styles.bankVal}>{b.v}</Text>
                    <Ionicons
                      name={copied === b.l ? 'checkmark' : 'copy-outline'}
                      size={14}
                      color={copied === b.l ? COLORS.teal : COLORS.text3}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Warning */}
            <View style={styles.warningBox}>
              <View style={styles.warningIcon}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>!</Text>
              </View>
              <Text style={styles.warningText}>
                Après votre virement, envoyez impérativement votre <Text style={{ fontWeight: '700' }}>reçu de paiement</Text> via WhatsApp pour valider l'activation de votre compte.
              </Text>
            </View>
          </View>
        </View>

        {/* WhatsApp CTA */}
        <TouchableOpacity
          style={styles.waBtn}
          onPress={() => Linking.openURL(waLink)}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#25D366', '#128C7E']} style={styles.waBtnGrad}>
            <View style={styles.waIconWrap}>
              <Ionicons name="logo-whatsapp" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.waBtnTitle}>Envoyer mon reçu sur WhatsApp</Text>
              <Text style={styles.waBtnSub}>Ouvre WhatsApp avec message pré-rempli</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.activationNote}>
          Votre compte sera activé dans les <Text style={{ color: COLORS.ink, fontWeight: '700' }}>24 à 48h</Text> après réception de votre paiement.
        </Text>

        {/* Login link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation?.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>J'ai déjà payé → Se connecter</Text>
        </TouchableOpacity>

        {/* Features reminder */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Ce que vous obtenez</Text>
          {[
            { icon: 'infinite-outline', text: 'Annonces illimitées' },
            { icon: 'bar-chart-outline', text: 'Analytics en temps réel' },
            { icon: 'document-text-outline', text: 'Contrats automatiques' },
            { icon: 'map-outline', text: 'Carte interactive' },
            { icon: 'flash-outline', text: 'Activation sous 24h' },
          ].map(f => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Ionicons name={f.icon as any} size={14} color={COLORS.teal} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pearl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.pearl },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  stepItem: { alignItems: 'center', gap: 6, flex: 0 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDone: { backgroundColor: COLORS.teal },
  stepActive: { backgroundColor: COLORS.ink, shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  stepPending: { backgroundColor: COLORS.gray },
  stepNum: { fontSize: 14, fontWeight: '800', color: COLORS.text3 },
  stepLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text3 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.gray, marginTop: -16, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: COLORS.teal },

  successBanner: { alignItems: 'center', paddingVertical: 8 },
  successIconWrap: { marginBottom: 16 },
  successIconOuter: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,200,150,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  successIconInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,200,150,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  successSub: { fontSize: 14, color: COLORS.text2, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  payCard: { borderRadius: 20, overflow: 'hidden', ...SHADOWS.md },
  payCardTop: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  payLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  payAmtRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  payAmt: { color: '#fff', fontSize: 48, fontWeight: '800', letterSpacing: -2, lineHeight: 52 },
  payCur: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '600' },
  paySub: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  payDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 6 },
  pendingBadge: { flexDirection: 'column', gap: 4 },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.teal },
  bankSection: { backgroundColor: '#fff', padding: 20 },
  bankTitle: { color: COLORS.text3, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  bankCard: { backgroundColor: COLORS.pearl, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  bankRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  bankLabel: { fontSize: 12, color: COLORS.text2 },
  bankValRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bankVal: { fontSize: 12, fontWeight: '700', color: COLORS.ink, fontFamily: 'monospace' },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 12, padding: 12, marginTop: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  warningIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.amber, justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  warningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },

  waBtn: { borderRadius: 18, overflow: 'hidden', ...SHADOWS.teal },
  waBtnGrad: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  waIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  waBtnTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  waBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  activationNote: { textAlign: 'center', fontSize: 13, color: COLORS.text3, lineHeight: 18 },
  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkText: { color: COLORS.teal, fontSize: 14, fontWeight: '700' },

  featuresCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  featuresTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureCheck: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.tealPale,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { fontSize: 13, color: COLORS.text2, fontWeight: '500' },
});