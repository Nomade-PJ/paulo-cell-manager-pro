import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabaseClient";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const { user } = useAuth();

  const updateThemeColors = (theme: Theme) => {
    if (theme === 'dark') {
      document.documentElement.style.setProperty('--background', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--card', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--card-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--popover', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--popover-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--primary', '210 40% 98%');
      document.documentElement.style.setProperty('--primary-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--secondary', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--secondary-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--muted', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--muted-foreground', '215 20.2% 65.1%');
      document.documentElement.style.setProperty('--accent', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--accent-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--destructive', '0 62.8% 30.6%');
      document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--border', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--input', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--ring', '224.3 76.3% 48%');
      
      document.documentElement.style.setProperty('--sidebar-background', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--sidebar-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--sidebar-border', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--sidebar-primary', '210 40% 98%');
      document.documentElement.style.setProperty('--sidebar-primary-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--sidebar-accent', '217.2 32.6% 17.5%');
      document.documentElement.style.setProperty('--sidebar-accent-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--sidebar-ring', '224.3 76.3% 48%');
    } else {
      document.documentElement.style.setProperty('--background', '0 0% 100%');
      document.documentElement.style.setProperty('--foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--card', '0 0% 100%');
      document.documentElement.style.setProperty('--card-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--popover', '0 0% 100%');
      document.documentElement.style.setProperty('--popover-foreground', '222.2 84% 4.9%');
      document.documentElement.style.setProperty('--primary', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--primary-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--secondary', '210 40% 96.1%');
      document.documentElement.style.setProperty('--secondary-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--muted', '210 40% 96.1%');
      document.documentElement.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
      document.documentElement.style.setProperty('--accent', '210 40% 96.1%');
      document.documentElement.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--destructive', '0 84.2% 60.2%');
      document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--border', '214.3 31.8% 91.4%');
      document.documentElement.style.setProperty('--input', '214.3 31.8% 91.4%');
      document.documentElement.style.setProperty('--ring', '222.2 84% 4.9%');
      
      document.documentElement.style.setProperty('--sidebar-background', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--sidebar-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--sidebar-border', '215.4 16.3% 56.9%');
      document.documentElement.style.setProperty('--sidebar-primary', '210 40% 98%');
      document.documentElement.style.setProperty('--sidebar-primary-foreground', '222.2 47.4% 11.2%');
      document.documentElement.style.setProperty('--sidebar-accent', '213 27% 22%');
      document.documentElement.style.setProperty('--sidebar-accent-foreground', '210 40% 98%');
      document.documentElement.style.setProperty('--sidebar-ring', '210 40% 98%');
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    updateThemeColors(newTheme);

    // If user is logged in, update their theme preference in the database
    if (user) {
      try {
        await supabase
          .from('settings')
          .upsert({
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString(),
          });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };

  // Load theme from local storage or database on mount
  useEffect(() => {
    const loadTheme = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('settings')
            .select('theme')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            const savedTheme = data.theme as Theme;
            setThemeState(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            updateThemeColors(savedTheme);
          }
        } catch (error) {
          console.error('Error loading theme from database:', error);
        }
      } else {
        // For non-authenticated users, could use localStorage
        const localTheme = localStorage.getItem('theme') as Theme | null;
        if (localTheme) {
          setThemeState(localTheme);
          document.documentElement.classList.toggle('dark', localTheme === 'dark');
          updateThemeColors(localTheme);
        }
      }
    };

    loadTheme();
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 