import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, SHADOWS } from '../constants/colors';
import { api, formatPrice } from '../lib/api';

const { width } = Dimensions.get('window');

// react-native-maps est natif: on l’importe uniquement sur mobile.
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
  Marker = require('react-native-maps').Marker;
}

type LatLng = { latitude: number; longitude: number };

const CITIES = ['Tout', 'Casablanca', 'Marrakech', 'Rabat', 'Tanger', 'Fès', 'Agadir'];
const TX = [
  { label: 'Tout', val: '' },
  { label: 'Vente', val: 'SALE' },
  { label: 'Location', val: 'RENT' },
];

function parseNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return null;
  return n;
}

function getPropertyCoords(p: any): LatLng | null {
  // Stratégie flexible: latitude/longitude, lat/lng, ou location.lat/location.lng
  const latitude = parseNumber(p?.latitude ?? p?.lat ?? p?.location?.lat);
  const longitude = parseNumber(p?.longitude ?? p?.lng ?? p?.location?.lng);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
}

function getCoordsForProperties(properties: any[]): Array<{ property: any; coords: LatLng }> {
  return properties
    .map((property) => {
      const coords = getPropertyCoords(property);
      return coords ? { property, coords } : null;
    })
    .filter(Boolean) as Array<{ property: any; coords: LatLng }>;
}

