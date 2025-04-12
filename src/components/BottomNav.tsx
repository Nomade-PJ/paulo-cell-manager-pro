import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Wrench, 
  MoreHorizontal,
  Package, 
  FileText,
  BarChart3,
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

// Tipos para notificações
type NotificationCounts = {
  documents: number;
  inventory: number;
  services: number;
  devices: number;
};

// Itens de navegação prioritários (máximo 5)
const primaryNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", notificationType: null },
  { icon: Users, label: "Clientes", path: "/dashboard/clients", notificationType: null },
  { icon: Smartphone, label: "Dispositivos", path: "/dashboard/devices", notificationType: "devices" },
  { icon: Wrench, label: "Serviços", path: "/dashboard/services", notificationType: "services" }
];

// Itens secundários para o menu expansível
const secondaryNavItems = [
  { icon: Package, label: "Estoque", path: "/dashboard/inventory", notificationType: "inventory" },
  { icon: FileText, label: "Documentos", path: "/dashboard/documents", notificationType: "documents" },
  { icon: BarChart3, label: "Relatórios", path: "/dashboard/reports", notificationType: null },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings", notificationType: null },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    documents: 0,
    inventory: 0,
    services: 0,
    devices: 0
  });

  // Verificar se a localização atual corresponde a um caminho (incluindo subcaminhos)
  const isActiveRoute = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/dashboard";
  };

  // Carregar contagem de notificações
  useEffect(() => {
    if (!user) return;

    const fetchNotificationCounts = async () => {
      try {
        // Contar notificações não lidas por tipo
        const { data, error } = await supabase
          .from('notifications')
          .select('type')
          .eq('user_id', user.id)
          .eq('read', false)
          .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 7 dias

        if (error) {
          console.error('Erro ao buscar notificações:', error);
          return;
        }

        // Contar manualmente as notificações por tipo
        const counts: NotificationCounts = { documents: 0, inventory: 0, services: 0, devices: 0 };
        data?.forEach(item => {
          if (item.type in counts) {
            counts[item.type as keyof NotificationCounts]++;
          }
        });

        setNotificationCounts(counts);
      } catch (error) {
        console.error("Erro ao carregar contagem de notificações:", error);
      }
    };

    fetchNotificationCounts();

    // Inscrever para atualizações em tempo real
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
          // Ao receber qualquer mudança, atualizar contagens
          fetchNotificationCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <>
      {/* Barra de navegação fixa na parte inferior - agora flutuante com bordas arredondadas */}
      <div className="fixed bottom-4 left-4 right-4 bg-sidebar text-sidebar-foreground h-16 rounded-full shadow-lg px-2 flex items-center justify-around z-50 bottom-nav">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center px-3 py-1 rounded-md transition-colors bottom-nav-item relative",
                isActiveRoute(item.path)
                  ? "text-sidebar-primary active"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )
            }
            end={item.path === "/dashboard"}
          >
            <div className="relative">
              <item.icon className="h-5 w-5 mb-1" aria-hidden="true" />
              {item.notificationType && notificationCounts[item.notificationType as keyof NotificationCounts] > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[8px]"
                >
                  {notificationCounts[item.notificationType as keyof NotificationCounts]}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
            <span className="nav-item-ripple"></span>
          </NavLink>
        ))}

        {/* Botão "Mais" para abrir menu expansível */}
        <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DrawerTrigger asChild>
            <button
              className="flex flex-col items-center justify-center px-3 py-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground bottom-nav-item relative"
            >
              <MoreHorizontal className="h-5 w-5 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">Mais</span>
              <span className="nav-item-ripple"></span>
              
              {/* Badge combinando todas as notificações de itens secundários */}
              {(notificationCounts.documents > 0 || notificationCounts.inventory > 0) && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 right-1 h-4 w-4 flex items-center justify-center p-0 text-[8px]"
                >
                  {notificationCounts.documents + notificationCounts.inventory}
                </Badge>
              )}
            </button>
          </DrawerTrigger>
          <DrawerContent className="bg-sidebar text-sidebar-foreground more-drawer-content">
            <DrawerHeader>
              <DrawerTitle className="text-sidebar-foreground">Mais opções</DrawerTitle>
              <DrawerDescription className="text-sidebar-foreground/70">
                Acesse outras funcionalidades do sistema
              </DrawerDescription>
            </DrawerHeader>
            <div className="grid grid-cols-2 gap-4 p-4">
              {secondaryNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg border border-sidebar-border transition-colors relative",
                      isActiveRoute(item.path)
                        ? "bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary"
                        : "hover:bg-sidebar-accent/50"
                    )
                  }
                >
                  <div className="relative">
                    <item.icon className="h-6 w-6 mb-2" aria-hidden="true" />
                    {item.notificationType && notificationCounts[item.notificationType as keyof NotificationCounts] > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[8px]"
                      >
                        {notificationCounts[item.notificationType as keyof NotificationCounts]}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="default" className="w-full bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent border border-sidebar-border font-semibold">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
      
      {/* Espaçador para compensar a altura da barra de navegação */}
      <div className="h-20" />
    </>
  );
};

export default BottomNav; 