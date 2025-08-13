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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔍 Checking initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Found session for user:', session.user.id);
          
          // Try to get profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profile && !profileError) {
            console.log('✅ Profile loaded:', profile.username);
            setUser({
              id: profile.id,
              username: profile.username,
              email: profile.email || session.user.email || '',
              role: profile.role || 'user',
              joinedDate: profile.created_at
            });
          } else {
            console.log('❌ No profile found, clearing user');
            setUser(null);
          }
        } else {
          console.log('🚪 No session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
      } finally {
        console.log('✅ Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          setUser({
            id: profile.id,
            username: profile.username,
            email: profile.email || session.user.email || '',
            role: profile.role || 'user',
            joinedDate: profile.created_at
          });
        }
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
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
      return !error;
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