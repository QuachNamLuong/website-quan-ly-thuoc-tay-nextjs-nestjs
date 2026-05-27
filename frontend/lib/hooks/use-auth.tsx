'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/resources';
import { tokenStorage, ApiError } from '@/lib/api/client';
import type { AuthUser, PermissionKey } from '@/lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
  }) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: PermissionKey) => boolean;
  hasAnyPermission: (...permissions: PermissionKey[]) => boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStorage.clear();
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      tokenStorage.set(res.accessToken);
      setUser(res.user);
      router.push('/dashboard');
    },
    [router],
  );

  const register = useCallback(
    async (data: {
      email: string;
      username: string;
      password: string;
      fullName: string;
    }) => {
      const res = await authApi.register(data);
      tokenStorage.set(res.accessToken);
      setUser(res.user);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  const hasPermission = useCallback(
    (permission: PermissionKey) =>
      !!user?.permissions.includes(permission),
    [user],
  );

  const hasAnyPermission = useCallback(
    (...permissions: PermissionKey[]) =>
      permissions.some((p) => user?.permissions.includes(p)),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      hasPermission,
      hasAnyPermission,
      refresh,
    }),
    [user, isLoading, login, register, logout, hasPermission, hasAnyPermission, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
