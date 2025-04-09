
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = () => {
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Empty div to balance the layout on mobile */}
        <div className="w-10 lg:hidden"></div>
        
        <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-start">
          {!isMobile && (
            <div className="w-full max-w-lg">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  placeholder="Buscar..."
                  className="pl-10"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={logout} className="text-xs sm:text-sm">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
