
import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("paulocell_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("paulocell_user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Redirect unauthenticated users to login
    if (!isLoading && !user && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [user, isLoading, navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      // In real app, this would call the API: await fetch("/api/auth/login")
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === "admin@paulocell.com" && password === "admin123") {
        const userData: User = {
          id: "1",
          name: "Paulo Admin",
          email: "admin@paulocell.com",
          role: "admin"
        };
        
        setUser(userData);
        localStorage.setItem("paulocell_user", JSON.stringify(userData));
        toast.success("Login bem-sucedido!");
        navigate("/");
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error) {
      let message = "Falha no login";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("paulocell_user");
    toast.info("Sessão encerrada");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
