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
      
      // Try to sign in directly with username as email first
      let authError = null;
      let authData = null;
      
      // First try: username as email
      const { data: directAuth, error: directError } = await supabase.auth.signInWithPassword({
        email: username,
        password
      });
      
      if (!directError && directAuth.user) {
        // Success with direct login
        authData = directAuth;
      } else {
        // Second try: find user by username to get their email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (profileError || !profile || !profile.email) {
          console.error('❌ LOGIN FAILED - Profile not found or no email:', profileError);
          return false;
        }

        console.log('✅ Profile found - Email:', profile.email, 'Role:', profile.role);
        
        const { data: profileAuth, error: profileAuthError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password
        });
        
        if (profileAuthError) {
          console.error('❌ SUPABASE AUTH ERROR:', profileAuthError.message, 'Code:', profileAuthError.status);
          return false;
        }
        
        authData = profileAuth;
      }

      if (authData?.user) {
        // Get the profile data for the authenticated user
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userProfile) {
          setUser({
            id: userProfile.id,
            username: userProfile.username,
            email: userProfile.email || authData.user.email || '',
            role: userProfile.role || 'user',
            joinedDate: userProfile.created_at
          });
        } else {
          // Fallback to auth user data
          setUser({
            id: authData.user.id,
            username: authData.user.user_metadata?.username || authData.user.email?.split('@')[0] || 'user',
            email: authData.user.email || '',
            role: 'user',
            joinedDate: authData.user.created_at || new Date().toISOString()
          });
        }
      }

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
      
      // Create profile entry if user was created successfully
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
          console.error('❌ PROFILE CREATION ERROR:', profileError.message);
          // Don't return false here as the user was created successfully
        } else {
          console.log('✅ PROFILE CREATED SUCCESSFULLY');
        }
      }
      
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