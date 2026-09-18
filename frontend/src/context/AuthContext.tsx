import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

export interface CollegeInfo {
  domain: string;
  code: string;
  name: string;
  fullName: string;
  tagline: string;
}

export function getCollegeFromEmail(email?: string): CollegeInfo {
  if (!email || !email.includes('@')) {
    return {
      domain: 'iiitd.ac.in',
      code: 'IIITD',
      name: 'IIIT DELHI',
      fullName: 'Indraprastha Institute of Information Technology Delhi',
      tagline: 'IIIT DELHI (OKHLA PHASE-III)'
    };
  }
  const domain = email.split('@')[1].toLowerCase().trim();
  
  if (domain.includes('iiitd')) {
    return {
      domain,
      code: 'IIITD',
      name: 'IIIT DELHI',
      fullName: 'Indraprastha Institute of Information Technology Delhi',
      tagline: 'IIIT DELHI (OKHLA PHASE-III)'
    };
  } else if (domain.includes('dtu') || domain.includes('dce')) {
    return {
      domain,
      code: 'DTU',
      name: 'DTU DELHI',
      fullName: 'Delhi Technological University',
      tagline: 'DTU CAMPUS (ROHINI)'
    };
  } else if (domain.includes('iitd')) {
    return {
      domain,
      code: 'IITD',
      name: 'IIT DELHI',
      fullName: 'Indian Institute of Technology Delhi',
      tagline: 'IIT DELHI (HAUZ KHAS)'
    };
  } else if (domain.includes('nsut') || domain.includes('nsit')) {
    return {
      domain,
      code: 'NSUT',
      name: 'NSUT DELHI',
      fullName: 'Netaji Subhas University of Technology',
      tagline: 'NSUT CAMPUS (DWARKA)'
    };
  } else if (domain.includes('iitb')) {
    return {
      domain,
      code: 'IITB',
      name: 'IIT BOMBAY',
      fullName: 'Indian Institute of Technology Bombay',
      tagline: 'IIT BOMBAY (POWAI)'
    };
  } else if (domain.includes('bits')) {
    return {
      domain,
      code: 'BITS',
      name: 'BITS PILANI',
      fullName: 'Birla Institute of Technology and Science, Pilani',
      tagline: 'BITS PILANI CAMPUS'
    };
  } else if (domain.includes('stanford')) {
    return {
      domain,
      code: 'STANFORD',
      name: 'STANFORD UNIVERSITY',
      fullName: 'Stanford University',
      tagline: 'STANFORD CAMPUS'
    };
  } else if (domain.includes('mit')) {
    return {
      domain,
      code: 'MIT',
      name: 'MIT',
      fullName: 'Massachusetts Institute of Technology',
      tagline: 'MIT CAMPUS (CAMBRIDGE)'
    };
  } else if (domain.includes('berkeley')) {
    return {
      domain,
      code: 'BERKELEY',
      name: 'UC BERKELEY',
      fullName: 'University of California, Berkeley',
      tagline: 'UC BERKELEY CAMPUS'
    };
  }

  // Fallback: extract college token from domain (e.g. harvard.edu -> HARVARD)
  const parts = domain.split('.');
  const rawPrefix = (parts[0] || 'COLLEGE').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return {
    domain,
    code: rawPrefix.slice(0, 8),
    name: `${rawPrefix} CAMPUS`,
    fullName: `${rawPrefix} UNIVERSITY`,
    tagline: `${rawPrefix} CAMPUS`
  };
}

interface AuthContextType {
  user: UserProfile | null;
  college: CollegeInfo;
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

  const college = useMemo(() => getCollegeFromEmail(user?.email), [user?.email]);

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
    <AuthContext.Provider value={{ user, college, login, logout, updateUser }}>
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
