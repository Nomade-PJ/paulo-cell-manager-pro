
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, getCurrentUserOrganizationId } from '@/integrations/supabaseClient';
import { Organization } from '@/types';
import { toast } from 'sonner';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  isLoading: boolean;
  createOrganization: (name: string) => Promise<Organization | null>;
  updateOrganization: (id: string, name: string) => Promise<Organization | null>;
  setCurrentOrganizationForUser: (organizationId: string) => Promise<boolean>;
  userHasOrganization: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasOrganization, setUserHasOrganization] = useState(false);

  useEffect(() => {
    const loadOrganization = async () => {
      setIsLoading(true);
      try {
        const orgId = await getCurrentUserOrganizationId();
        
        if (orgId) {
          const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();
            
          if (error) throw error;
          
          setCurrentOrganization(data as Organization);
          setUserHasOrganization(true);
        } else {
          setUserHasOrganization(false);
        }
      } catch (error) {
        console.error("Failed to load organization:", error);
        setUserHasOrganization(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Load organization when user authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadOrganization();
    });
    
    loadOrganization();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const createOrganization = async (name: string): Promise<Organization | null> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        toast.error("Você precisa estar autenticado para criar uma organização");
        return null;
      }
      
      // Insert the new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name }])
        .select('*')
        .single();
        
      if (orgError) throw orgError;
      
      // Update the user's profile with the organization ID
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: orgData.id })
        .eq('id', authData.user.id);
        
      if (profileError) throw profileError;
      
      setCurrentOrganization(orgData as Organization);
      setUserHasOrganization(true);
      
      toast.success("Organização criada com sucesso!");
      return orgData as Organization;
    } catch (error) {
      console.error("Failed to create organization:", error);
      toast.error("Erro ao criar organização");
      return null;
    }
  };
  
  const updateOrganization = async (id: string, name: string): Promise<Organization | null> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
        
      if (error) throw error;
      
      setCurrentOrganization(data as Organization);
      toast.success("Organização atualizada com sucesso!");
      return data as Organization;
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Erro ao atualizar organização");
      return null;
    }
  };
  
  const setCurrentOrganizationForUser = async (organizationId: string): Promise<boolean> => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        toast.error("Você precisa estar autenticado para selecionar uma organização");
        return false;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', authData.user.id);
        
      if (error) throw error;
      
      // Reload the organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
        
      if (orgError) throw orgError;
      
      setCurrentOrganization(orgData as Organization);
      setUserHasOrganization(true);
      
      toast.success("Organização selecionada com sucesso!");
      return true;
    } catch (error) {
      console.error("Failed to set current organization:", error);
      toast.error("Erro ao selecionar organização");
      return false;
    }
  };
  
  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        isLoading,
        createOrganization,
        updateOrganization,
        setCurrentOrganizationForUser,
        userHasOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
