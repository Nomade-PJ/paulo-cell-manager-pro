
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

  // Se o usuário já tiver uma organização, redireciona para o dashboard
  useEffect(() => {
    if (userHasOrganization) {
      console.log("Usuário já tem organização, redirecionando para /dashboard");
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
      console.log("Tentando criar organização:", organizationName);
      const organization = await createOrganization(organizationName.trim());
      
      if (organization) {
        console.log("Organização criada com sucesso:", organization);
        setOrganizationName('');
        toast.success("Organização criada com sucesso!");
        
        // Navegue para dashboard após um pequeno atraso para permitir que o toast seja visto
        setTimeout(() => {
          console.log("Redirecionando para /dashboard");
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        console.error("Falha ao criar organização, retorno nulo");
      }
    } catch (error) {
      console.error("Erro ao criar organização:", error);
      toast.error("Houve um erro ao criar a organização. Por favor, tente novamente.");
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
