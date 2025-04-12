
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
import { Edit, MoreHorizontal, Trash2, Eye, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabaseClient';
import { toast } from '@/components/ui/use-toast';

interface ClientActionsMenuProps {
  client: {
    id: string;
    name: string;
    phone?: string | null;
  };
  onDelete?: (id: string) => void;
}

const ClientActionsMenu = ({ client, onDelete }: ClientActionsMenuProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleView = () => {
    navigate(`/clients/${client.id}`);
  };

  const handleEdit = () => {
    navigate(`/clients/${client.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      if (onDelete) {
        onDelete(client.id);
        setDeleteDialogOpen(false);
        toast({
          title: "Cliente excluído",
          description: "O cliente foi excluído com sucesso."
        });
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o cliente."
      });
    }
  };

  const handleCall = () => {
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
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
          
          {client.phone && (
            <DropdownMenuItem onClick={handleCall}>
              <Phone className="mr-2 h-4 w-4" />
              <span>Ligar</span>
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
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Este cliente será permanentemente excluído.
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
    </>
  );
};

export default ClientActionsMenu;
