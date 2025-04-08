
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
import { Plus, Search, FileEdit, Trash2, Phone } from "lucide-react";
import { Customer } from "@/types";

const Clients = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
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
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
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
