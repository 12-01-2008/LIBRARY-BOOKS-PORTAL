import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseClientConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLibrarian: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoLibrarian: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('library_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('library_token');
      const savedUser = localStorage.getItem('library_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        } catch {
          localStorage.removeItem('library_token');
          localStorage.removeItem('library_user');
        }
      }

      if (isSupabaseClientConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profileRes = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', session.user.id)
            .single();

          const role = profileRes.data?.role || 'student';
          const userProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role,
            name: profileRes.data?.name || session.user.email?.split('@')[0]
          };

          setUser(userProfile);
          setToken(session.access_token);
          localStorage.setItem('library_token', session.access_token);
          localStorage.setItem('library_user', JSON.stringify(userProfile));
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // If Supabase is configured, use standard Supabase Auth
    if (isSupabaseClientConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.session && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', data.user.id)
            .single();

          if (profile?.role !== 'librarian') {
            await supabase.auth.signOut();
            setIsLoading(false);
            return { success: false, error: 'Access denied. Account does not have librarian privileges.' };
          }

          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            role: 'librarian',
            name: profile?.name || email.split('@')[0]
          };

          setUser(userProfile);
          setToken(data.session.access_token);
          localStorage.setItem('library_token', data.session.access_token);
          localStorage.setItem('library_user', JSON.stringify(userProfile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Authentication failed' };
      }
    }

    // If Supabase is configured, mock demo credentials are strictly prohibited
    if (isSupabaseClientConfigured) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Invalid email or password. (Demo login is disabled because Supabase authentication is active).'
      };
    }

    // Fallback demo authentication ONLY when Supabase is NOT configured (offline / evaluation preview)
    if (email.toLowerCase() === 'librarian@campus.edu' && (password === 'campus2026' || password === 'admin' || password === '1234')) {
      const demoUser: UserProfile = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'librarian@campus.edu',
        role: 'librarian',
        name: 'Dr. Evelyn Vance (Chief Librarian)'
      };
      const demoToken = 'demo-librarian-token-2026';
      setUser(demoUser);
      setToken(demoToken);
      localStorage.setItem('library_token', demoToken);
      localStorage.setItem('library_user', JSON.stringify(demoUser));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { 
      success: false, 
      error: 'Invalid credentials. For quick evaluation in preview mode, use Demo Librarian button or librarian@campus.edu / campus2026' 
    };
  };

  const loginAsDemoLibrarian = () => {
    if (isSupabaseClientConfigured) {
      console.warn('Demo login blocked: Supabase credentials are configured.');
      return;
    }
    const demoUser: UserProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'librarian@campus.edu',
      role: 'librarian',
      name: 'Dr. Evelyn Vance (Chief Librarian)'
    };
    const demoToken = 'demo-librarian-token-2026';
    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem('library_token', demoToken);
    localStorage.setItem('library_user', JSON.stringify(demoUser));
  };

  const logout = async () => {
    if (isSupabaseClientConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('library_token');
    localStorage.removeItem('library_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLibrarian: user?.role === 'librarian',
        isLoading,
        isSupabaseConfigured: isSupabaseClientConfigured,
        login,
        loginAsDemoLibrarian,
        logout,
      }}
    >
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
