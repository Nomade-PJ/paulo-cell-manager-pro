import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "@/contexts/ThemeContext";

import { Moon, Sun, Upload, Loader2 } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  email: z.string().email({
    message: 'Email inválido.',
  }),
  avatarUrl: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  weeklySummary: z.boolean().default(true),
});

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark']),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const Settings = () => {
  const { user, refreshProfile } = useAuth();
  const { theme: currentTheme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      avatarUrl: '',
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      weeklySummary: true,
    },
  });

  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: 'light',
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (profileData) {
          profileForm.setValue('name', profileData.name || '');
          profileForm.setValue('email', user.email || '');
          setAvatarUrl(profileData.avatar_url || null);
          setAvatarPreview(profileData.avatar_url || null);
        } else {
          const defaultName = user.email ? user.email.split('@')[0] : '';
          profileForm.setValue('name', defaultName);
          profileForm.setValue('email', user.email || '');
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        if (settingsData) {
          notificationForm.setValue('emailNotifications', settingsData.email_notifications || false);
          notificationForm.setValue('smsNotifications', settingsData.sms_notifications || false);
          notificationForm.setValue('weeklySummary', settingsData.weekly_summary || false);
          appearanceForm.setValue('theme', settingsData.theme as 'light' | 'dark' || 'light');
        }

        if (settingsData?.theme) {
          document.documentElement.classList.toggle('dark', settingsData.theme === 'dark');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar as configurações.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, profileForm, notificationForm, appearanceForm]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      try {
        setUploadingAvatar(true);
        
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        const publicUrl = publicUrlData.publicUrl;
        setAvatarUrl(publicUrl);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
        
        toast({
          title: 'Imagem Atualizada',
          description: 'Sua foto de perfil foi atualizada com sucesso.'
        });
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível atualizar sua foto de perfil.'
        });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: data.name,
          email: user.email,
          created_at: now,
          updated_at: now,
          role: 'Usuário'
        }, { onConflict: 'id' });
        
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações pessoais foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onNotificationSubmit = async (data: NotificationFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          email_notifications: data.emailNotifications,
          sms_notifications: data.smsNotifications,
          weekly_summary: data.weeklySummary,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      toast({
        title: "Notificações atualizadas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar as preferências de notificação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAppearanceSubmit = async (data: AppearanceFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await setTheme(data.theme);
      
      toast({
        title: 'Aparência atualizada',
        description: 'Suas preferências de tema foram atualizadas.',
      });
    } catch (error) {
      console.error('Error updating appearance settings:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar as preferências de aparência.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-5rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  {uploadingAvatar ? (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <AvatarImage src={avatarPreview || undefined} alt="Avatar" />
                      <AvatarFallback className="text-2xl">
                        {profileForm.getValues('name')?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                
                <div className="flex items-center">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3">
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Carregando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Alterar foto</span>
                        </>
                      )}
                    </div>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
              </div>
              
              <Separator />
              
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
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
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} disabled readOnly className="bg-muted" />
                        </FormControl>
                        <FormDescription>
                          O email não pode ser alterado.
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
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure suas preferências de notificação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-8">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notificações por Email</FormLabel>
                          <FormDescription>
                            Receba atualizações e alertas por email.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="smsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notificações por SMS</FormLabel>
                          <FormDescription>
                            Receba atualizações e alertas por mensagem de texto.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="weeklySummary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Resumo Semanal</FormLabel>
                          <FormDescription>
                            Receba um resumo semanal das atividades.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar preferências"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-8">
                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema</FormLabel>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div 
                            className={`flex flex-col items-center gap-2 rounded-md border-2 p-4 cursor-pointer ${field.value === 'light' ? 'border-primary' : 'border-muted'}`}
                            onClick={() => field.onChange('light')}
                          >
                            <Sun className="h-6 w-6" />
                            <span>Claro</span>
                          </div>
                          <div 
                            className={`flex flex-col items-center gap-2 rounded-md border-2 p-4 cursor-pointer ${field.value === 'dark' ? 'border-primary' : 'border-muted'}`}
                            onClick={() => field.onChange('dark')}
                          >
                            <Moon className="h-6 w-6" />
                            <span>Escuro</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Aplicando..." : "Aplicar tema"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
