import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Linking, ActivityIndicator, StatusBar,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { api, formatPrice, formatDate } from '../lib/api';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    api.getProperty(id)
      .then(p => { setProperty(p); setLikes(p.stats?.likes || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleWA = async () => {
    try { await api.whatsappClick(id); } catch {}
    const propertyTitle = property?.title || 'Propriété';
    const propertyPrice = property?.price ? formatPrice(property.price) : 'Non spécifié';
    const propertyCity = property?.city || 'Non spécifié';
    
    const msg = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par:\n\n📍 *${propertyTitle}*\n💰 ${propertyPrice}\n🏙️ ${propertyCity}\n\nMerci de me contacter.`
    );
    const phone = ((property && property.agent && property.agent.phone) || '212600000000').replace(/[^\d]/g, '');
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const handleLike = async () => {
    try { await api.likeProperty(id); setLiked(!liked); setLikes(n => liked ? n - 1 : n + 1); } catch {}
  };
  const handleSave = async () => {
    try { await api.saveProperty(id); setSaved(!saved); } catch {}
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.notFoundText}>Annonce introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn2}>
          <Text style={styles.backBtn2Text}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = Array.isArray(property.images) && property.images.length
    ? property.images
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gallery */}
      <View style={styles.gallery}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.galleryImg} resizeMode="cover" />
          )}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.galleryActions}>
          <TouchableOpacity style={[styles.actionBtn, saved && styles.actionBtnActive]} onPress={handleSave}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? '#fff' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, liked && styles.actionBtnLiked]} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Badges */}
        <View style={styles.galleryBadges}>
          <View style={[styles.badge, property.type === 'SALE' ? styles.badgeSale : styles.badgeRent]}>
            <Text style={styles.badgeText}>{property.type === 'SALE' ? 'Vente' : 'Location'}</Text>
          </View>
          {property.isFeatured && (
            <View style={styles.badgeFeat}><Text style={styles.badgeFeatText}>⭐ Vedette</Text></View>
          )}
        </View>

        {/* Dots */}
        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_:number, i:number) => (
              <View key={i} style={[styles.dot, i === imgIdx ? styles.dotActive : styles.dotIdle]} />
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Price & title */}
        <View style={styles.section}>
          <Text style={styles.price}>
            {formatPrice(property.price)}
            {property.type === 'RENT' && <Text style={styles.priceSub}>/mois</Text>}
          </Text>
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={COLORS.teal} />
            <Text style={styles.location}>
              {property.district ? `${property.district}, ` : ''}{property.city}
            </Text>
          </View>
        </View>

        {/* Specs */}
        {(property.rooms || property.bathrooms || property.surface) && (
          <View style={styles.specsRow}>
            {property.rooms && (
              <View style={styles.specItem}>
                <Ionicons name="bed-outline" size={20} color={COLORS.teal} />
                <Text style={styles.specVal}>{property.rooms}</Text>
                <Text style={styles.specLbl}>Chambres</Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.specItem}>
                <Ionicons name="water-outline" size={20} color={COLORS.teal} />
                <Text style={styles.specVal}>{property.bathrooms}</Text>
                <Text style={styles.specLbl}>Salles de bain</Text>
              </View>
            )}
            {property.surface && (
              <View style={styles.specItem}>
                <Ionicons name="expand-outline" size={20} color={COLORS.teal} />
                <Text style={styles.specVal}>{property.surface}</Text>
                <Text style={styles.specLbl}>m²</Text>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        {!!property.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={[styles.section, styles.statsSection]}>
          {[
            { icon: 'eye-outline', label: 'Vues', val: property.stats?.views || 0 },
            { icon: 'heart-outline', label: 'Likes', val: likes },
            { icon: 'bookmark-outline', label: 'Sauveg.', val: property.stats?.saves || 0 },
            { icon: 'chatbubble-outline', label: 'WhatsApp', val: property.stats?.whatsappClicks || 0 },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Ionicons name={s.icon as any} size={18} color={COLORS.text3} />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Agent */}
        {property.agent && (
          <View style={styles.agentCard}>
            <Text style={styles.sectionTitle}>Agent</Text>
            <View style={styles.agentRow}>
              {property.agent.photo ? (
                <Image source={{ uri: property.agent.photo }} style={styles.agentPhoto} />
              ) : (
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>{property.agent.name?.[0]?.toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{property.agent.name}</Text>
                <View style={styles.agentCityRow}>
                  <Ionicons name="location-outline" size={12} color={COLORS.text3} />
                  <Text style={styles.agentCity}>{property.agent.city || 'Maroc'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => property.agent?.phone && Linking.openURL(`tel:${property.agent.phone}`)}
              >
                <Ionicons name="call" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            {property.agent.bio && (
              <Text style={styles.agentBio} numberOfLines={2}>{property.agent.bio}</Text>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceVal}>{formatPrice(property.price)}</Text>
          {property.type === 'RENT' && <Text style={styles.bottomPriceSub}>/mois</Text>}
        </View>
        <TouchableOpacity style={styles.waBtn} onPress={handleWA} activeOpacity={0.88}>
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.waBtnText}>Contacter l'agent</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  notFoundText: { fontSize: 18, color: COLORS.text2, marginBottom: 16 },
  backBtn2: { backgroundColor: COLORS.teal, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  backBtn2Text: { color: '#fff', fontWeight: '700' },
  gallery: { height: 300, position: 'relative' },
  galleryImg: { width, height: 300 },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  galleryActions: { position: 'absolute', top: 52, right: 16, flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  actionBtnActive: { backgroundColor: COLORS.amber },
  actionBtnLiked: { backgroundColor: '#EF4444' },
  galleryBadges: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSale: { backgroundColor: COLORS.teal },
  badgeRent: { backgroundColor: '#3B82F6' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  badgeFeat: { backgroundColor: 'rgba(245,158,11,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeFeatText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  dotsRow: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', gap: 4 },
  dot: { height: 5, borderRadius: 3 },
  dotActive: { width: 16, backgroundColor: '#fff' },
  dotIdle: { width: 5, backgroundColor: 'rgba(255,255,255,0.5)' },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  price: { fontSize: 28, fontWeight: '800', color: COLORS.ink, letterSpacing: -1 },
  priceSub: { fontSize: 16, color: COLORS.text2, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.ink, marginTop: 6, lineHeight: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  location: { fontSize: 13, color: COLORS.text2 },
  specsRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  specItem: { flex: 1, alignItems: 'center', gap: 4 },
  specVal: { fontSize: 18, fontWeight: '800', color: COLORS.ink },
  specLbl: { fontSize: 11, color: COLORS.text3, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 10 },
  description: { fontSize: 14, color: COLORS.text2, lineHeight: 22 },
  statsSection: {
    flexDirection: 'row', paddingVertical: 14,
    backgroundColor: COLORS.pearl,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  statLbl: { fontSize: 10, color: COLORS.text3, fontWeight: '600', textTransform: 'uppercase' },
  agentCard: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentPhoto: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.gray },
  agentAvatar: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.tealPale, justifyContent: 'center', alignItems: 'center',
  },
  agentAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.teal },
  agentName: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  agentCityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  agentCity: { fontSize: 12, color: COLORS.text3 },
  callBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center',
  },
  agentBio: { fontSize: 13, color: COLORS.text2, marginTop: 10, lineHeight: 18 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 34, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.md,
  },
  bottomPrice: { flex: 1 },
  bottomPriceVal: { fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  bottomPriceSub: { fontSize: 12, color: COLORS.text2 },
  waBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
    backgroundColor: '#25D366',
  },
  waBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});