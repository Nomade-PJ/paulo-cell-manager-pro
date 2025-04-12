
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
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Trash2, Eye, CheckCircle, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import ServicePrinter from './ServicePrinter';

interface ServiceActionsMenuProps {
  service: any;
  customerName: string;
  deviceInfo: string;
  onStatusChange?: () => void;
}

const ServiceActionsMenu = ({ 
  service, 
  customerName, 
  deviceInfo,
  onStatusChange 
}: ServiceActionsMenuProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const handleView = () => {
    navigate(`/services/${service.id}`);
  };

  const handleEdit = () => {
    navigate(`/services/${service.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;
      
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso."
      });
      
      setDeleteDialogOpen(false);
      // Refresh the list
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o serviço."
      });
    }
  };

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', service.id);

      if (error) throw error;
      
      toast({
        title: "Serviço concluído",
        description: "O serviço foi marcado como concluído."
      });
      
      setCompleteDialogOpen(false);
      // Refresh the list
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Error completing service:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status do serviço."
      });
    }
  };

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
          
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Visualizar</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          
          {service.status === 'pending' && (
            <DropdownMenuItem onClick={() => setCompleteDialogOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>Marcar como Concluído</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <ServicePrinter 
              service={service} 
              customerName={customerName} 
              deviceInfo={deviceInfo}
            >
              <div className="flex items-center">
                <Printer className="mr-2 h-4 w-4" />
                <span>Imprimir</span>
              </div>
            </ServicePrinter>
          </DropdownMenuItem>
          
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
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Este serviço será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Você deseja marcar este serviço como concluído?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ServiceActionsMenu;
