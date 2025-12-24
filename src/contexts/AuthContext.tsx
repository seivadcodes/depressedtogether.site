// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AuthContextType = {
  user: { id: string; name: string; email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user persistence (replace with real auth later)
const getStoredUser = (): AuthContextType['user'] => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('healingshoulder_user');
  return saved ? JSON.parse(saved) : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockUser = { id: '1', name: email.split('@')[0], email };
    localStorage.setItem('healingshoulder_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('healingshoulder_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};