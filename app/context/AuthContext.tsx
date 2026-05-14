import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

interface AuthContextType {
  user: any;
  agent: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshAgent: () => Promise<void>;
  hasSeenGreeting: boolean;
  completeGreeting: () => Promise<void>;
}

const Ctx = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [agent, setAgent] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasSeenGreeting, setHasSeenGreeting] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('samsar_has_seen_greeting');
      if (seen === 'true') setHasSeenGreeting(true);

      const t = await AsyncStorage.getItem('samsar_token');
      if (!t) { setLoading(false); return; }
      setToken(t);
      try {
        const { user: u, agent: a } = await api.me();
        setUser(u); setAgent(a);
      } catch {
        await AsyncStorage.removeItem('samsar_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { token: t, user: u, agent: a } = await api.login({ email, password });
    await AsyncStorage.setItem('samsar_token', t);
    setToken(t); setUser(u); setAgent(a);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('samsar_token');
    setToken(null); setUser(null); setAgent(null);
  };

  const refreshAgent = async () => {
    if (!token) return;
    const { agent: a } = await api.me();
    setAgent(a);
  };

  const completeGreeting = async () => {
    await AsyncStorage.setItem('samsar_has_seen_greeting', 'true');
    setHasSeenGreeting(true);
  };

  return (
    <Ctx.Provider value={{ user, agent, token, login, logout, isAuthenticated: !!user, loading, refreshAgent, hasSeenGreeting, completeGreeting }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}