function MapPlaceholder({ properties, onPress }: { properties: any[]; onPress: (p: any) => void }) {
  return (
    <View style={styles.mapPlaceholder}>
      <View style={styles.mapBg}>
        {/* Grid lines */}
        {[...Array(8)].map((_, i) => (
          <View
            key={`h${i}`}
            style={[styles.gridH, { top: `${(i + 1) * 12}%` as any }]}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <View
            key={`v${i}`}
            style={[styles.gridV, { left: `${(i + 1) * 16}%` as any }]}
          />
        ))}

        {/* Property pins */}
        {properties.slice(0, 8).map((p) => {
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.pin,
                { top: '50%', left: '50%' },
                p.isFeatured
                  ? styles.pinFeat
                  : p.type === 'SALE'
                    ? styles.pinSale
                    : styles.pinRent,
              ]}
              onPress={() => onPress(p)}
            >
              <Text style={styles.pinText}>{p.type === 'SALE' ? 'Vente' : 'Loc.'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>


      <View style={styles.mapLabel}>
        <Ionicons name="map" size={14} color={COLORS.teal} />
        <Text style={styles.mapLabelText}>Carte interactive — {properties.length} biens</Text>
      </View>
    </View>
  );
}

export default function MapScreen({ navigation }: any) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('Tout');
  const [txType, setTxType] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (city !== 'Tout') q.set('city', city);
      if (txType) q.set('type', txType);
      q.set('limit', '50');
      const r = await api.getProperties(q.toString());
      setProperties(r.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [city, txType]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarLeft}>
          <View style={styles.topbarIcon}>
            <Ionicons name="location" size={18} color={COLORS.teal} />
          </View>
          <View>
            <Text style={styles.topbarTitle}>Carte</Text>
            <Text style={styles.topbarSub}>
              {loading ? 'Chargement...' : `${properties.length} bien${properties.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

      {/* TX filter */}
        <View style={styles.txRow}>
          {TX.map(t => (
            <TouchableOpacity
              key={t.val}
              style={[styles.txBtn, txType === t.val && styles.txBtnActive]}
              onPress={() => setTxType(t.val)}
            >
              <Text style={[styles.txText, txType === t.val && styles.txTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* City pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cityRow}
        style={styles.cityScroll}
      >
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

      {/* Map area */}
      <View style={styles.mapArea}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingCard}>
              <ActivityIndicator color={COLORS.teal} size="large" />
              <Text style={styles.loadingText}>Chargement de la carte</Text>
              <Text style={styles.loadingSubText}>Géolocalisation en cours...</Text>
            </View>
          </View>
        ) : (
          (() => {
            const coords = getCoordsForProperties(properties);

            if (!MapView) {
              return <MapPlaceholder properties={properties} onPress={(p) => setSelected(p)} />;
            }

            const initialRegion = {
              latitude: 31.7917, // Maroc
              longitude: -7.0926,
              latitudeDelta: 6,
              longitudeDelta: 6,
            };

            return (
              <MapView
                style={styles.mapReal}
                initialRegion={initialRegion}
                showsUserLocation={false}
                scrollEnabled
                zoomEnabled
                onPress={() => setSelected(null)}
              >
                {coords.map(({ property, coords }) => (
                  <Marker
                    key={property.id}
                    coordinate={coords}
                    tracksViewChanges={false}
                    onPress={() => setSelected(property)}
                  />
                ))}
              </MapView>
            );
          })()
        )}

        {/* Selected popup */}
        {selected && (
          <TouchableOpacity
            style={styles.popup}
            onPress={() => navigation.navigate('PropertyDetail', { id: selected.id })}
            activeOpacity={0.92}
          >
            <TouchableOpacity style={styles.popupClose} onPress={() => setSelected(null)}>
              <Ionicons name="close" size={16} color={COLORS.text2} />
            </TouchableOpacity>
            {selected.images?.[0] && <Image source={{ uri: selected.images[0] }} style={styles.popupImg} />}
            <View style={styles.popupBody}>
              <Text style={styles.popupTitle} numberOfLines={1}>{selected.title}</Text>
              <View style={styles.popupRow}>
                <Ionicons name="location" size={11} color={COLORS.teal} />
                <Text style={styles.popupCity}>{selected.city}</Text>
              </View>
              <View style={styles.popupBottom}>
                <Text style={styles.popupPrice}>{formatPrice(selected.price)}</Text>
                <View style={[styles.popupBadge, selected.type === 'SALE' ? styles.badgeSale : styles.badgeRent]}>
                  <Text style={styles.popupBadgeText}>{selected.type === 'SALE' ? 'VENTE' : 'LOC.'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>


      {/* Sidebar list */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>{properties.length} résultats · {city === 'Tout' ? 'Tout le Maroc' : city}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sidebarList}>
          {properties.slice(0, 10).map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.sideCard, selected?.id === p.id && styles.sideCardActive]}
              onPress={() => setSelected(p)}
              activeOpacity={0.88}
            >
              {p.images?.[0] && (
                <Image source={{ uri: p.images[0] }} style={styles.sideCardImg} />
              )}
              <View style={styles.sideCardBody}>
                <Text style={styles.sideCardTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.sideCardPrice}>{formatPrice(p.price)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pearl },
  topbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  topbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topbarIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.tealPale, borderWidth: 1, borderColor: 'rgba(0,200,150,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  topbarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  topbarSub: { fontSize: 11, color: COLORS.text3, marginTop: 1 },
  txRow: { flexDirection: 'row', gap: 6 },
  txBtn: { paddingHorizontal: 16, paddingVertical: 8, marginTop: 1, borderRadius: 10, backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start' },
  txBtnActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  txText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  txTextActive: { color: '#fff' },
  cityScroll: { backgroundColor: '#fff', maxHeight: 52,paddingVertical: 10},
  cityRow: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  cityChip: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start' },
  cityChipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  cityChipText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  cityChipTextActive: { color: '#fff' },
  mapArea: { flex: 1, position: 'relative' },
  mapReal: { flex: 1 },
  mapPlaceholder: { flex: 1 },
  mapBg: { flex: 1, backgroundColor: '#e8f0e8', position: 'relative', overflow: 'hidden' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  pin: {
    position: 'absolute', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, ...SHADOWS.sm,
  },
  pinSale: { backgroundColor: COLORS.ink },
  pinRent: { backgroundColor: '#374151' },
  pinFeat: { backgroundColor: COLORS.teal },
  pinText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  mapLabel: {
    position: 'absolute', bottom: 12, left: '50%',
    transform: [{ translateX: -100 }],
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    ...SHADOWS.sm,
  },
  mapLabelText: { fontSize: 11, color: COLORS.text2, fontWeight: '600' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', ...SHADOWS.md, gap: 12 },
  loadingText: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  loadingSubText: { fontSize: 12, color: COLORS.text3 },
  popup: {
    position: 'absolute', bottom: 12, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', ...SHADOWS.md,
    flexDirection: 'row',
  },
  popupClose: {
    position: 'absolute', top: 8, right: 8, zIndex: 10,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  popupImg: { width: 100, height: 90 },
  popupBody: { flex: 1, padding: 12, justifyContent: 'space-between' },
  popupTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  popupRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  popupCity: { fontSize: 11, color: COLORS.text3 },
  popupBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  popupPrice: { fontSize: 15, fontWeight: '800', color: COLORS.teal },
  popupBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeSale: { backgroundColor: COLORS.ink },
  badgeRent: { backgroundColor: '#374151' },
  popupBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  sidebar: {
    backgroundColor: COLORS.ink,
    paddingTop: 12, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  sidebarTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10 },
  sidebarList: { paddingHorizontal: 16, gap: 10 },
  sideCard: {
    width: 160, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sideCardActive: { borderColor: COLORS.teal },
  sideCardImg: { width: '100%', height: 80 },
  sideCardBody: { padding: 8 },
  sideCardTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  sideCardPrice: { color: COLORS.teal, fontSize: 13, fontWeight: '800', marginTop: 2 },
});