"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiBase } from "./env";
import {
  getAccessToken, refreshAccessToken, setSignedOutListener,
  logout as tokenLogout, loginUrl,
} from "./auth-token";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true,
  login: () => {}, logout: async () => {}, refetch: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.ok ? await res.json() : null);
    } catch {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setSignedOutListener(() => setUser(null));
    fetchMe();
    return () => setSignedOutListener(null);
  }, [fetchMe]);

  const login = useCallback(() => {
    window.location.href = loginUrl();
  }, []);

  const logout = useCallback(async () => {
    await tokenLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
