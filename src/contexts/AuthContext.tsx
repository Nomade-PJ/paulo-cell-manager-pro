
import React, { createContext, ReactNode, useState, useEffect, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabaseClient";
import { toast } from "sonner";

interface ProfileType {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  avatar_url?: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: ProfileType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: ProfileType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!authState.user) return;
    
    try {
      const profileData = await fetchUserProfile(authState.user.id);
      
      if (profileData) {
        setAuthState(prev => ({
          ...prev,
          profile: profileData,
        }));
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  useEffect(() => {
    // Função para inicializar a autenticação
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Primeiro atualizamos o estado com a sessão atual
        if (session) {
          setAuthState(prev => ({ 
            ...prev, 
            session, 
            user: session?.user || null, 
            isAuthenticated: true
          }));
          
          // Buscamos o perfil do usuário após confirmar a sessão
          const profileData = await fetchUserProfile(session.user.id);
          
          setAuthState(prev => ({ 
            ...prev, 
            profile: profileData || { id: session.user.id, email: session.user.email }, 
            isLoading: false 
          }));
        } else {
          // Se não houver sessão, garantimos que isLoading seja false
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false,
            isAuthenticated: false  
          }));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false
        }));
      }
    };

    // Configurar listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Atualizar estado de forma síncrona
        setAuthState(prev => ({ 
          ...prev, 
          session, 
          user: session?.user || null, 
          isAuthenticated: !!session 
        }));
        
        // Usar setTimeout para evitar deadlocks ao buscar o perfil do usuário
        if (session?.user) {
          setTimeout(async () => {
            const profileData = await fetchUserProfile(session.user.id);
            
            setAuthState(prev => ({ 
              ...prev, 
              profile: profileData || { id: session.user.id, email: session.user.email },
              isLoading: false 
            }));
          }, 0);
        } else {
          setAuthState(prev => ({ 
            ...prev, 
            profile: null, 
            isLoading: false,
            isAuthenticated: false
          }));
        }
      }
    );

    // Inicializar auth após configurar o listener
    initializeAuth();

    // Configurar subscription para mudanças no perfil
    const profileSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, async (payload) => {
        const updatedProfile = payload.new as ProfileType;
        if (authState.user && updatedProfile.id === authState.user.id) {
          setAuthState(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              ...updatedProfile
            }
          }));
        }
      })
      .subscribe();

    // Cleanup das subscriptions
    return () => {
      subscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Feedback de sucesso
      toast.success("Login realizado com sucesso!");
      return data;
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      toast.error("Falha no login: " + error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Erro de autenticação com Google:", error);
      toast.error("Falha no login com Google: " + error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      toast.success("Cadastro realizado! Verifique seu e-mail para confirmar.");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast.error("Falha no cadastro: " + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Falha ao fazer logout: " + error.message);
      throw error;
    }
  };

  const contextValue = {
    ...authState,
    login,
    loginWithGoogle,
    signup,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
