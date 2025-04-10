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
import { Plus, Search, FileEdit, Wrench, Check, Calendar, Trash2, Info } from "lucide-react";
import { Service, Customer, Device } from "@/types";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
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

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (servicesError) throw servicesError;
        
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, name');
          
        if (customersError) throw customersError;
        
        const { data: devicesData, error: devicesError } = await supabase
          .from('devices')
          .select('id, brand, model');
          
        if (devicesError) throw devicesError;
        
        const customerMap = new Map(customersData.map((c: any) => [c.id, c.name]));
        const deviceMap = new Map(devicesData.map((d: any) => [d.id, `${d.brand} ${d.model}`]));
        
        const transformedData = servicesData.map(item => {
          const serviceTypes = item.service_type.split(',').map((s: string) => s.trim());
          
          const serviceTypeLabels: Record<string, string> = {
            "battery": "Substituição de Bateria",
            "board": "Reparo de Placa",
            "connector": "Troca de Conector de Carga",
            "software": "Atualização de Software",
            "cleaning": "Limpeza Interna",
            "other": item.other_service_description || "Serviço personalizado"
          };
          
          const issue_description = serviceTypes
            .map(type => serviceTypeLabels[type] || type)
            .join(", ");
          
          return {
            id: item.id,
            device_id: item.device_id,
            device_info: deviceMap.get(item.device_id) || "Dispositivo desconhecido",
            customer_id: item.customer_id,
            customer_name: customerMap.get(item.customer_id) || "Cliente desconhecido",
            status: item.status as "pending" | "in_progress" | "waiting_parts" | "completed" | "delivered" | "canceled",
            service_type: item.service_type,
            issue_description,
            diagnosis: item.diagnosis,
            solution: item.solution,
            technician_id: item.technician_id,
            priority: item.priority as "low" | "normal" | "high" | "urgent",
            price: Number(item.price),
            cost: item.cost ? Number(item.cost) : undefined,
            estimated_completion_date: item.estimated_completion_date,
            completion_date: item.completion_date,
            warranty_until: item.warranty_until,
            created_at: item.created_at,
            updated_at: item.updated_at,
            observations: item.observations
          };
        });
        
        setServices(transformedData);
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar serviços",
          description: "Não foi possível carregar a lista de serviços.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [refreshTrigger]);

  const filteredServices = services
    .filter(service => 
      statusFilter ? service.status === statusFilter : true
    )
    .filter(service => 
      service.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.device_info.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

  const handleNewService = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(1);
        
      if (customersError) throw customersError;
      
      if (customersData.length === 0) {
        toast({
          title: "Cliente não encontrado",
          description: "Por favor, cadastre um cliente primeiro.",
          variant: "destructive",
        });
        navigate("/user-registration");
        return;
      }
      
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('id')
        .eq('customer_id', customersData[0].id)
        .limit(1);
        
      if (devicesError) throw devicesError;
      
      if (devicesData.length === 0) {
        toast({
          title: "Dispositivo não encontrado",
          description: "Por favor, cadastre um dispositivo primeiro.",
          variant: "destructive",
        });
        navigate(`/device-registration/${customersData[0].id}`);
        return;
      }
      
      navigate(`/service-registration/${customersData[0].id}/${devicesData[0].id}`);
    } catch (error) {
      console.error("Erro ao verificar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao iniciar o registro de serviço.",
      });
      navigate("/user-registration");
    }
  };

  const handleEditService = (serviceId: string) => {
    navigate(`/service-registration/${serviceId}`);
  };

  const handleStartService = async (service: Service) => {
    if (service.status === 'in_progress') {
      toast({
        description: "Este serviço já está em andamento.",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', service.id);
        
      if (error) throw error;
      
      toast({
        title: "Serviço iniciado",
        description: "Status atualizado para Em Andamento.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao iniciar serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao iniciar serviço",
        description: "Não foi possível atualizar o status do serviço.",
      });
    }
  };

  const handleCompleteService = (service: Service) => {
    setSelectedService(service);
    setStatusUpdateDialog(true);
  };

  const confirmCompleteService = async () => {
    if (!selectedService) return;
    
    try {
      const currentDate = new Date();
      const warrantyMonths = parseInt(selectedService.warranty_period || '3');
      const warrantyDate = new Date(currentDate);
      warrantyDate.setMonth(currentDate.getMonth() + warrantyMonths);
      
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'completed', 
          completion_date: currentDate.toISOString(),
          warranty_until: warrantyDate.toISOString(),
          updated_at: currentDate.toISOString()
        })
        .eq('id', selectedService.id);
        
      if (error) throw error;
      
      toast({
        title: "Serviço concluído",
        description: "Status atualizado para Concluído.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao concluir serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao concluir serviço",
        description: "Não foi possível atualizar o status do serviço.",
      });
    } finally {
      setStatusUpdateDialog(false);
      setSelectedService(null);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete);
        
      if (error) throw error;
      
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir serviço",
        description: "Não foi possível excluir o serviço.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setDetailsDialogOpen(true);
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
            placeholder="Buscar por descrição, cliente ou dispositivo..."
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
            <SelectItem value="todos">Todos</SelectItem>
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
              <TableHead>Cliente</TableHead>
              <TableHead>Dispositivo</TableHead>
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
                <TableCell colSpan={9} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  Nenhum serviço encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.id.substring(0, 8)}</TableCell>
                  <TableCell>{service.customer_name}</TableCell>
                  <TableCell>{service.device_info}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={service.issue_description}>
                    {service.issue_description}
                  </TableCell>
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
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleViewDetails(service)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleStartService(service)}
                      disabled={service.status === 'completed' || service.status === 'delivered' || service.status === 'canceled'}
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
                      onClick={() => handleCompleteService(service)}
                      disabled={service.status === 'completed' || service.status === 'delivered' || service.status === 'canceled'}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteService(service.id)}
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
      
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Serviço</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedService.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dispositivo</p>
                  <p className="font-medium">{selectedService.device_info}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Tipo de Serviço</p>
                <p>{selectedService.issue_description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{renderStatusBadge(selectedService.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Prioridade</p>
                  <div className="mt-1">{renderPriorityBadge(selectedService.priority)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Previsão de Conclusão</p>
                  <p>
                    {selectedService.estimated_completion_date 
                      ? new Date(selectedService.estimated_completion_date).toLocaleDateString('pt-BR')
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Conclusão</p>
                  <p>
                    {selectedService.completion_date 
                      ? new Date(selectedService.completion_date).toLocaleDateString('pt-BR')
                      : "—"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Valor</p>
                  <p className="font-medium">
                    {selectedService.price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Garantia até</p>
                  <p>
                    {selectedService.warranty_until 
                      ? new Date(selectedService.warranty_until).toLocaleDateString('pt-BR')
                      : "—"}
                  </p>
                </div>
              </div>
              
              {selectedService.observations && (
                <div>
                  <p className="text-sm text-gray-500">Observações</p>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                    {selectedService.observations}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar conclusão do serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar este serviço como concluído? Isso atualizará o status e registrará a data de conclusão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCompleteService}
              className="bg-green-500 hover:bg-green-600"
            >
              Concluir Serviço
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogAction
              onClick={confirmDeleteService}
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

export default Services;
