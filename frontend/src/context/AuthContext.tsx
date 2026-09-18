import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fomo_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('fomo_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fomo_user');
    }
  }, [user]);

  const login = async (email: string, name: string) => {
    try {
      const data = await api.login(email, name);
      setUser(data);
    } catch (error) {
      console.error('Login failed:', error);
      // Fallback for demo if API is down
      setUser({
        userId: 'demo-' + Date.now(),
        email,
        name,
        hasCompletedVibeCheck: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  const logout = () => {
    setUser(null);
  };
  
  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
