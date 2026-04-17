import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('stockmaster_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Fetch fresh profile from API
      fetchProfile(parsedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userData: any) => {
    try {
      const profileData = await api.get<any>('/users/me');
      setProfile(profileData);
      // Update local storage with fresh data but keep token
      localStorage.setItem('stockmaster_user', JSON.stringify({ ...profileData, token: userData.token }));
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: any) => {
    setUser(userData);
    setProfile(userData);
    localStorage.setItem('stockmaster_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('stockmaster_user');
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
