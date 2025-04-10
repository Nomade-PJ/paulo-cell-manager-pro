
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

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Simulação de dados (em produção seria uma chamada para a API)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockClients: Customer[] = [
          {
            id: "c1",
            name: "João Silva",
            email: "joao.silva@email.com",
            phone: "(11) 98765-4321",
            address: "Rua das Flores, 123",
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-15T10:30:00Z"
          },
          {
            id: "c2",
            name: "Maria Oliveira",
            email: "maria.oliveira@email.com",
            phone: "(11) 91234-5678",
            address: "Av. Paulista, 1000",
            created_at: "2024-02-10T14:20:00Z",
            updated_at: "2024-02-10T14:20:00Z"
          },
          {
            id: "c3",
            name: "Pedro Santos",
            email: "pedro.santos@email.com",
            phone: "(11) 99876-5432",
            created_at: "2024-03-05T09:45:00Z",
            updated_at: "2024-03-05T09:45:00Z"
          },
          {
            id: "c4",
            name: "Ana Pereira",
            email: "ana.pereira@email.com",
            phone: "(11) 95555-1234",
            address: "Rua dos Pinheiros, 50",
            created_at: "2024-03-20T16:10:00Z",
            updated_at: "2024-03-20T16:10:00Z"
          },
          {
            id: "c5",
            name: "Carlos Ferreira",
            email: "carlos.ferreira@email.com",
            phone: "(11) 92222-3333",
            created_at: "2024-04-01T11:00:00Z",
            updated_at: "2024-04-01T11:00:00Z"
          }
        ];
        
        // Check if there's registered client data in localStorage
        const storedClientData = localStorage.getItem("registrationClient");
        if (storedClientData) {
          const clientData = JSON.parse(storedClientData);
          
          // Check if client already exists by ID
          const existingClientIndex = mockClients.findIndex(client => client.id === clientData.id);
          
          const newClient: Customer = {
            id: clientData.id,
            name: clientData.name,
            email: clientData.email || "",
            phone: clientData.phone || "",
            address: clientData.street && clientData.number ? 
              `${clientData.street}, ${clientData.number}, ${clientData.neighborhood || ""}, ${clientData.city || ""}-${clientData.state || ""}` : "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          if (existingClientIndex >= 0) {
            // Replace existing client
            mockClients[existingClientIndex] = newClient;
          } else {
            // Add new client
            mockClients.unshift(newClient);
          }
        }
        
        setClients(mockClients);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );
  
  const handleNewClient = () => {
    navigate("/user-registration");
  };
  
  const handleEditClient = (clientId: string) => {
    // In a real app, this would navigate to edit form with client ID
    toast({
      title: "Editar Cliente",
      description: `Função para editar o cliente ${clientId} será implementada em breve.`,
    });
  };
  
  const handleDeleteClient = (clientId: string) => {
    // In a real app, this would confirm deletion and then remove from database
    toast({
      title: "Excluir Cliente",
      description: `Função para excluir o cliente ${clientId} será implementada em breve.`,
      variant: "destructive",
    });
  };
  
  const handleCallClient = (phone: string) => {
    // In a real app, this might use tel: protocol or show more contact options
    toast({
      title: "Ligar para Cliente",
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
            placeholder="Buscar por nome, email ou telefone..."
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
              <TableHead>Endereço</TableHead>
              <TableHead>Data de Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.address || "—"}</TableCell>
                  <TableCell>
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
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
    </div>
  );
};

export default Clients;
