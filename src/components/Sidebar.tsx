
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Wrench, 
  Package, 
  Settings, 
  BarChart3, 
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "Clientes", path: "/clients" },
    { icon: Smartphone, label: "Dispositivos", path: "/devices" },
    { icon: Wrench, label: "Serviços", path: "/services" },
    { icon: Package, label: "Estoque", path: "/inventory" },
    { icon: BarChart3, label: "Relatórios", path: "/reports" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  // Safely access user properties
  const userInitials = user?.email 
    ? user.email.charAt(0).toUpperCase()
    : "U";
  
  const displayName = user?.email 
    ? user.email.split('@')[0] 
    : "Usuário";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold">Paulo Cell</h1>
      </div>

      <div className="flex flex-col items-center py-4 px-2">
        <div className="w-16 h-16 rounded-full bg-sidebar-accent flex items-center justify-center text-xl font-semibold">
          {userInitials}
        </div>
        <div className="mt-2 text-center">
          <p className="font-medium">{displayName}</p>
          <p className="text-sm text-sidebar-foreground/70">{user?.role || "Usuário"}</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-2.5 text-sm font-medium rounded-md",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
            onClick={() => isMobile && setOpen(false)}
            end={item.path === "/"}
          >
            <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-sidebar-border">
        <p className="text-xs text-center text-sidebar-foreground/50">
          Paulo Cell Manager v1.0.0
        </p>
      </div>
    </div>
  );

  // Mobile sidebar with Sheet component
  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden z-10 fixed top-3 left-3">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[250px] bg-sidebar text-sidebar-foreground">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
