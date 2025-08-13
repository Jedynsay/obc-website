import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string, role: User['role']) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false, no loading

  useEffect(() => {
    // Force guest mode - no authentication loading
    console.log('🚪 FORCED GUEST MODE - No authentication loading');
    setUser(null);
    setLoading(false);
    
    // Clear any existing session silently, but only if one exists
    const clearSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }
      } catch (error) {
        // Ignore errors, we just want to be logged out
        console.log('Session cleanup completed');
      }
    };
    
    clearSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 LOGIN ATTEMPT - Username:', username);
      
      // First, find the user by username to get their email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError || !profile) {
        console.error('❌ LOGIN FAILED - Profile not found:', profileError);
        return false;
      }

      console.log('✅ Profile found - Email:', profile.email, 'Role:', profile.role);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      });
      
      if (error) {
        console.error('❌ SUPABASE AUTH ERROR:', error.message, 'Code:', error.status);
        return false;
      }

      // Set user immediately after successful login
      setUser({
        id: profile.id,
        username: profile.username,
        email: profile.email || '',
        role: profile.role || 'user',
        joinedDate: profile.created_at
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (username: string, email: string, password: string, role: User['role']): Promise<boolean> => {
    try {
      console.log('📝 SIGNUP ATTEMPT - Username:', username, 'Email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) {
        console.error('❌ SUPABASE SIGNUP ERROR:', error.message, 'Code:', error.status);
        return false;
      }
      
      console.log('✅ SUPABASE SIGNUP SUCCESS:', {
        user_id: data.user?.id,
        email: data.user?.email,
        email_confirmed: data.user?.email_confirmed_at,
        user_metadata: data.user?.user_metadata
      });
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    console.log('🚪 LOGGED OUT - Back to guest mode');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}