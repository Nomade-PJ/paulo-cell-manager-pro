
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, FileEdit, Trash2, Phone, UserPlus } from "lucide-react";
import { Customer } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { formatCPF, formatCNPJ } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Transform data to match Customer type
        const transformedData = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email || "",
          phone: item.phone || "",
          address: item.street && item.number ? 
            `${item.street}, ${item.number}${item.neighborhood ? `, ${item.neighborhood}` : ""}${item.city && item.state ? `, ${item.city}-${item.state}` : ""}` : "",
          document_type: item.document_type as 'cpf' | 'cnpj',
          document: item.document,
          created_at: item.created_at,
          updated_at: item.updated_at
        }));
        
        setClients(transformedData);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar clientes",
          description: "Não foi possível carregar a lista de clientes.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [refreshTrigger]);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.document && client.document.includes(searchTerm))
  );
  
  const handleNewClient = () => {
    navigate("/user-registration");
  };
  
  const handleEditClient = (clientId: string) => {
    navigate(`/user-registration?id=${clientId}`);
  };
  
  const handleDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      // First delete related services and devices due to foreign key constraints
      const { error: servicesError } = await supabase
        .from('services')
        .delete()
        .eq('customer_id', clientToDelete);
        
      if (servicesError) throw servicesError;
      
      const { error: devicesError } = await supabase
        .from('devices')
        .delete()
        .eq('customer_id', clientToDelete);
        
      if (devicesError) throw devicesError;
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', clientToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
        description: "Não foi possível excluir o cliente.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };
  
  const handleCallClient = (phone: string) => {
    if (!phone) {
      toast({
        variant: "destructive",
        title: "Telefone não disponível",
        description: "Este cliente não possui número de telefone cadastrado.",
      });
      return;
    }
    
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // For mobile devices, attempt to initiate a call
    window.location.href = `tel:${cleanPhone}`;
    
    toast({
      title: "Chamada iniciada",
      description: `Chamando ${phone}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={handleNewClient}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone ou documento..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email || "—"}</TableCell>
                  <TableCell>{client.phone || "—"}</TableCell>
                  <TableCell>
                    {client.document_type === 'cpf' 
                      ? formatCPF(client.document || "") 
                      : client.document_type === 'cnpj' 
                        ? formatCNPJ(client.document || "") 
                        : client.document || "—"}
                  </TableCell>
                  <TableCell>{client.address || "—"}</TableCell>
                  <TableCell>
                    {client.created_at 
                      ? new Date(client.created_at).toLocaleDateString('pt-BR')
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleCallClient(client.phone)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditClient(client.id)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e também excluirá todos os dispositivos e serviços associados a este cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
