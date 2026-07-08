import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config';

const TOKEN_KEY = '@social_fit_token';
const USER_KEY = '@social_fit_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback(async (newToken) => {
    setTokenState(newToken);
    if (newToken) await AsyncStorage.setItem(TOKEN_KEY, newToken);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  const loadStored = useCallback(async () => {
    try {
      const t = await AsyncStorage.getItem(TOKEN_KEY);
      const u = await AsyncStorage.getItem(USER_KEY);
      if (t) {
        // Önbellekteki oturumu hemen geri yükle (hızlı/çevrimdışı açılış)
        setTokenState(t);
        if (u) setUser(JSON.parse(u));
        // Ardından token'ı doğrula: süresi dolmuş/geçersizse oturumu temizle
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else if (res.status === 401 || res.status === 403) {
            setTokenState(null);
            setUser(null);
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          }
        } catch (_netErr) {
          // Ağ hatası (ör. çevrimdışı): önbellekteki oturumu koru
        }
      }
    } catch (e) {
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStored(); }, [loadStored]);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Giriş başarısız');
    await setToken(data.token);
    setUser(data.user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }, [setToken]);

  const register = useCallback(async (email, password, displayName, phone) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Kayıt başarısız');
    await setToken(data.token);
    setUser(data.user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }, [setToken]);

  const logout = useCallback(async () => {
    setTokenState(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, [setToken]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      let data = null;
      try {
        data = await res.json();
      } catch (_j) {
        data = null;
      }
      if (res.ok) {
        setUser(data.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch {
      /* ignore refresh errors */
    }
  }, [token]);

  const value = { token, user, loading, login, register, logout, refreshUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
