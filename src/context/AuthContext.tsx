import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { request, setStoredToken, getStoredToken } from '../utils/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (playerCode: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  registerTeam: (teamName: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  updateTeam: (teamName: string) => Promise<{ success: boolean; user?: User; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await request<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch (err) {
      setUser(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (playerCode: string, password: string) => {
    try {
      const res = await request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ player_code: playerCode, password }),
      });

      if (res.success && res.user) {
        setStoredToken(res.token);
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Authentication error' };
    }
  };

  const registerTeam = async (teamName: string) => {
    try {
      const res = await request<{ success: boolean; user: User; message?: string }>('/auth/team', {
        method: 'POST',
        body: JSON.stringify({ teamName }),
      });
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Failed to register team name.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to register team name.' };
    }
  };

  const updateTeam = async (teamName: string) => {
    try {
      const res = await request<{ success: boolean; user: User; message?: string }>('/auth/team', {
        method: 'PATCH',
        body: JSON.stringify({ teamName }),
      });
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Failed to update team name.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update team name.' };
    }
  };

  const logout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setStoredToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, registerTeam, updateTeam }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
