
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, MoreHorizontal, Trash2, Eye, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const handleView = () => {
    navigate(`/clients/${client.id}`);
  };

  const handleEdit = () => {
    navigate(`/clients/${client.id}/edit`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(client.id);
    }
  };

  const handleCall = () => {
    if (client.phone) {
      window.location.href = `tel:${client.phone}`;
    }
  };

  return (
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
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ClientActionsMenu;
