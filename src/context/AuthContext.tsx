import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string, role: User['role']) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false, no loading

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .limit(1);

          if (profile && profile.length > 0) {
            setUser({
              id: profile[0].id,
              username: profile[0].username,
              email: profile[0].email || '',
              role: profile[0].role || 'user',
              joinedDate: profile[0].created_at
            });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Clear any invalid session data
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .limit(1);

          if (profile && profile.length > 0) {
            setUser({
              id: profile[0].id,
              username: profile[0].username,
              email: profile[0].email || '',
              role: profile[0].role || 'user',
              joinedDate: profile[0].created_at
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .limit(1);

      if (profileError) {
        return false;
      }

      if (!profiles || profiles.length === 0) {
        return false;
      }

      const profile = profiles[0];
      
      if (!profile.email) {
        return false;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      });
      
      if (authError) {
        return false;
      }

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
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        return false;
      }

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
        return false;
      }
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            email,
            role
          });

        if (profileError) {
          console.error('Profile creation error:', profileError.message);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, setUser }}>
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