import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Smartphone, Settings, Users, Mail, Phone, Github } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LandingPage = () => {
  const navigate = useNavigate();
  const [developerContactOpen, setDeveloperContactOpen] = useState(false);

  const handleEnter = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page min-h-screen flex flex-col items-center justify-between p-6 bg-sidebar text-sidebar-foreground">
      {/* Cabeçalho e conteúdo principal */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center text-center">
        {/* Ícone do Smartphone */}
        <div className="mb-6 bg-blue-500/20 p-6 rounded-full inline-flex items-center justify-center shadow-md icon-container">
          <Smartphone className="h-12 w-12 text-blue-400" />
        </div>
        
        {/* Título */}
        <h1 className="text-5xl font-bold text-blue-400 mb-4">Paulo Cell Sistema</h1>
        
        {/* Subtítulo */}
        <h2 className="text-xl text-gray-200 mb-8">
          Sistema de Gerenciamento para Assistência Técnica
        </h2>
        
        {/* Descrição */}
        <p className="text-gray-300 mb-12 max-w-2xl">
          Gerencie clientes, dispositivos e serviços de reparo com facilidade e eficiência.
        </p>
        
        {/* Cards de recursos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          {/* Card de Dispositivos */}
          <div className="feature-card p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4 bg-blue-500/20 p-3 rounded-full w-16 h-16 mx-auto icon-container">
              <Smartphone className="h-10 w-10 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Dispositivos</h3>
            <p className="text-sm text-gray-300">
              Cadastre e acompanhe o histórico de dispositivos
            </p>
          </div>
          
          {/* Card de Serviços */}
          <div className="feature-card p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4 bg-yellow-500/20 p-3 rounded-full w-16 h-16 mx-auto icon-container">
              <Settings className="h-10 w-10 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Serviços</h3>
            <p className="text-sm text-gray-300">
              Gerencie ordens de serviço e reparos
            </p>
          </div>
          
          {/* Card de Clientes */}
          <div className="feature-card p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4 bg-green-500/20 p-3 rounded-full w-16 h-16 mx-auto icon-container">
              <Users className="h-10 w-10 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Clientes</h3>
            <p className="text-sm text-gray-300">
              Mantenha um cadastro completo de clientes
            </p>
          </div>
        </div>
        
        {/* Botão de entrada */}
        <Button 
          onClick={handleEnter} 
          className="enter-button px-8 py-6 text-lg shadow-lg"
        >
          Entrar no Sistema
        </Button>
      </div>
      
      {/* Rodapé */}
      <footer className="w-full mt-8 text-center text-sm text-gray-300">
        <p>© 2025 Paulo Cell Sistema - Todos os direitos reservados</p>
        <p className="mt-1 text-xs text-gray-400">
          Sistema Desenvolvido por{" "}
          <button 
            onClick={() => setDeveloperContactOpen(true)}
            className="text-blue-400 hover:underline focus:outline-none"
          >
            Nomade-PJ
          </button>
        </p>
      </footer>

      {/* Developer Contact Dialog */}
      <Dialog open={developerContactOpen} onOpenChange={setDeveloperContactOpen}>
        <DialogContent className="sm:max-w-md bg-sidebar text-sidebar-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-100">Contato com o Desenvolvedor</DialogTitle>
            <DialogDescription className="text-gray-300">
              Entre em contato com o desenvolvedor do projeto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <a 
              href="mailto:josecarlosdev24h@gmail.com" 
              className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-blue-500/20 p-2 rounded-full icon-container">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">Email</p>
                <p className="text-sm text-gray-300">josecarlosdev24h@gmail.com</p>
              </div>
            </a>
            
            <a 
              href="https://wa.me/5598992022352" 
              className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-green-500/20 p-2 rounded-full icon-container">
                <Phone className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">WhatsApp</p>
                <p className="text-sm text-gray-300">(98) 99202-2352</p>
              </div>
            </a>
            
            <a 
              href="https://github.com/Nomade-PJ" 
              className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-800 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="bg-purple-500/20 p-2 rounded-full icon-container">
                <Github className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-100">GitHub</p>
                <p className="text-sm text-gray-300">Nomade-PJ</p>
              </div>
            </a>
          </div>
          
          <div className="pt-4 text-center text-xs text-gray-400">
            ©Todos os direitos reserved - NomadePJ/Jose Carlos
          </div>
          
          <div className="mt-4 flex justify-center">
            <Button 
              className="enter-button px-8 py-2"
              onClick={() => setDeveloperContactOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage; 