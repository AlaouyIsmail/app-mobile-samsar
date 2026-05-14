import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, StatusBar, Modal,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../constants/colors';
import { api, formatPrice, formatDate } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Tab = 'overview' | 'properties' | 'contracts' | 'notifications' | 'profile';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vue', icon: 'grid-outline' },
  { id: 'properties', label: 'Annonces', icon: 'home-outline' },
  { id: 'contracts', label: 'Contrats', icon: 'document-text-outline' },
  { id: 'notifications', label: 'Notifs', icon: 'notifications-outline' },
  { id: 'profile', label: 'Profil', icon: 'person-outline' },
];

export default function AgentDashboardScreen({ navigation }: any) {
  const { user, agent, logout, refreshAgent } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', city: '', bio: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const load = async () => {
    try {
      const [d, c, n] = await Promise.all([
        api.agentDashboard(),
        api.getContracts(),
        api.agentNotifications(),
      ]);
      setData(d); setContracts(c); setNotifs(n);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (agent) setProfileForm({ name: agent.name || '', phone: agent.phone || '', city: agent.city || '', bio: agent.bio || '' });
  }, [agent]);

  const onRefresh = () => { setRefreshing(true); load(); };
  const unread = notifs.filter(n => !n.isRead).length;
  const stats = data?.stats || {};
  const properties: any[] = data?.properties || [];

  const handleSignContract = async (id: number) => {
    try { await api.signContract(id); const c = await api.getContracts(); setContracts(c); } catch {}
  };

  const handleReadAll = async () => {
    try { await api.readAllNotifications(); const n = await api.agentNotifications(); setNotifs(n); } catch {}
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try { await api.updateAgentProfile(profileForm); await refreshAgent(); Alert.alert('✓', 'Profil mis à jour'); } catch {}
    setProfileLoading(false);
  };

  const handleDeleteProp = (id: number) => {
    Alert.alert('Supprimer', 'Supprimer cette annonce ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { try { await api.deleteProperty(id); await load(); } catch {} } },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0A0F1E', '#0D2A1E']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>Espace agent</Text>
            <Text style={styles.headerTitle}>Bonjour, {agent?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); }}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* Plan badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.planBadge, agent?.planActive ? styles.planActive : styles.planInactive]}>
            <Ionicons name={agent?.planActive ? 'checkmark-circle' : 'alert-circle'} size={12}
              color={agent?.planActive ? COLORS.teal : COLORS.warning} />
            <Text style={[styles.planText, { color: agent?.planActive ? COLORS.teal : COLORS.warning }]}>
              {agent?.planActive ? 'Plan actif' : 'Plan inactif — Contactez l\'admin'}
            </Text>
          </View>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread} notif{unread > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Tabs */}
        <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityRow}
              style={styles.cityScroll}
            >
      {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}> */}
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon as any} size={14} color={tab === t.id ? '#fff' : COLORS.text2} />
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            {t.id === 'notifications' && unread > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{unread}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
      >
        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Stat cards */}
            <View style={styles.statsGrid}>
              {[
                { l: 'Vues', v: stats.totalViews || 0, icon: '👁️', color: '#3B82F6', bg: '#EFF6FF' },
                { l: 'Likes', v: stats.totalLikes || 0, icon: '❤️', color: '#EF4444', bg: '#FEF2F2' },
                { l: 'Sauveg.', v: stats.totalSaves || 0, icon: '🔖', color: COLORS.amber, bg: '#FFFBEB' },
                { l: 'WhatsApp', v: stats.totalWhatsapp || 0, icon: '💬', color: '#10B981', bg: '#ECFDF5' },
              ].map(s => (
                <View key={s.l} style={[styles.statCard, { backgroundColor: s.bg }]}>
                  <Text style={styles.statIcon}>{s.icon}</Text>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.v.toLocaleString()}</Text>
                  <Text style={styles.statLbl}>{s.l}</Text>
                </View>
              ))}
            </View>

            {/* Secondary stats */}
            <View style={styles.secStats}>
              {[
                { l: 'Annonces actives', v: `${stats.activeProperties || 0}/${stats.totalProperties || 0}`, icon: '🏠' },
                { l: 'Vues profil', v: stats.profileViews || 0, icon: '👤' },
                { l: 'Contrats', v: contracts.length, icon: '📝' },
              ].map(s => (
                <View key={s.l} style={styles.secStatCard}>
                  <Text style={styles.secStatIcon}>{s.icon}</Text>
                  <View>
                    <Text style={styles.secStatVal}>{typeof s.v === 'number' ? s.v.toLocaleString() : s.v}</Text>
                    <Text style={styles.secStatLbl}>{s.l}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Recent properties */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Annonces récentes</Text>
                <TouchableOpacity onPress={() => setTab('properties')}>
                  <Text style={styles.seeAll}>Tout voir →</Text>
                </TouchableOpacity>
              </View>
              {properties.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🏠</Text>
                  <Text style={styles.emptyText}>Aucune annonce</Text>
                </View>
              ) : (
                properties.slice(0, 4).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.propRow}
                    onPress={() => navigation.navigate('PropertyDetail', { id: p.id })}
                  >
                    <Image
                      source={{ uri: p.images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&q=60' }}
                      style={styles.propThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.propTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.propMeta}>{formatPrice(p.price)} · {p.stats?.views || 0} vues</Text>
                    </View>
                    <View style={[styles.statusBadge, p.status === 'AVAILABLE' ? styles.statusActive : styles.statusInactive]}>
                      <Text style={styles.statusText}>{p.status === 'AVAILABLE' ? 'Actif' : 'Inactif'}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* ── PROPERTIES ── */}
        {tab === 'properties' && (
          <View style={styles.tabContent}>
            {!agent?.planActive && (
              <View style={styles.warningBox}>
                <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                <Text style={styles.warningText}>Plan inactif. Contactez l'admin pour activer votre abonnement (349 MAD/mois).</Text>
              </View>
            )}
            
            {agent?.planActive && (
              <TouchableOpacity
                style={styles.addPostBtn}
                onPress={() => Alert.alert('Ajouter', 'Fonctionnalité d\'ajout d\'annonce en cours de développement...')}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.addPostBtnText}>Ajouter une annonce</Text>
              </TouchableOpacity>
            )}

            {properties.length === 0 ? (
              <View style={[styles.emptyCard, { paddingVertical: 48 }]}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🏠</Text>
                <Text style={styles.emptyText}>Aucune annonce publiée</Text>
              </View>
            ) : (
              properties.map(p => (
                <View key={p.id} style={styles.propDetailCard}>
                  <Image
                    source={{ uri: p.images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&q=60' }}
                    style={styles.propDetailImg}
                  />
                  <View style={{ flex: 1, padding: 12 }}>
                    <Text style={styles.propDetailTitle} numberOfLines={2}>{p.title}</Text>
                    <Text style={styles.propDetailCity}>{p.city}{p.district ? ` · ${p.district}` : ''}</Text>
                    <Text style={styles.propDetailPrice}>{formatPrice(p.price)}</Text>
                    <View style={styles.propStatsRow}>
                      <Ionicons name="eye-outline" size={12} color={COLORS.text3} /><Text style={styles.propStatText}>{p.stats?.views || 0}</Text>
                      <Ionicons name="heart-outline" size={12} color={COLORS.text3} /><Text style={styles.propStatText}>{p.stats?.likes || 0}</Text>
                      <Ionicons name="chatbubble-outline" size={12} color={COLORS.text3} /><Text style={styles.propStatText}>{p.stats?.whatsappClicks || 0}</Text>
                    </View>
                    <View style={styles.propActions}>
                      <TouchableOpacity
                        style={styles.propViewBtn}
                        onPress={() => navigation.navigate('PropertyDetail', { id: p.id })}
                      >
                        <Ionicons name="eye-outline" size={14} color={COLORS.teal} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.propDeleteBtn} onPress={() => handleDeleteProp(p.id)}>
                        <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── CONTRACTS ── */}
        {tab === 'contracts' && (
          <View style={styles.tabContent}>
            {contracts.length === 0 ? (
              <View style={[styles.emptyCard, { paddingVertical: 48 }]}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📝</Text>
                <Text style={styles.emptyText}>Aucun contrat généré</Text>
              </View>
            ) : (
              contracts.map(c => (
                <View key={c.id} style={styles.contractCard}>
                  <View style={styles.contractHeader}>
                    <View>
                      <Text style={styles.contractClient}>{c.clientName}</Text>
                      <Text style={styles.contractMeta}>
                        {c.type === 'sale' ? 'Compromis de vente' : c.type === 'rent' ? 'Location' : 'Mandat'} · {formatDate(c.createdAt)}
                      </Text>
                    </View>
                    <View style={[styles.contractBadge, c.status === 'signed' ? styles.contractSigned : styles.contractDraft]}>
                      <Text style={styles.contractBadgeText}>{c.status === 'signed' ? '✓ Signé' : 'Brouillon'}</Text>
                    </View>
                  </View>
                  <Text style={styles.contractContent} numberOfLines={3}>{c.content}</Text>
                  {c.status !== 'signed' && (
                    <TouchableOpacity style={styles.signBtn} onPress={() => handleSignContract(c.id)}>
                      <Text style={styles.signBtnText}>Signer le contrat</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && (
          <View style={styles.tabContent}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>{unread} non lue{unread > 1 ? 's' : ''}</Text>
              {unread > 0 && (
                <TouchableOpacity onPress={handleReadAll}>
                  <Text style={styles.markRead}>Tout marquer lu</Text>
                </TouchableOpacity>
              )}
            </View>
            {notifs.length === 0 ? (
              <View style={[styles.emptyCard, { paddingVertical: 48 }]}>
                <Ionicons name="notifications-off-outline" size={40} color={COLORS.text3} />
                <Text style={[styles.emptyText, { marginTop: 12 }]}>Aucune notification</Text>
              </View>
            ) : (
              notifs.map(n => (
                <View key={n.id} style={[styles.notifCard, !n.isRead && styles.notifUnread]}>
                  {!n.isRead && <View style={styles.unreadDot} />}
                  <Text style={styles.notifEmoji}>
                    {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : 'ℹ️'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                    <Text style={styles.notifDate}>{formatDate(n.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── PROFILE ── */}
        {tab === 'profile' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mon profil</Text>
              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 14 }} />

              {[
                { label: 'Nom complet', key: 'name', placeholder: 'Karim Bennani' },
                { label: 'Téléphone', key: 'phone', placeholder: '+212600000000' },
                { label: 'Ville', key: 'city', placeholder: 'Casablanca' },
              ].map(f => (
                <View key={f.key} style={styles.profileField}>
                  <Text style={styles.profileLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.profileInput}
                    value={profileForm[f.key as keyof typeof profileForm]}
                    onChangeText={v => setProfileForm(prev => ({ ...prev, [f.key]: v }))}
                    placeholder={f.placeholder}
                    placeholderTextColor={COLORS.text3}
                  />
                </View>
              ))}

              <View style={styles.profileField}>
                <Text style={styles.profileLabel}>Bio professionnelle</Text>
                <TextInput
                  style={[styles.profileInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                  value={profileForm.bio}
                  onChangeText={v => setProfileForm(prev => ({ ...prev, bio: v }))}
                  placeholder="Décrivez votre expertise..."
                  placeholderTextColor={COLORS.text3}
                  multiline
                />
              </View>

              <View style={styles.profileMeta}>
                <Text style={styles.profileMetaText}>Email: <Text style={{ color: COLORS.ink }}>{user?.email}</Text></Text>
                <Text style={[styles.profileMetaText, { marginTop: 4 }]}>
                  Plan: <Text style={{ color: agent?.planActive ? COLORS.teal : COLORS.danger, fontWeight: '700' }}>
                    {agent?.planActive ? 'Actif ✓' : 'Inactif'}
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, profileLoading && { opacity: 0.6 }]}
                onPress={handleProfileSave}
                disabled={profileLoading}
              >
                {profileLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutFullBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              <Text style={styles.logoutFullText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.pearl },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  logoutBtn: { padding: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  planActive: { backgroundColor: 'rgba(0,200,150,0.1)', borderColor: 'rgba(0,200,150,0.25)' },
  planInactive: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' },
  planText: { fontSize: 11, fontWeight: '700' },
  unreadBadge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  // tabsScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  // tabsRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  cityScroll: { backgroundColor: '#fff', maxHeight: 52,paddingVertical: 10},
  cityRow: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border,
  },
  tabBtnActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  content: { flex: 1 },
  tabContent: { padding: 16, gap: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statVal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { fontSize: 10, color: COLORS.text3, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  secStats: { flexDirection: 'row', gap: 8 },
  secStatCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  secStatIcon: { fontSize: 22 },
  secStatVal: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  secStatLbl: { fontSize: 10, color: COLORS.text3, marginTop: 1 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  seeAll: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: COLORS.border },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.text3, fontWeight: '500' },
  propRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  propThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.gray },
  propTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  propMeta: { fontSize: 11, color: COLORS.text3, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusActive: { backgroundColor: 'rgba(0,200,150,0.12)' },
  statusInactive: { backgroundColor: COLORS.pearl },
  statusText: { fontSize: 10, fontWeight: '700', color: COLORS.ink },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  warningText: { flex: 1, fontSize: 13, color: '#B45309', lineHeight: 18 },
  addPostBtn: {
    backgroundColor: COLORS.teal, borderRadius: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14,
    marginBottom: 16, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  addPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  propDetailCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    flexDirection: 'row',
  },
  propDetailImg: { width: 100, height: 120 },
  propDetailTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink, lineHeight: 18 },
  propDetailCity: { fontSize: 11, color: COLORS.text3, marginTop: 3 },
  propDetailPrice: { fontSize: 15, fontWeight: '800', color: COLORS.teal, marginTop: 4 },
  propStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  propStatText: { fontSize: 11, color: COLORS.text3, marginRight: 4 },
  propActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  propViewBtn: { padding: 7, backgroundColor: COLORS.tealPale, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,200,150,0.2)' },
  propDeleteBtn: { padding: 7, backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 9, borderWidth: 1, borderColor: 'rgba(239,68,68,0.15)' },
  contractCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  contractHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  contractClient: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  contractMeta: { fontSize: 12, color: COLORS.text3, marginTop: 2 },
  contractBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  contractSigned: { backgroundColor: 'rgba(0,200,150,0.1)' },
  contractDraft: { backgroundColor: 'rgba(245,158,11,0.1)' },
  contractBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.ink },
  contractContent: { fontSize: 11, color: COLORS.text3, fontFamily: 'monospace', backgroundColor: COLORS.pearl, padding: 10, borderRadius: 10, lineHeight: 16 },
  signBtn: { marginTop: 10, backgroundColor: COLORS.ink, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  signBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text2 },
  markRead: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },
  notifCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    position: 'relative',
  },
  notifUnread: { borderColor: 'rgba(0,200,150,0.25)', backgroundColor: 'rgba(0,200,150,0.03)' },
  unreadDot: {
    position: 'absolute', top: 16, right: 14,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal,
  },
  notifEmoji: { fontSize: 20, marginTop: 1 },
  notifMsg: { fontSize: 13, color: COLORS.ink, lineHeight: 18 },
  notifDate: { fontSize: 11, color: COLORS.text3, marginTop: 5 },
  profileField: { marginBottom: 14 },
  profileLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  profileInput: {
    backgroundColor: COLORS.pearl, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 46, fontSize: 14, color: COLORS.ink,
  },
  profileMeta: { paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 16 },
  profileMetaText: { fontSize: 12, color: COLORS.text3 },
  saveBtn: {
    backgroundColor: COLORS.teal, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center',
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutFullText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
});