import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Dimensions, StatusBar, FlatList, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { api, formatPrice } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const CITIES = ['Toutes', 'Casablanca', 'Marrakech', 'Rabat', 'Tanger', 'Fès'];
const CATEGORIES = [
  { icon: '🏢', label: 'Appart.', val: 'apartment' },
  { icon: '🏡', label: 'Villa', val: 'villa' },
  { icon: '🕌', label: 'Riad', val: 'riad' },
  { icon: '🌿', label: 'Terrain', val: 'land' },
  { icon: '🏪', label: 'Commerce', val: 'commercial' },
];

function PropertyMini({ p, onPress }: any) {
  const img = Array.isArray(p.images) && p.images.length ? p.images[0] : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=70';
  return (
    <TouchableOpacity style={styles.propCard} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: img }} style={styles.propImg} />
      <LinearGradient colors={['transparent', 'rgba(10,15,30,0.85)']} style={styles.propGrad} />
      <View style={styles.propBadge}>
        <Text style={styles.propBadgeText}>{p.type === 'SALE' ? 'Vente' : 'Location'}</Text>
      </View>
      <View style={styles.propInfo}>
        <Text style={styles.propPrice}>{formatPrice(p.price)}{p.type === 'RENT' ? '/m' : ''}</Text>
        <Text style={styles.propTitle} numberOfLines={1}>{p.title}</Text>
        <View style={styles.propLocation}>
          <Ionicons name="location" size={11} color={COLORS.teal} />
          <Text style={styles.propCity}>{p.city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { user, agent } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Toutes');

  const load = async () => {
    try {
      const r = await api.getProperties('limit=8&page=1');
      setProperties(r.data || []);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleSearch = () => {
    const q = new URLSearchParams();
    if (search) q.set('city', search);
    navigation.navigate('PropertiesTab', { query: q.toString() });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
      >
        {/* Hero Header */}
        <LinearGradient colors={['#0A0F1E', '#0D2A1E', '#060D1A']} style={styles.hero}>
          {/* Glow */}
          <View style={styles.heroGlow} />

          {/* Top bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>Bonjour{user ? `, ${user.email?.split('@')[0]}` : ''} 👋</Text>
              <Text style={styles.greetingSub}>Trouvez votre bien idéal</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AgentTab')} style={styles.avatarBtn}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={COLORS.teal} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>
            Votre bien{'\n'}de <Text style={{ color: COLORS.teal }}>rêve</Text>{'\n'}au Maroc.
          </Text>

          {/* User Auth Buttons (if not logged in) */}
          {!user && (
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, marginTop: 4 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: COLORS.teal, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Se connecter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search bar */}
          <View style={styles.searchBar}>
            <View style={styles.searchField}>
              <Ionicons name="search" size={18} color="rgba(10,15,30,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Ville, quartier..."
                placeholderTextColor="rgba(10,15,30,0.35)"
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.88}>
              <Text style={styles.searchBtnText}>Chercher</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { n: '1 200+', l: 'Annonces' },
              { n: '350+', l: 'Agents' },
              { n: '24h', l: 'Activation' },
            ].map((s, i) => (
              <React.Fragment key={s.l}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{s.n}</Text>
                  <Text style={styles.statLbl}>{s.l}</Text>
                </View>
                {i < 2 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* Transaction tabs */}
        <View style={styles.txRow}>
          {['Vente', 'Location', 'Tout'].map(tx => (
            <TouchableOpacity
              key={tx}
              style={[styles.txBtn, tx === 'Vente' && styles.txBtnActive]}
              onPress={() => navigation.navigate('PropertiesTab', { type: tx === 'Vente' ? 'SALE' : tx === 'Location' ? 'RENT' : '' })}
            >
              <Text style={[styles.txText, tx === 'Vente' && styles.txTextActive]}>{tx}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Par catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.val}
                style={styles.catItem}
                onPress={() => navigation.navigate('PropertiesTab', { propertyType: c.val })}
                activeOpacity={0.8}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text style={styles.catLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* City filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
          {CITIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.cityChip, city === c && styles.cityChipActive]}
              onPress={() => setCity(c)}
            >
              <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured properties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Annonces vedettes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PropertiesTab')}>
              <Text style={styles.seeAll}>Tout voir →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              {[1, 2].map(i => <View key={i} style={styles.propSkeleton} />)}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.propRow}>
              {properties.slice(0, 6).map(p => (
                <PropertyMini
                  key={p.id}
                  p={p}
                  onPress={() => navigation.navigate('PropertyDetail', { id: p.id })}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Map CTA */}
        <TouchableOpacity
          style={styles.mapCta}
          onPress={() => navigation.navigate('MapTab')}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#0A0F1E', '#0D2E22']} style={styles.mapCtaGrad}>
            <View style={styles.mapCtaIcon}>
              <Ionicons name="map" size={24} color={COLORS.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapCtaTitle}>Carte interactive</Text>
              <Text style={styles.mapCtaSub}>Géolocalisez les biens en temps réel</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={COLORS.teal} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const CARD_W = width * 0.62;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pearl },
  hero: { paddingHorizontal: 20, paddingTop: 55, paddingBottom: 28, position: 'relative', overflow: 'hidden' },
  heroGlow: {
    position: 'absolute', top: -80, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(0,200,150,0.12)',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  greetingSub: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 },
  avatarBtn: {},
  avatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitle: {
    color: '#fff', fontSize: 36, fontWeight: '800',
    lineHeight: 42, letterSpacing: -1, marginBottom: 24,
  },
  searchBar: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12,
    height: 46, gap: 8, ...SHADOWS.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink },
  searchBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingHorizontal: 16, justifyContent: 'center',
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1, textTransform: 'uppercase', fontWeight: '700' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  txRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border },
  txBtnActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  txText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  txTextActive: { color: '#fff' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  seeAll: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },
  catScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  catItem: {
    alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    marginRight: 10, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    minWidth: 72,
  },
  catIcon: { fontSize: 24, marginBottom: 4 },
  catLabel: { fontSize: 11, color: COLORS.text2, fontWeight: '600' },
  cityRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  cityChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border,
  },
  cityChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  cityChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text2 },
  cityChipTextActive: { color: '#fff' },
  propRow: { paddingRight: 20, gap: 12 },
  propCard: {
    width: CARD_W, height: 200, borderRadius: 20,
    overflow: 'hidden', backgroundColor: COLORS.ink, ...SHADOWS.md,
  },
  propImg: { width: '100%', height: '100%' },
  propGrad: { ...StyleSheet.absoluteFillObject },
  propBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: COLORS.teal, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  propBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  propInfo: { position: 'absolute', bottom: 14, left: 14, right: 14 },
  propPrice: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  propTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginTop: 2 },
  propLocation: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  propCity: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  loadingRow: { flexDirection: 'row', gap: 12 },
  propSkeleton: {
    width: CARD_W, height: 200, borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  mapCta: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: 'hidden', ...SHADOWS.md },
  mapCtaGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14 },
  mapCtaIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapCtaTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  mapCtaSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
});