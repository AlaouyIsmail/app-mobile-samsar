import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { api, formatPrice } from '../lib/api';

const TYPES = [
  { label: 'Tous', val: '' },
  { label: 'Appartement', val: 'apartment' },
  { label: 'Villa', val: 'villa' },
  { label: 'Riad', val: 'riad' },
  { label: 'Terrain', val: 'land' },
];
const TX = [
  { label: 'Vente', val: 'SALE' },
  { label: 'Location', val: 'RENT' },
];

function PropRow({ item, onPress }: any) {
  const img = Array.isArray(item.images) && item.images.length
    ? item.images[0]
    : 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&q=70';
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.88}>
      <Image source={{ uri: img }} style={styles.rowImg} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <View style={[styles.badge, item.type === 'SALE' ? styles.badgeSale : styles.badgeRent]}>
            <Text style={styles.badgeText}>{item.type === 'SALE' ? 'Vente' : 'Location'}</Text>
          </View>
          {item.isFeatured && (
            <View style={styles.badgeFeat}><Text style={styles.badgeFeatText}>⭐ Vedette</Text></View>
          )}
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.rowLocation}>
          <Ionicons name="location" size={12} color={COLORS.teal} />
          <Text style={styles.rowCity}>{item.district ? `${item.district}, ` : ''}{item.city}</Text>
        </View>
        <Text style={styles.rowPrice}>
          {formatPrice(item.price)}{item.type === 'RENT' ? '/mois' : ''}
        </Text>
        <View style={styles.rowSpecs}>
          {!!item.rooms && (
            <View style={styles.spec}>
              <Ionicons name="bed-outline" size={12} color={COLORS.text3} />
              <Text style={styles.specText}>{item.rooms}</Text>
            </View>
          )}
          {!!item.bathrooms && (
            <View style={styles.spec}>
              <Ionicons name="water-outline" size={12} color={COLORS.text3} />
              <Text style={styles.specText}>{item.bathrooms}</Text>
            </View>
          )}
          {!!item.surface && (
            <View style={styles.spec}>
              <Ionicons name="expand-outline" size={12} color={COLORS.text3} />
              <Text style={styles.specText}>{item.surface}m²</Text>
            </View>
          )}
          <View style={[styles.spec, { marginLeft: 'auto' as any }]}>
            <Ionicons name="eye-outline" size={12} color={COLORS.text3} />
            <Text style={styles.specText}>{item.stats?.views || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PropertiesScreen({ navigation, route }: any) {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [propType, setPropType] = useState(route?.params?.propertyType || '');
  const [txType, setTxType] = useState(route?.params?.type || '');

  const load = useCallback(async (pg = 1, reset = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set('city', search);
      if (propType) q.set('propertyType', propType);
      if (txType) q.set('type', txType);
      q.set('page', String(pg));
      q.set('limit', '10');
      const r = await api.getProperties(q.toString());
      const items = r.data || [];
      if (reset || pg === 1) setData(items);
      else setData(prev => [...prev, ...items]);
      setTotal(r.total || 0);
      setHasMore(items.length === 10);
    } catch {}
    setLoading(false); setLoadingMore(false); setRefreshing(false);
  }, [search, propType, txType]);

  useEffect(() => { setPage(1); load(1, true); }, [propType, txType]);

  const onRefresh = () => { setRefreshing(true); setPage(1); load(1, true); };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      load(next);
    }
  };

  const handleSearch = () => { setPage(1); load(1, true); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Annonces</Text>
          <Text style={styles.headerSub}>{loading ? '...' : `${total} bien${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`}</Text>
        </View>
        <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('MapTab')}>
          <Ionicons name="map-outline" size={18} color={COLORS.teal} />
          <Text style={styles.mapBtnText}>Carte</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchField}>
          <Ionicons name="search" size={16} color={COLORS.text3} />
          <TextInput
            style={styles.searchInput}
            placeholder="Chercher par ville..."
            placeholderTextColor={COLORS.text3}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => { setSearch(''); load(1, true); }}>
              <Ionicons name="close-circle" size={16} color={COLORS.text3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filter */}
      <View style={{ height: 50, backgroundColor: '#fff' }}>
        <FlatList
          horizontal
          data={TYPES}
          keyExtractor={i => i.val}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, propType === item.val && styles.chipActive]}
              onPress={() => setPropType(item.val)}
            >
              <Text style={[styles.chipText, propType === item.val && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
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
        <Text style={styles.countBadge}>{total} résultats</Text>
      </View>

      {/* List */}
      {loading && page === 1 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySub}>Modifiez vos critères de recherche</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setPropType(''); setTxType(''); setSearch(''); }}>
            <Text style={styles.resetText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <PropRow item={item} onPress={() => navigation.navigate('PropertyDetail', { id: item.id })} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.teal} />
            </View>
          ) : null}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pearl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: COLORS.text3, marginTop: 2 },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.tealPale, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.2)',
  },
  mapBtnText: { color: COLORS.teal, fontWeight: '700', fontSize: 13 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff' },
  searchField: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.pearl, borderRadius: 12,
    paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 3, borderRadius: 20,
    backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  chipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.text2 },
  chipTextActive: { color: '#fff' },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  txBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border,
  },
  txBtnActive: { backgroundColor: COLORS.tealPale, borderColor: COLORS.teal },
  txText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  txTextActive: { color: COLORS.teal },
  countBadge: { marginLeft: 'auto' as any, fontSize: 12, color: COLORS.text3, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingVertical: 12, gap: 12, paddingBottom: 100 },
  row: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 18,
    overflow: 'hidden', ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rowImg: { width: 110, height: 130 },
  rowBody: { flex: 1, padding: 12 },
  rowTop: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeSale: { backgroundColor: 'rgba(16,185,129,0.1)' },
  badgeRent: { backgroundColor: 'rgba(59,130,246,0.1)' },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.ink },
  badgeFeat: { backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeFeatText: { fontSize: 10, fontWeight: '700', color: COLORS.amber },
  rowTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink, lineHeight: 18, marginBottom: 4 },
  rowLocation: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  rowCity: { fontSize: 11, color: COLORS.text3 },
  rowPrice: { fontSize: 15, fontWeight: '800', color: COLORS.teal, letterSpacing: -0.5, marginBottom: 8 },
  rowSpecs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  specText: { fontSize: 11, color: COLORS.text3, fontWeight: '500' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text2, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.text3, textAlign: 'center', marginBottom: 20 },
  resetBtn: { backgroundColor: COLORS.teal, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  resetText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});