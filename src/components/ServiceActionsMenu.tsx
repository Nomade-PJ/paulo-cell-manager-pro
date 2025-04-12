import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Eye, 
  Printer, 
  ClipboardList, 
  CheckCircle,
  Download,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import ServiceThermalPrinter from './ServiceThermalPrinter';

interface ServiceActionsMenuProps {
  service: any;
  onUpdate?: () => void;
}

const ServiceActionsMenu = ({ service, onUpdate }: ServiceActionsMenuProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleEdit = () => {
    navigate(`/dashboard/service-registration/${service.customer_id}/${service.device_id}?serviceId=${service.id}`);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq('id', service.id);
        
      if (error) throw error;
      
      setDeleteDialogOpen(false);
      
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso."
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o serviço."
      });
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', service.id);
        
      if (error) throw error;
      
      const statusNames = {
        pending: "Pendente",
        in_progress: "Em andamento",
        waiting_parts: "Aguardando peças",
        completed: "Concluído",
        delivered: "Entregue"
      };
      
      toast({
        title: "Status atualizado",
        description: `O serviço agora está ${statusNames[newStatus as keyof typeof statusNames]}.`
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o status do serviço."
      });
    }
  };

  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
  };

  // Format values for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusName = (status: string) => {
    const statusNames = {
      pending: "Pendente",
      in_progress: "Em andamento",
      waiting_parts: "Aguardando peças",
      completed: "Concluído",
      delivered: "Entregue"
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getServiceTypeName = (type: string) => {
    const serviceTypes = {
      screen_repair: "Troca de Tela",
      battery_replacement: "Troca de Bateria",
      water_damage: "Dano por Água",
      software_issue: "Problema de Software",
      charging_port: "Porta de Carregamento",
      button_repair: "Reparo de Botões",
      camera_repair: "Reparo de Câmera",
      mic_speaker_repair: "Reparo de Microfone/Alto-falante",
      diagnostics: "Diagnóstico Completo",
      unlocking: "Desbloqueio",
      data_recovery: "Recuperação de Dados",
    };
    
    return type === 'other' 
      ? service.other_service_description 
      : serviceTypes[type as keyof typeof serviceTypes] || type;
  };

  // Disable status options that don't make sense (e.g., can't go backward from delivered)
  const canChangeToInProgress = service.status !== 'completed' && service.status !== 'delivered';
  const canChangeToWaitingParts = service.status !== 'completed' && service.status !== 'delivered';
  const canChangeToCompleted = service.status !== 'delivered';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Visualizar</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <ServiceThermalPrinter service={service}>
              <Printer className="mr-2 h-4 w-4" />
              <span>Imprimir térmica</span>
            </ServiceThermalPrinter>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
          
          {service.status !== 'pending' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('pending')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Marcar como Pendente</span>
            </DropdownMenuItem>
          )}
          
          {canChangeToInProgress && service.status !== 'in_progress' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('in_progress')}>
              <ClipboardList className="mr-2 h-4 w-4 text-blue-500" />
              <span>Marcar como Em Andamento</span>
            </DropdownMenuItem>
          )}
          
          {canChangeToWaitingParts && service.status !== 'waiting_parts' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('waiting_parts')}>
              <ClipboardList className="mr-2 h-4 w-4 text-purple-500" />
              <span>Marcar como Aguardando Peças</span>
            </DropdownMenuItem>
          )}
          
          {canChangeToCompleted && service.status !== 'completed' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('completed')}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Marcar como Concluído</span>
            </DropdownMenuItem>
          )}
          
          {service.status !== 'delivered' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('delivered')}>
              <CheckCircle className="mr-2 h-4 w-4 text-gray-500" />
              <span>Marcar como Entregue</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Serviço</DialogTitle>
            <DialogDescription>
              Informações completas da ordem de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Informações do Serviço</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Tipo:</span> {getServiceTypeName(service.service_type)}</p>
                  <p><span className="font-medium">Status:</span> {getStatusName(service.status)}</p>
                  <p><span className="font-medium">Valor:</span> {formatCurrency(service.price)}</p>
                  <p><span className="font-medium">Data de Criação:</span> {formatDate(service.created_at)}</p>
                  {service.updated_at && (
                    <p><span className="font-medium">Última Atualização:</span> {formatDate(service.updated_at)}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Cliente e Dispositivo</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Cliente:</span> {service.customers?.name || "Cliente não encontrado"}</p>
                  <p>
                    <span className="font-medium">Dispositivo:</span> 
                    {service.devices ? `${service.devices.brand} ${service.devices.model}` : "Dispositivo não encontrado"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium">Descrição do Serviço</h4>
              <div className="mt-2">
                <p className="text-sm whitespace-pre-wrap">{service.description || "Sem descrição detalhada"}</p>
              </div>
            </div>

            {service.diagnosis && (
              <div className="border-t pt-4">
                <h4 className="font-medium">Diagnóstico</h4>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap">{service.diagnosis}</p>
                </div>
              </div>
            )}
            
            {service.parts_used && (
              <div className="border-t pt-4">
                <h4 className="font-medium">Peças Utilizadas</h4>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap">{service.parts_used}</p>
                </div>
              </div>
            )}
            
            {service.notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium">Observações</h4>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleEdit();
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Serviço
                </Button>
                
                <ServiceThermalPrinter service={service}>
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Comprovante
                  </Button>
                </ServiceThermalPrinter>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceActionsMenu;
