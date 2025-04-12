import React, { useState, useEffect } from "react";
import { Bell, DollarSign, Wrench, Package, FileText, Sparkles, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabaseClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Tipo para as notificações
type Notification = {
  id: string;
  user_id: string;
  type: 'service' | 'inventory' | 'payment' | 'document' | 'system';
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  action_link?: string;
  related_id?: string;
};

const Header = () => {
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Função para carregar notificações do usuário
  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar notificações no Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar notificações:", error);
      toast.error("Não foi possível carregar as notificações");
    } finally {
      setLoading(false);
    }
  };
  
  // Função para marcar notificação como lida
  const markAsRead = async (notificationId: string, actionLink?: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      // Atualizar estado localmente
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? {...n, read: true} : n)
      );
      
      // Se tiver um link de ação, navegue para ele
      if (actionLink) {
        setOpen(false);
        navigate(actionLink);
      }
    } catch (error: any) {
      console.error("Erro ao marcar notificação como lida:", error);
      toast.error("Não foi possível atualizar a notificação");
    }
  };
  
  // Função para marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      if (!user) return;
      
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      // Atualizar estado localmente
      setNotifications(prev => prev.map(n => ({...n, read: true})));
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error: any) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      toast.error("Não foi possível atualizar as notificações");
    }
  };
  
  // Carregar notificações ao iniciar
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Assinar para atualizações em tempo real
      const subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}` 
          }, 
          (payload) => {
            // Adicionar nova notificação ao estado
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Mostrar toast para notificação recebida
            toast.info(newNotification.title, {
              description: newNotification.description,
              position: 'top-right'
            });
          }
        )
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);
  
  // Contagem de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Renderizar ícone correspondente ao tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'inventory':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'system':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays < 7) {
      return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };
  
  return (
    <header className="bg-background border-b border-border sticky top-0 z-10">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Empty div to balance the layout on mobile */}
        <div className="w-10 lg:hidden"></div>
        
        <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
          {/* Search input removed */}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs flex items-center" 
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <ScrollArea className="h-[300px]">
                <DropdownMenuGroup>
                  {loading ? (
                    <div className="flex justify-center items-center py-4">
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                      <span className="text-sm text-muted-foreground">Carregando...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={`cursor-pointer py-2 px-3 ${!notification.read ? 'bg-primary/5' : ''}`}
                        onClick={() => markAsRead(notification.id, notification.action_link)}
                      >
                        <div className="flex gap-2 w-full">
                          <div className="pt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary rounded-full mt-1 flex-shrink-0"></div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={logout} className="text-xs sm:text-sm">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
