import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Si on est sur le Web (bouton 'w' sur expo), on utilise localhost pour éviter les blocages CORS.
// Si on est sur téléphone/émulateur, on utilise l'IP locale.
const BASE = Platform.OS === 'web' 
  ? 'http://localhost:3001/api' 
  : 'http://192.168.3.191:3001/api';

async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem('samsar_token');
}

async function req(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const isFormData = opts.body instanceof FormData;
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const e = await res.json();
      msg = Array.isArray(e.message) ? e.message[0] : e.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  register: (d: any) => req('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  login: (d: any) => req('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
  me: () => req('/auth/me'),
  getProperties: (params = '') => req(`/properties?${params}`),
  getProperty: (id: any) => req(`/properties/${id}`),
  likeProperty: (id: any) => req(`/properties/${id}/like`, { method: 'POST' }),
  saveProperty: (id: any) => req(`/properties/${id}/save`, { method: 'POST' }),
  whatsappClick: (id: any) => req(`/properties/${id}/whatsapp-click`, { method: 'POST' }),
  createProperty: (d: any) => req('/properties', { method: 'POST', body: JSON.stringify(d) }),
  deleteProperty: (id: number) => req(`/properties/${id}`, { method: 'DELETE' }),
  agentDashboard: () => req('/agent/dashboard'),
  agentNotifications: () => req('/agent/notifications'),
  readAllNotifications: () => req('/agent/notifications/read-all', { method: 'POST' }),
  updateAgentProfile: (d: any) => req('/agent/profile', { method: 'PATCH', body: JSON.stringify(d) }),
  getContracts: () => req('/contracts'),
  createContract: (d: any) => req('/contracts', { method: 'POST', body: JSON.stringify(d) }),
  signContract: (id: number) => req(`/contracts/${id}/sign`, { method: 'POST' }),
  adminStats: () => req('/admin/stats'),
  adminAgents: () => req('/admin/agents'),
  activateAgent: (id: number) => req(`/admin/activate-agent/${id}`, { method: 'POST' }),
  deactivateAgent: (id: number) => req(`/admin/deactivate-agent/${id}`, { method: 'POST' }),
  adminProperties: () => req('/admin/properties'),
  sendNotification: (d: any) => req('/admin/notify', { method: 'POST', body: JSON.stringify(d) }),
  pendingAgents: () => req('/admin/agents/pending'),
};

export const formatPrice = (p: number): string =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(p);

export const formatDate = (d: any): string =>
  new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));