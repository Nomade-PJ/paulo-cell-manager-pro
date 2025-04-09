
import { createContext, ReactNode, useState, useEffect, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Set up authentication state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({ ...prev, session, user: session?.user || null, isAuthenticated: !!session }));
        
        if (session?.user) {
          try {
            // Explicitly type the table access
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) throw error;
            
            setAuthState(prev => ({ 
              ...prev, 
              profile: data, 
              isLoading: false 
            }));
          } catch (error) {
            console.error("Error fetching user profile:", error);
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, profile: null, isLoading: false }));
        }
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      setAuthState(prev => ({ 
        ...prev, 
        session, 
        user: session?.user || null, 
        isAuthenticated: !!session,
      }));

      if (session?.user) {
        try {
          // Explicitly type the table access
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          
          setAuthState(prev => ({ 
            ...prev, 
            profile: data, 
            isLoading: false 
          }));
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
