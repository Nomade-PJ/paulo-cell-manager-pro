
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganization } from '@/contexts/OrganizationContext';
import { BuildingIcon } from 'lucide-react';
import { toast } from 'sonner';

export function OrganizationSetup() {
  const [organizationName, setOrganizationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrganization, userHasOrganization } = useOrganization();
  const navigate = useNavigate();

  // If user already has an organization, redirect to dashboard
  useEffect(() => {
    if (userHasOrganization) {
      navigate('/dashboard', { replace: true });
    }
  }, [userHasOrganization, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      toast.error("O nome da organização não pode estar vazio");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const organization = await createOrganization(organizationName.trim());
      
      if (organization) {
        setOrganizationName('');
        toast.success("Organização criada com sucesso!");
        // Navigate to dashboard after a short delay to allow toast to be seen
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BuildingIcon className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">Bem-vindo ao Sistema!</h1>
          <p className="mt-2 text-muted-foreground">
            Para começar, configure sua organização.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração da Organização</CardTitle>
            <CardDescription>
              Crie sua organização para gerenciar seus dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="organization-name">Nome da Organização</Label>
                  <Input
                    id="organization-name"
                    placeholder="Ex: Minha Empresa"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!organizationName.trim() || isSubmitting}
                >
                  {isSubmitting ? "Criando..." : "Criar Organização"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OrganizationSetup;
