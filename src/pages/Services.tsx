
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileEdit, Wrench, Check, Calendar } from "lucide-react";
import { Service } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Simulação de dados (em produção seria uma chamada para a API)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockServices: Service[] = [
          {
            id: "s1",
            device_id: "d1",
            customer_id: "c1",
            status: "in_progress",
            issue_description: "Tela quebrada",
            diagnosis: "Display LCD danificado",
            solution: "Substituir tela completa",
            technician_id: "t1",
            priority: "high",
            price: 350,
            cost: 200,
            estimated_completion_date: "2024-04-10T00:00:00Z",
            created_at: "2024-04-07T10:30:00Z",
            updated_at: "2024-04-07T14:20:00Z"
          },
          {
            id: "s2",
            device_id: "d2",
            customer_id: "c2",
            status: "waiting_parts",
            issue_description: "Bateria não carrega",
            diagnosis: "Porta de carregamento danificada",
            technician_id: "t2",
            priority: "normal",
            price: 180,
            cost: 60,
            estimated_completion_date: "2024-04-15T00:00:00Z",
            created_at: "2024-04-06T09:15:00Z",
            updated_at: "2024-04-06T11:45:00Z"
          },
          {
            id: "s3",
            device_id: "d3",
            customer_id: "c3",
            status: "pending",
            issue_description: "Não liga",
            priority: "urgent",
            price: 120,
            estimated_completion_date: "2024-04-09T00:00:00Z",
            created_at: "2024-04-08T08:00:00Z",
            updated_at: "2024-04-08T08:00:00Z"
          },
          {
            id: "s4",
            device_id: "d4",
            customer_id: "c4",
            status: "completed",
            issue_description: "Tela com manchas",
            diagnosis: "Infiltração de água na tela",
            solution: "Substituição da tela",
            technician_id: "t1",
            priority: "normal",
            price: 280,
            cost: 150,
            completion_date: "2024-04-07T16:30:00Z",
            warranty_until: "2024-07-07T16:30:00Z",
            created_at: "2024-04-05T10:00:00Z",
            updated_at: "2024-04-07T16:30:00Z"
          },
          {
            id: "s5",
            device_id: "d5",
            customer_id: "c5",
            status: "delivered",
            issue_description: "Câmera não funciona",
            diagnosis: "Módulo da câmera danificado",
            solution: "Substituição do módulo de câmera",
            technician_id: "t2",
            priority: "low",
            price: 220,
            cost: 90,
            completion_date: "2024-04-06T15:45:00Z",
            warranty_until: "2024-07-06T15:45:00Z",
            created_at: "2024-04-04T14:20:00Z",
            updated_at: "2024-04-06T15:45:00Z"
          }
        ];
        
        // Check if there's registered service data in localStorage
        const storedServiceData = localStorage.getItem("registrationService");
        if (storedServiceData) {
          const serviceData = JSON.parse(storedServiceData);
          
          // Status mapping
          const statusMap: Record<string, Service["status"]> = {
            "waiting": "pending",
            "in_progress": "in_progress",
            "completed": "completed",
            "delivered": "delivered"
          };
          
          // Priority mapping based on service type
          const priorityMap: Record<string, Service["priority"]> = {
            "battery_replacement": "normal",
            "board_repair": "high",
            "charging_port": "normal",
            "software_update": "low",
            "internal_cleaning": "low",
            "other": "normal"
          };
          
          const newService: Service = {
            id: serviceData.id || `s${Math.floor(Math.random() * 10000)}`,
            device_id: serviceData.deviceId,
            customer_id: serviceData.clientId,
            status: statusMap[serviceData.status] || "pending",
            issue_description: serviceData.serviceType === "other" ? 
              serviceData.otherServiceDescription || "Serviço personalizado" : 
              getServiceDescription(serviceData.serviceType),
            technician_id: serviceData.technicianId,
            priority: priorityMap[serviceData.serviceType] || "normal",
            price: serviceData.price || 100, // Default price
            estimated_completion_date: serviceData.estimatedDate,
            warranty_until: serviceData.warrantyDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Check if service already exists by ID
          const existingServiceIndex = mockServices.findIndex(service => service.id === newService.id);
          
          if (existingServiceIndex >= 0) {
            // Replace existing service
            mockServices[existingServiceIndex] = newService;
          } else {
            // Add new service
            mockServices.unshift(newService);
          }
        }
        
        setServices(mockServices);
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Helper function to get service description based on type
  const getServiceDescription = (serviceType: string): string => {
    const descriptions: Record<string, string> = {
      "battery_replacement": "Substituição de bateria",
      "board_repair": "Reparo de placa",
      "charging_port": "Troca de conector de carga",
      "software_update": "Atualização de software",
      "internal_cleaning": "Limpeza interna",
      "other": "Serviço personalizado"
    };
    
    return descriptions[serviceType] || "Serviço não especificado";
  };

  const filteredServices = services
    .filter(service => 
      statusFilter ? service.status === statusFilter : true
    )
    .filter(service => 
      service.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: Service["status"]) => {
    const statusMap = {
      pending: { label: "Pendente", class: "bg-yellow-500" },
      in_progress: { label: "Em Andamento", class: "bg-blue-500" },
      waiting_parts: { label: "Aguardando Peças", class: "bg-purple-500" },
      completed: { label: "Concluído", class: "bg-green-500" },
      delivered: { label: "Entregue", class: "bg-green-700" },
      canceled: { label: "Cancelado", class: "bg-red-500" }
    };
    
    const statusInfo = statusMap[status];
    return (
      <Badge className={statusInfo.class}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Função para renderizar o badge de prioridade
  const renderPriorityBadge = (priority: Service["priority"]) => {
    const priorityMap = {
      low: { label: "Baixa", class: "bg-gray-400" },
      normal: { label: "Normal", class: "bg-blue-400" },
      high: { label: "Alta", class: "bg-orange-500" },
      urgent: { label: "Urgente", class: "bg-red-500" }
    };
    
    const priorityInfo = priorityMap[priority];
    return (
      <Badge className={priorityInfo.class}>
        {priorityInfo.label}
      </Badge>
    );
  };
  
  const handleNewService = () => {
    // Check if we have client and device data in localStorage
    const storedClientData = localStorage.getItem("registrationClient");
    const storedDeviceData = localStorage.getItem("registrationDevice");
    
    if (storedClientData && storedDeviceData) {
      const clientData = JSON.parse(storedClientData);
      const deviceData = JSON.parse(storedDeviceData);
      
      navigate(`/service-registration/${clientData.id}/${deviceData.id}`);
    } else {
      toast({
        title: "Dados incompletos",
        description: "Por favor, cadastre um cliente e um dispositivo primeiro.",
        variant: "destructive",
      });
      navigate("/user-registration");
    }
  };
  
  const handleEditService = (serviceId: string) => {
    toast({
      title: "Editar Serviço",
      description: `Função para editar o serviço ${serviceId} será implementada em breve.`,
    });
  };
  
  const handleStartService = (serviceId: string) => {
    toast({
      title: "Iniciar Serviço",
      description: `Função para iniciar o serviço ${serviceId} será implementada em breve.`,
    });
  };
  
  const handleCompleteService = (serviceId: string) => {
    toast({
      title: "Concluir Serviço",
      description: `Função para concluir o serviço ${serviceId} será implementada em breve.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Button onClick={handleNewService}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ordem
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou ID..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Descrição do Problema</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead>Valor</TableHead>
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
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.id}</TableCell>
                  <TableCell>{service.issue_description}</TableCell>
                  <TableCell>{renderStatusBadge(service.status)}</TableCell>
                  <TableCell>{renderPriorityBadge(service.priority)}</TableCell>
                  <TableCell>
                    {service.estimated_completion_date 
                      ? new Date(service.estimated_completion_date).toLocaleDateString('pt-BR')
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {service.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleStartService(service.id)}
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditService(service.id)}
                    >
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleCompleteService(service.id)}
                    >
                      <Check className="h-4 w-4 text-green-500" />
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

export default Services;
