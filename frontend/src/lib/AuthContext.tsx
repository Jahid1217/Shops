import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
  hasMenu: (menuKey: string) => boolean;
  hasFeature: (featureKey: string) => boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  hasMenu: () => false,
  hasFeature: () => false,
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
  const menuPermissions: string[] = profile?.menuPermissions || [];
  const featurePermissions: string[] = profile?.featurePermissions || [];

  const hasMenu = (menuKey: string) => {
    if (isAdmin) return true;
    return menuPermissions.includes(menuKey);
  };

  const hasFeature = (featureKey: string) => {
    if (isAdmin) return true;
    return featurePermissions.includes(featureKey);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, hasMenu, hasFeature, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
