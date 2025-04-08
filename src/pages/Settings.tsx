
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Email inválido.",
  }),
});

const Settings = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email || "",
    },
  });

  function onSubmit() {
    setIsLoading(true);
    setTimeout(() => {
      toast.success("Configurações atualizadas!");
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Configurações" 
        description="Gerencie suas preferências e configurações do sistema"
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Gerencie suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="https://github.com/shadcn.png" alt={profile?.name} />
                  <AvatarFallback>
                    {profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'PC'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Alterar foto
                  </Button>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email" {...field} disabled />
                        </FormControl>
                        <FormDescription>
                          Este é o seu email registrado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como você recebe notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Notificações por email</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações de serviços por email
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Notificações por SMS</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas via mensagem de texto
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">Resumo semanal</h3>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo semanal das atividades
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Salvar preferências</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-base font-medium">Tema</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-md p-4 cursor-pointer bg-background border-primary">
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-primary/20 rounded"></div>
                      <div className="h-8 w-full bg-primary/10 rounded"></div>
                    </div>
                    <p className="text-center mt-2 text-sm">Claro</p>
                  </div>
                  <div className="border rounded-md p-4 cursor-pointer">
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-400 rounded"></div>
                      <div className="h-8 w-full bg-gray-300 rounded"></div>
                    </div>
                    <p className="text-center mt-2 text-sm">Escuro</p>
                  </div>
                  <div className="border rounded-md p-4 cursor-pointer">
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded"></div>
                      <div className="h-8 w-full bg-gray-100 rounded"></div>
                    </div>
                    <p className="text-center mt-2 text-sm">Sistema</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Salvar preferências</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
