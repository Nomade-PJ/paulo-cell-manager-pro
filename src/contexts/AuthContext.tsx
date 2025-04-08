
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthError } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Configure o listener de eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Verifique a sessão atual
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Buscar perfil do usuário do Supabase
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  useEffect(() => {
    // Redirecionar usuários não autenticados para login
    if (!isLoading && !user && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [user, isLoading, navigate, location.pathname]);

  const handleAuthError = (error: AuthError) => {
    let message = "Erro na autenticação";
    
    if (error.message.includes("Email not confirmed")) {
      message = "Email não confirmado. Por favor, verifique sua caixa de entrada.";
    } else if (error.message.includes("Invalid login credentials")) {
      message = "Credenciais inválidas. Verifique seu email e senha.";
    } else if (error.message.includes("User already registered")) {
      message = "Este email já está registrado.";
    } else if (error.message) {
      message = error.message;
    }
    
    toast.error(message);
    console.error("Erro de autenticação:", error);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      toast.success("Login bem-sucedido!");
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error as AuthError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error as AuthError);
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Cadastro realizado! Verifique seu email para confirmar.");
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error as AuthError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.info("Sessão encerrada");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      loginWithGoogle,
      logout,
      signUp
    }}>
      {children}
    </AuthContext.Provider>
  );
};
