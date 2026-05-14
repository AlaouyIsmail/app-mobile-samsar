import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl, StatusBar, Alert, Linking,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/colors';
import { api, formatDate } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type AdminTab = 'dashboard' | 'pending' | 'agents' | 'properties';

const AVATAR_COLORS = [
  ['#e0f2f1', '#0d9488'], ['#fef3c7', '#d97706'], ['#ede9fe', '#7c3aed'],
  ['#fee2e2', '#dc2626'], ['#dbeafe', '#2563eb'],
];
function getAvatarColor(name = '') { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }

function AgentAvatar({ name, photo, size = 40 }: any) {
  const [bg, fg] = getAvatarColor(name);
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size * 0.25 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: fg, fontSize: size * 0.38, fontWeight: '800' }}>{name?.[0]?.toUpperCase()}</Text>
    </View>
  );
}

export default function AdminScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState<number | null>(null);

  const load = async () => {
    try {
      const [s, a, p] = await Promise.all([api.adminStats(), api.adminAgents(), api.adminProperties()]);
      setStats(s); setAgents(a); setPending(a.filter((ag: any) => !ag.planActive)); setProperties(p);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleActivate = async (id: number) => {
    setActivating(id);
    try { await api.activateAgent(id); await load(); } catch {}
    setActivating(null);
  };

  const handleDeactivate = (id: number) => {
    Alert.alert('Suspendre', 'Suspendre cet agent ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Suspendre', style: 'destructive', onPress: async () => { try { await api.deactivateAgent(id); await load(); } catch {} } },
    ]);
  };

  const TABS = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: 'grid-outline' },
    { id: 'pending' as AdminTab, label: 'En attente', icon: 'time-outline', badge: pending.length },
    { id: 'agents' as AdminTab, label: 'Agents', icon: 'people-outline' },
    { id: 'properties' as AdminTab, label: 'Annonces', icon: 'home-outline' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  const activePct = stats ? Math.round((stats.activeAgents / Math.max(stats.totalAgents, 1)) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0f1923', '#162130']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.teal} />
            </View>
            <View>
              <Text style={styles.headerSub}>Portail privé</Text>
              <Text style={styles.headerTitle}>Administration</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {pending.length > 0 && (
              <View style={styles.pendingIndicator}>
                <Text style={styles.pendingIndicatorText}>{pending.length} en attente</Text>
              </View>
            )}
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Tab bar */}
       <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityRow}
              style={styles.cityScroll}
            >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon as any} size={14} color={tab === t.id ? '#fff' : COLORS.text2} />
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            {!!t.badge && t.badge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{t.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>


      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />}
      >
        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <View style={styles.page}>
            {/* Stat cards */}
            <View style={styles.statsGrid}>
              {[
                { l: 'Total agents', v: stats?.totalAgents ?? 0, icon: 'people', color: COLORS.ink, bg: 'rgba(10,15,30,0.06)' },
                { l: 'Agents actifs', v: stats?.activeAgents ?? 0, icon: 'person-circle', color: COLORS.teal, bg: 'rgba(0,200,150,0.08)' },
                { l: 'En attente', v: stats?.pendingAgents ?? 0, icon: 'time', color: COLORS.amber, bg: 'rgba(245,158,11,0.08)' },
                { l: 'Revenu/mois', v: `${(stats?.monthlyRevenue ?? 0).toLocaleString()} MAD`, icon: 'cash', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
              ].map(s => (
                <View key={s.l} style={[styles.statCard, { backgroundColor: '#fff' }]}>
                  <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.v}</Text>
                  <Text style={styles.statLbl}>{s.l}</Text>
                </View>
              ))}
            </View>

            {/* Activation rate */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Taux d'activation</Text>
              <View style={styles.activationRow}>
                <View style={styles.activationBarWrap}>
                  <View style={[styles.activationBar, { width: `${activePct}%` as any }]} />
                </View>
                <Text style={styles.activationPct}>{activePct}%</Text>
              </View>
              <View style={styles.activationLegend}>
                {[
                  { l: 'Actifs', v: stats?.activeAgents ?? 0, color: COLORS.teal },
                  { l: 'En attente', v: stats?.pendingAgents ?? 0, color: COLORS.amber },
                  { l: 'Total', v: stats?.totalAgents ?? 0, color: COLORS.text3 },
                ].map(r => (
                  <View key={r.l} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: r.color }]} />
                    <Text style={styles.legendLabel}>{r.l}</Text>
                    <Text style={styles.legendVal}>{r.v}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent agents */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Agents récents</Text>
                <TouchableOpacity onPress={() => setTab('agents')}>
                  <Text style={styles.seeAll}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
              {agents.slice(0, 4).map(a => (
                <View key={a.id} style={styles.agentRow}>
                  <AgentAvatar name={a.name} photo={a.photo} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{a.name}</Text>
                    <Text style={styles.agentEmail} numberOfLines={1}>{a.email}</Text>
                  </View>
                  <View style={[styles.badge, a.planActive ? styles.badgeActive : styles.badgePending]}>
                    <Text style={styles.badgeText}>{a.planActive ? '● Actif' : '⏳'}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Revenue card */}
            <LinearGradient colors={['#0A0F1E', '#111827']} style={styles.revenueCard}>
              <View style={styles.revenueTop}>
                <View>
                  <Text style={styles.revenueLbl}>REVENU MENSUEL</Text>
                  <Text style={styles.revenueAmt}>{(stats?.monthlyRevenue ?? 0).toLocaleString()}</Text>
                  <Text style={styles.revenueCur}>MAD ce mois</Text>
                </View>
                <Ionicons name="trending-up" size={28} color={COLORS.teal} />
              </View>
              <View style={styles.revenueGrid}>
                {[
                  { l: 'Trimestre', v: ((stats?.monthlyRevenue ?? 0) * 3).toLocaleString() },
                  { l: 'Semestre', v: ((stats?.monthlyRevenue ?? 0) * 6).toLocaleString() },
                  { l: 'Année', v: ((stats?.monthlyRevenue ?? 0) * 12).toLocaleString() },
                ].map(r => (
                  <View key={r.l} style={styles.revenueItem}>
                    <Text style={styles.revenueItemLbl}>{r.l}</Text>
                    <Text style={styles.revenueItemVal}>{r.v} MAD</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* ── PENDING ── */}
        {tab === 'pending' && (
          <View style={styles.page}>
            <Text style={styles.pageDesc}>
              <Text style={{ fontWeight: '700', color: COLORS.ink }}>{pending.length}</Text> agent{pending.length !== 1 ? 's' : ''} en attente de validation
            </Text>
            {pending.length === 0 ? (
              <View style={[styles.card, styles.emptyCard]}>
                <Ionicons name="checkmark-circle" size={40} color="rgba(0,200,150,0.3)" />
                <Text style={styles.emptyTitle}>Tout est traité ✓</Text>
                <Text style={styles.emptyText}>Aucun agent en attente</Text>
              </View>
            ) : (
              pending.map(a => {
                const waMsg = encodeURIComponent(`Bonjour ${a.name}, votre compte SAMSAR est activé ! Connectez-vous sur samsar.ma 🎉`);
                const waLink = a.phone ? `https://wa.me/${a.phone.replace(/[^\d]/g, '')}?text=${waMsg}` : null;
                return (
                  <View key={a.id} style={styles.pendingCard}>
                    <View style={styles.pendingTop}>
                      <AgentAvatar name={a.name} photo={a.photo} size={44} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.pendingNameRow}>
                          <Text style={styles.pendingName}>{a.name}</Text>
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>⏳ En attente</Text>
                          </View>
                        </View>
                        <Text style={styles.pendingEmail}>{a.email}</Text>
                      </View>
                    </View>
                    <View style={styles.pendingMeta}>
                      {a.city && <View style={styles.metaChip}><Text style={styles.metaChipText}>📍 {a.city}</Text></View>}
                      {a.phone && <View style={styles.metaChip}><Text style={styles.metaChipText}>📱 {a.phone}</Text></View>}
                    </View>
                    <Text style={styles.pendingDate}>Inscrit le {formatDate(a.createdAt)}</Text>
                    <View style={styles.pendingActions}>
                      {waLink && (
                        <TouchableOpacity style={styles.waBtn} onPress={() => Linking.openURL(waLink)}>
                          <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                          <Text style={styles.waBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.activateBtn, activating === a.id && { opacity: 0.6 }]}
                        onPress={() => handleActivate(a.id)}
                        disabled={activating === a.id}
                      >
                        {activating === a.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <>
                              <Ionicons name="flash" size={14} color="#fff" />
                              <Text style={styles.activateBtnText}>Activer +30j</Text>
                            </>
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── AGENTS ── */}
        {tab === 'agents' && (
          <View style={styles.page}>
            <Text style={styles.pageDesc}><Text style={{ fontWeight: '700', color: COLORS.ink }}>{agents.length}</Text> agents inscrits</Text>
            {agents.map(a => (
              <View key={a.id} style={styles.agentDetailCard}>
                <View style={styles.agentDetailTop}>
                  <AgentAvatar name={a.name} photo={a.photo} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentDetailName}>{a.name}</Text>
                    <Text style={styles.agentDetailEmail} numberOfLines={1}>{a.email}</Text>
                    <Text style={styles.agentDetailCity}>{a.city || '—'} · {a.propertyCount || 0} annonces</Text>
                  </View>
                  <View style={[styles.badge, a.planActive ? styles.badgeActive : styles.badgePending]}>
                    <Text style={styles.badgeText}>{a.planActive ? '● Actif' : '⏳'}</Text>
                  </View>
                </View>
                <View style={styles.agentDetailActions}>
                  {!a.planActive
                    ? <TouchableOpacity style={styles.activateBtn} onPress={() => handleActivate(a.id)}>
                        <Ionicons name="flash" size={13} color="#fff" />
                        <Text style={styles.activateBtnText}>Activer</Text>
                      </TouchableOpacity>
                    : <TouchableOpacity style={styles.suspendBtn} onPress={() => handleDeactivate(a.id)}>
                        <Ionicons name="ban" size={13} color={COLORS.danger} />
                        <Text style={styles.suspendBtnText}>Suspendre</Text>
                      </TouchableOpacity>
                  }
                  {a.phone && (
                    <TouchableOpacity style={styles.waBtn} onPress={() => Linking.openURL(`tel:${a.phone}`)}>
                      <Ionicons name="call-outline" size={13} color={COLORS.teal} />
                      <Text style={[styles.waBtnText, { color: COLORS.teal }]}>Appeler</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── PROPERTIES ── */}
        {tab === 'properties' && (
          <View style={styles.page}>
            <View style={styles.propPageHeader}>
              <Text style={styles.pageDesc}><Text style={{ fontWeight: '700', color: COLORS.ink }}>{properties.length}</Text> annonces</Text>
              <View style={styles.propActiveBadge}>
                <Text style={styles.propActiveBadgeText}>● {properties.filter((p: any) => p.status === 'AVAILABLE').length} actives</Text>
              </View>
            </View>
            {properties.map((p: any) => (
              <View key={p.id} style={styles.propCard}>
                <Image
                  source={{ uri: p.images?.[0] || 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&q=60' }}
                  style={styles.propCardImg}
                />
                <View style={{ flex: 1, padding: 10 }}>
                  <Text style={styles.propCardTitle} numberOfLines={2}>{p.title}</Text>
                  <Text style={styles.propCardCity}>{p.city}</Text>
                  <Text style={styles.propCardPrice}>{p.price?.toLocaleString()} MAD</Text>
                </View>
                <View style={[styles.badge, p.status === 'AVAILABLE' ? styles.badgeActive : styles.badgeDone, { alignSelf: 'flex-start', margin: 10 }]}>
                  <Text style={styles.badgeText}>{p.status === 'AVAILABLE' ? '● Actif' : 'Inactif'}</Text>
                </View>
              </View>
            ))}
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
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,200,150,0.15)',
    borderWidth: 1, borderColor: 'rgba(0,200,150,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pendingIndicator: {
    backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  pendingIndicatorText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  logoutBtn: { padding: 6 },
   cityScroll: { backgroundColor: '#fff', maxHeight: 52,paddingVertical: 10},
  cityRow: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 4, borderRadius: 14,
    backgroundColor: COLORS.pearl, borderWidth: 1, borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  tabBtnActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.text2 },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  page: { padding: 16, gap: 12 },
  pageDesc: { fontSize: 13, color: COLORS.text2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { fontSize: 11, color: COLORS.text3, fontWeight: '600', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink, marginBottom: 12 },
  seeAll: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },
  emptyCard: { alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text2 },
  emptyText: { fontSize: 13, color: COLORS.text3 },
  activationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  activationBarWrap: { flex: 1, height: 8, backgroundColor: COLORS.gray, borderRadius: 4, overflow: 'hidden' },
  activationBar: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 4 },
  activationPct: { fontSize: 14, fontWeight: '800', color: COLORS.ink, width: 36, textAlign: 'right' },
  activationLegend: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, fontSize: 12, color: COLORS.text2 },
  legendVal: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  agentName: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  agentEmail: { fontSize: 11, color: COLORS.text3, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeActive: { backgroundColor: 'rgba(0,200,150,0.1)' },
  badgePending: { backgroundColor: 'rgba(245,158,11,0.1)' },
  badgeDone: { backgroundColor: COLORS.pearl },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.ink },
  revenueCard: { borderRadius: 20, padding: 20 },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  revenueLbl: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  revenueAmt: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  revenueCur: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  revenueGrid: { gap: 8 },
  revenueItem: { flexDirection: 'row', justifyContent: 'space-between' },
  revenueItemLbl: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  revenueItemVal: { color: COLORS.teal, fontSize: 13, fontWeight: '700' },
  pendingCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  pendingTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  pendingNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  pendingName: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  pendingBadge: { backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  pendingBadgeText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  pendingEmail: { fontSize: 12, color: COLORS.text3 },
  pendingMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  metaChip: { backgroundColor: COLORS.pearl, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metaChipText: { fontSize: 11, color: COLORS.text2, fontWeight: '500' },
  pendingDate: { fontSize: 11, color: COLORS.text3, marginBottom: 12 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(37,211,102,0.1)', borderWidth: 1, borderColor: 'rgba(37,211,102,0.2)',
  },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  activateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12, backgroundColor: COLORS.teal,
  },
  activateBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  suspendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  suspendBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.danger },
  agentDetailCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  agentDetailTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  agentDetailName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  agentDetailEmail: { fontSize: 11, color: COLORS.text3, marginTop: 1 },
  agentDetailCity: { fontSize: 11, color: COLORS.text3, marginTop: 1 },
  agentDetailActions: { flexDirection: 'row', gap: 8 },
  propPageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propActiveBadge: { backgroundColor: 'rgba(0,200,150,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  propActiveBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.teal },
  propCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    flexDirection: 'row',
  },
  propCardImg: { width: 90, height: 90 },
  propCardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
  propCardCity: { fontSize: 11, color: COLORS.text3, marginTop: 3 },
  propCardPrice: { fontSize: 14, fontWeight: '800', color: COLORS.teal, marginTop: 4 },
});