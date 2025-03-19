// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, AuthResponse, logout } from '../services/authService';
import { UserDetails } from '../services/appointmentService';

interface AuthContextType {
  currentUser: User | Audiologist | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void;
  setCurrentUser: (user: User | Audiologist | null) => void;
}

interface WorkHours {
  start: string;
  end: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  image?: string;
  details?: UserDetails;
}


interface Audiologist {
  id: string;
  name: string;
  image: string;
  description: string;
  qualifications: string;
  email: string;
  phone: string;
  workSchedule: Record<string, WorkHours>;
  details?: UserDetails;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | Audiologist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load user from localStorage on component mount
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    isAuthenticated: !!currentUser?.email,
    loading,
    logout: () => {
      logout();
      setCurrentUser(null);
    },
    setCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};