import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'home',
    title: 'Votre bien\nde rêve\nau Maroc.',
    sub: 'Découvrez +1 200 annonces immobilières vérifiées partout au Maroc.',
    accent: '#00C896',
    bg: ['#0A0F1E', '#0D2E22'],
  },
  {
    id: '2',
    icon: 'bar-chart',
    title: 'Gérez votre\nactivité avec\nune plateforme.',
    sub: 'Annonces, analytics, contrats et WhatsApp — tout en un.',
    accent: '#00C896',
    bg: ['#0f1923', '#0f2a26'],
  },
  {
    id: '3',
    icon: 'map',
    title: 'Localisez le\nbien idéal\nsur la carte.',
    sub: 'Carte interactive géolocalisée avec filtres par ville, budget et type.',
    accent: '#00C896',
    bg: ['#060D1A', '#0A1628'],
  },
  // {
  //   id: '4',
  //   icon: 'flash',
  //   title: 'Activation\nen 24h.\n349 MAD/mois.',
  //   sub: 'Inscription rapide, paiement CIH sécurisé, activation sous 24h.',
  //   accent: '#F59E0B',
  //   bg: ['#0A0F1E', '#1a1000'],
  // },
];

export default function GreetingScreen({ navigation }: any) {
  const { completeGreeting } = useAuth();
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = async () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      // Marquer le greeting comme vu
      await completeGreeting();
      // Rediriger vers Main (l'accueil public) au lieu de forcer le Login
      navigation.replace('Main');
    }
  };

  const current = SLIDES[index];

  return (
    <LinearGradient colors={current.bg as any} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dot grid */}
      <View style={styles.dotGrid} pointerEvents="none" />

      {/* Glow */}
      <View style={[styles.glow, { backgroundColor: current.accent + '20' }]} />

      {/* Slides (hidden scroll for state tracking) */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        renderItem={() => <View style={{ width }} />}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <View style={[styles.logoDot, { backgroundColor: current.accent }]} />
          </View>
          <Text style={styles.logoText}>SAMSAR</Text>
          <View style={[styles.badge, { backgroundColor: current.accent + '22', borderColor: current.accent + '44' }]}>
            <View style={[styles.liveDot, { backgroundColor: current.accent }]} />
            <Text style={[styles.badgeText, { color: current.accent }]}>SaaS Immobilier</Text>
          </View>
        </View>

        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: current.accent + '18', borderColor: current.accent + '33' }]}>
          <View style={[styles.iconInner, { backgroundColor: current.accent + '28' }]}>
            <Ionicons name={current.icon as any} size={36} color={current.accent} />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.sub}>{current.sub}</Text>

        {/* Stats row (only slide 1) */}
        {index === 0 && (
          <View style={styles.statsRow}>
            {[
              { n: '1 200+', l: 'Annonces' },
              { n: '350+', l: 'Agents' },
              // { n: '24h', l: 'Activation' },
            ].map(s => (
              <View key={s.l} style={styles.statItem}>
                <Text style={styles.statNum}>{s.n}</Text>
                <Text style={styles.statLbl}>{s.l}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Features (slide 2) */}
        {index === 1 && (
          <View style={styles.featureList}>
            {['Analytics en temps réel', 'Contrats automatiques', 'WhatsApp natif', 'Upload HD sécurisé'].map(f => (
              <View key={f} style={styles.featureRow}>
                <View style={[styles.featureCheck, { backgroundColor: current.accent }]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pricing (slide 4) */}
        {index === 3 && (
          <View style={styles.priceCard}>
            <Text style={styles.priceAmt}>349 <Text style={styles.priceCur}>MAD/mois</Text></Text>
            <Text style={styles.priceSub}>Annulable · Sans engagement · CIH Bank</Text>
          </View>
        )}
      </Animated.View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index
                  ? { width: 20, backgroundColor: current.accent }
                  : { width: 6, backgroundColor: 'rgba(255,255,255,0.25)' },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: current.accent }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {index === SLIDES.length - 1 ? "C'est parti →" : 'Suivant'}
          </Text>
          {index < SLIDES.length - 1 && (
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          )}
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity onPress={() => navigation.replace('Main')} style={styles.skip}>
          <Text style={styles.skipText}>Passer l'introduction</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dotGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
  },
  glow: {
    position: 'absolute', top: -100, right: -100,
    width: 400, height: 400, borderRadius: 200,
    filter: 'blur(80px)',
  },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 60, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 48 },
  logoBox: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoDot: { width: 14, height: 14, borderRadius: 3 },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 0.5, flex: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, marginBottom: 32, alignSelf: 'flex-start',
  },
  iconInner: {
    width: 72, height: 72, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 38, fontWeight: '800', color: '#fff',
    lineHeight: 44, letterSpacing: -1, marginBottom: 16,
  },
  sub: {
    fontSize: 15, color: 'rgba(255,255,255,0.55)',
    lineHeight: 22, fontWeight: '400', marginBottom: 32,
  },
  statsRow: { flexDirection: 'row', gap: 0, marginTop: 8 },
  statItem: {
    flex: 1, paddingVertical: 16, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  featureList: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureCheck: { width: 20, height: 20, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  featureText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500' },
  priceCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 8,
  },
  priceAmt: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  priceCur: { fontSize: 18, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  priceSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 },
  bottom: { paddingHorizontal: 28, paddingBottom: 48, gap: 16 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 8 },
  dot: { height: 6, borderRadius: 3 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, gap: 8,
    shadowColor: '#00C896', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: 4 },
  skipText: { color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '500' },
});