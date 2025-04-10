
import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Eye, 
  FileEdit, 
  Trash2, 
  ArrowUpDown,
  CheckCircle2,
  Hourglass,
  AlertCircle,
  Clock,
  PackageCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: string;
  customer_id: string;
  device_id: string;
  status: "pending" | "in_progress" | "waiting_parts" | "completed" | "delivered";
  service_type: string;
  other_service_description: string | null;
  price: number;
  estimated_completion_date: string | null;
  completion_date: string | null;
  warranty_period: string | null;
  warranty_until: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  device_info?: string;
}

const STATUS_LABELS: Record<string, string> = {
  "pending": "Pendente",
  "in_progress": "Em andamento",
  "waiting_parts": "Aguardando peças",
  "completed": "Concluído",
  "delivered": "Entregue"
};

const STATUS_COLORS: Record<string, string> = {
  "pending": "bg-yellow-500",
  "in_progress": "bg-blue-500",
  "waiting_parts": "bg-purple-500",
  "completed": "bg-green-500",
  "delivered": "bg-gray-500"
};

const SERVICE_TYPES: Record<string, string> = {
  "screen_repair": "Troca de Tela",
  "battery_replacement": "Troca de Bateria",
  "water_damage": "Dano por Água",
  "software_issue": "Problema de Software",
  "charging_port": "Porta de Carregamento",
  "button_repair": "Reparo de Botões",
  "camera_repair": "Reparo de Câmera",
  "mic_speaker_repair": "Reparo de Microfone/Alto-falante",
  "diagnostics": "Diagnóstico Completo",
  "unlocking": "Desbloqueio",
  "data_recovery": "Recuperação de Dados",
  "other": "Outro"
};

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchServices();
  }, [refreshTrigger, sortBy, sortOrder]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          customers:customer_id (name),
          devices:device_id (brand, model)
        `)
        .order(sortBy, { ascending: sortOrder === "asc" });
        
      if (error) throw error;
      
      // Process data to include customer name and device info
      const processedServices = data.map((service: any) => ({
        ...service,
        customer_name: service.customers?.name || 'Cliente não encontrado',
        device_info: service.devices 
          ? `${service.devices.brand} ${service.devices.model}` 
          : 'Dispositivo não encontrado'
      }));
      
      setServices(processedServices);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os serviços.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    
    try {
      const { error } = await supabase
        .from("services")
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
        title: "Erro ao excluir",
        description: "Não foi possível excluir o serviço.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };
  
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  // Edit service
  const handleEditService = (clientId: string, deviceId: string, serviceId: string) => {
    navigate(`/service-registration/${clientId}/${deviceId}?serviceId=${serviceId}`);
  };
  
  // Create new service
  const handleNewService = () => {
    navigate("/clients");
  };
  
  // Filter services based on search term and status
  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.device_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (SERVICE_TYPES[service.service_type] || service.service_type).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.other_service_description && service.other_service_description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "" || service.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Function to get the status badge for a service
  const renderStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status] || status;
    const colorClass = STATUS_COLORS[status] || "bg-gray-500";
    
    let icon;
    switch (status) {
      case "pending":
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;
      case "in_progress":
        icon = <Hourglass className="h-3 w-3 mr-1" />;
        break;
      case "waiting_parts":
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        break;
      case "completed":
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "delivered":
        icon = <PackageCheck className="h-3 w-3 mr-1" />;
        break;
      default:
        icon = null;
    }
    
    return (
      <Badge className={`flex items-center ${colorClass}`}>
        {icon}
        {label}
      </Badge>
    );
  };
  
  // Function to render warranty status
  const renderWarrantyStatus = (service: Service) => {
    if (!service.warranty_until) return null;
    
    const warrantyDate = new Date(service.warranty_until);
    const isValid = isAfter(warrantyDate, new Date());
    
    return (
      <Badge className={isValid ? "bg-green-500" : "bg-red-500"}>
        {isValid ? "Na garantia" : "Fora da garantia"}
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Button onClick={handleNewService}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, dispositivo ou tipo de serviço..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px] cursor-pointer" onClick={() => handleSortChange("customers.name")}>
                  <div className="flex items-center">
                    Cliente
                    {sortBy === "customers.name" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">Dispositivo</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSortChange("status")}>
                  <div className="flex items-center">
                    Status
                    {sortBy === "status" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSortChange("price")}>
                  <div className="flex items-center justify-end">
                    Preço
                    {sortBy === "price" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSortChange("created_at")}>
                  <div className="flex items-center justify-end">
                    Data
                    {sortBy === "created_at" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
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
                    <TableCell className="font-medium">{service.customer_name}</TableCell>
                    <TableCell>{service.device_info}</TableCell>
                    <TableCell>{renderStatusBadge(service.status)}</TableCell>
                    <TableCell>
                      {service.service_type === "other" 
                        ? service.other_service_description 
                        : SERVICE_TYPES[service.service_type] || service.service_type}
                    </TableCell>
                    <TableCell className="text-right">R$ {service.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(service.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditService(service.customer_id, service.device_id, service.id)}
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteClick(service.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
            <AlertDialogAction
              onClick={confirmDelete}
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
